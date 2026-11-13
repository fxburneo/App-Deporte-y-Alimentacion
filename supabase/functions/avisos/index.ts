// Avisos en el iPhone (etapa 7, Web Push). La llaman las tareas programadas
// de Supabase (x-sync-token), tp-sync cuando el coach cambia el plan, y la
// app con la sesión del usuario (aviso de prueba).
// Las claves VAPID se generan aquí la primera vez y quedan en app_config: la
// privada nunca sale de la base de datos. Responde solo un resumen.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import {
  avisoDormir,
  avisoFatiga,
  avisoManana,
  avisoPeso,
  avisoRegistrar,
  avisoResumen,
  hayFatiga,
  type Aviso,
} from "./mensajes.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-token",
};
const responder = (cuerpo: unknown, status = 200) => Response.json(cuerpo, { status, headers: CORS });
const fechaEc = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(d);
const sumar = (f: string, n: number) => new Date(new Date(f + "T12:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);
const TIPOS = ["resumen", "peso", "plan_cambia", "registrar", "manana", "dormir", "prueba", "claves"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // 1. ¿Quién llama?
  let userId: string | null = null;
  let deTarea = false;
  const tokenSync = req.headers.get("x-sync-token");
  if (tokenSync) {
    const { data } = await db.from("app_config").select("valor").eq("clave", "sync_token").maybeSingle();
    if (!data || data.valor !== tokenSync) return responder({ ok: false, error: "no autorizado" }, 401);
    const { data: p } = await db.from("perfil").select("user_id").limit(1).maybeSingle();
    userId = p?.user_id ?? null;
    deTarea = true;
  } else {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data } = await db.auth.getUser(jwt);
    userId = data.user?.id ?? null;
  }
  if (!userId) return responder({ ok: false, error: "no autorizado" }, 401);

  const cuerpo = await req.json().catch(() => ({}));
  const tipo = String(cuerpo?.tipo ?? "") as (typeof TIPOS)[number];
  if (!TIPOS.includes(tipo)) return responder({ ok: false, error: "tipo desconocido" }, 400);
  if (!deTarea && tipo !== "prueba" && tipo !== "claves") return responder({ ok: false, error: "no autorizado" }, 401);

  // 2. Claves VAPID: se crean una sola vez.
  const { data: conf } = await db.from("app_config").select("clave, valor").in("clave", ["vapid_publica", "vapid_privada"]);
  let publica = conf?.find((c) => c.clave === "vapid_publica")?.valor;
  let privada = conf?.find((c) => c.clave === "vapid_privada")?.valor;
  if (!publica || !privada) {
    const k = webpush.generateVAPIDKeys();
    publica = k.publicKey;
    privada = k.privateKey;
    await db.from("app_config").upsert([
      { clave: "vapid_publica", valor: publica },
      { clave: "vapid_privada", valor: privada },
    ]);
  }
  if (tipo === "claves") return responder({ ok: true });
  webpush.setVapidDetails("https://app-deporte-y-alimentacion.vercel.app", publica, privada);

  // 3. Armar los avisos.
  const hoy = fechaEc();
  const manana = sumar(hoy, 1);
  const { data: perfil } = await db.from("perfil").select("avisos, dias_pesaje").eq("user_id", userId).single();
  const activos = (perfil?.avisos ?? {}) as Record<string, boolean>;
  if (tipo !== "prueba" && activos[tipo] === false) return responder({ ok: true, enviados: 0, motivo: "aviso desactivado" });

  const entrenosDe = async (fecha: string) =>
    (await db.from("entrenos").select("deporte, duracion_min, intensidad, estado, hora, nombre").eq("user_id", userId).eq("fecha", fecha).order("hora")).data ?? [];
  const avisos: Aviso[] = [];
  if (tipo === "prueba") avisos.push({ titulo: "FXB Performance", cuerpo: "Los avisos funcionan en este iPhone.", url: "/" });
  if (tipo === "plan_cambia" && cuerpo?.aviso?.titulo) avisos.push(cuerpo.aviso as Aviso);
  if (tipo === "manana") avisos.push(avisoManana(manana, await entrenosDe(manana)));
  if (tipo === "dormir") avisos.push(avisoDormir(await entrenosDe(manana)));
  if (tipo === "peso") {
    const { data: pesos } = await db.from("pesos").select("id").eq("user_id", userId).eq("fecha", hoy);
    const dia = new Date(hoy + "T12:00:00Z").getUTCDay();
    const a = avisoPeso(perfil?.dias_pesaje ?? [], dia, (pesos ?? []).length > 0);
    if (a) avisos.push(a);
  }
  if (tipo === "registrar") {
    const { data: comidas } = await db.from("comidas").select("comida").eq("user_id", userId).eq("fecha", hoy);
    const a = avisoRegistrar((comidas ?? []).map((c) => c.comida));
    if (a) avisos.push(a);
  }
  if (tipo === "resumen") {
    const { data: b } = await db.from("bienestar_diario").select("sueno_seg, hrv_noche, hrv_base_bajo, fc_reposo").eq("user_id", userId).eq("fecha", hoy).maybeSingle();
    avisos.push(avisoResumen(b, await entrenosDe(hoy)));
    const fatiga = hayFatiga(b);
    if (fatiga && activos.fatiga !== false) avisos.push(avisoFatiga(fatiga));
  }
  if (avisos.length === 0) return responder({ ok: true, enviados: 0, motivo: "nada que avisar" });

  // 4. Enviar a cada dispositivo; los que ya no existen se borran.
  const { data: subs } = await db.from("push_suscripciones").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  let enviados = 0;
  const vencidas: number[] = [];
  for (const s of subs ?? []) {
    for (const a of avisos) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(a), { TTL: 6 * 3600 });
        enviados++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) vencidas.push(s.id);
      }
    }
  }
  if (vencidas.length) await db.from("push_suscripciones").delete().in("id", vencidas);
  await db.from("sincronizaciones").insert({ user_id: userId, fuente: "avisos", fin: new Date().toISOString(), ok: true, registros: enviados, detalle: `${tipo}: ${enviados} enviados` });
  return responder({ ok: true, enviados, dispositivos: (subs ?? []).length });
});
