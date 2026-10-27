// Sincronización con la API personal de Garmin (etapa 2).
// La llaman: las tareas programadas de Supabase (con x-sync-token) o la app
// (con la sesión del usuario, botón "Actualizar"). Trae sueño, HRV, resumen
// diario y actividades de los últimos N días y los guarda en las tablas.
// Responde solo un resumen: nunca devuelve datos de salud ni el token.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { actividadAEntreno, armarBienestar, tramos } from "./mapeo.ts";

const BASE = "https://personal.connectapi.garmin.com";
const TOKEN_PATH = "/personalapitoken-service/personal-api/personal-api-key/token";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-token",
};

const hoyEcuador = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date());
const restar = (f: string, d: number) => new Date(new Date(f + "T00:00:00Z").getTime() - d * 86400000).toISOString().slice(0, 10);
const responder = (cuerpo: unknown, status = 200) => Response.json(cuerpo, { status, headers: CORS });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // 1. ¿Quién llama? Tarea programada (token interno) o el usuario con sesión.
  let userId: string | null = null;
  const tokenSync = req.headers.get("x-sync-token");
  if (tokenSync) {
    const { data } = await db.from("app_config").select("valor").eq("clave", "sync_token").maybeSingle();
    if (!data || data.valor !== tokenSync) return responder({ ok: false, error: "no autorizado" }, 401);
    const { data: p } = await db.from("perfil").select("user_id").limit(1).maybeSingle();
    userId = p?.user_id ?? null;
  } else {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data } = await db.auth.getUser(jwt);
    userId = data.user?.id ?? null;
  }
  if (!userId) return responder({ ok: false, error: "no autorizado" }, 401);

  const cuerpo = await req.json().catch(() => ({}));
  const dias = Math.min(90, Math.max(1, Number(cuerpo?.dias) || 3));
  const hasta = hoyEcuador();
  const desde = restar(hasta, dias - 1);

  const { data: registro } = await db
    .from("sincronizaciones")
    .insert({ user_id: userId, fuente: "garmin", dias })
    .select("id")
    .single();
  const cerrar = async (ok: boolean, registros: number, detalle: string | null) => {
    if (registro) {
      await db.from("sincronizaciones").update({ fin: new Date().toISOString(), ok, registros, detalle }).eq("id", registro.id);
    }
  };

  try {
    // 2. Canjear la llave personal por un token de 24 horas.
    const llave = Deno.env.get("GARMIN_PERSONAL_API_KEY")?.trim();
    if (!llave) throw new Error("Falta GARMIN_PERSONAL_API_KEY en Supabase.");
    const t = await fetch(BASE + TOKEN_PATH, { method: "POST", headers: { Accept: "*/*", Authorization: `ApiKey ${llave}` } });
    if (!t.ok) throw new Error(t.status === 401 || t.status === 403 ? "Garmin rechazó la llave: puede estar vencida o eliminada." : `Garmin respondió ${t.status} al canjear la llave.`);
    const token = (await t.text()).trim();

    const leer = async (ruta: string) => {
      const r = await fetch(BASE + ruta, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`Garmin respondió ${r.status} en ${ruta.split("?")[0]}`);
      return r.json();
    };

    // 3. Leer de Garmin en tramos de hasta 28 días.
    const sueno: unknown[] = [];
    const hrv: unknown[] = [];
    const resumen: unknown[] = [];
    const actividades: unknown[] = [];
    for (const [a, b] of tramos(desde, hasta)) {
      const s = await leer(`/sleep-service/sleep/dailySleepSummariesByDate?startDate=${a}&endDate=${b}`);
      sueno.push(...(Array.isArray(s) ? s : []));
      const h = await leer(`/hrv-service/hrv/daily/${a}/${b}`);
      hrv.push(...(h?.hrvSummaries ?? []));
      const d = await leer(`/usersummary-service/v2/dailysummaries?startDate=${a}&endDate=${b}`);
      resumen.push(...(d?.data ?? []));
    }
    for (let inicio = 0; inicio < 500; inicio += 100) {
      const lote = await leer(`/activitylist-service/activities/search/activities?start=${inicio}&limit=100&startDate=${desde}&endDate=${hasta}`);
      const lista = Array.isArray(lote) ? lote : [];
      actividades.push(...lista);
      if (lista.length < 100) break;
    }

    // 4. Guardar. Upsert: si el día o el entreno ya existe, se actualiza.
    const filasBienestar = armarBienestar(userId, sueno, hrv, resumen).map((f) => ({ ...f, actualizado_en: new Date().toISOString() }));
    if (filasBienestar.length) {
      const { error } = await db.from("bienestar_diario").upsert(filasBienestar, { onConflict: "user_id,fecha" });
      if (error) throw new Error("No se pudo guardar el bienestar: " + error.message);
    }
    const filasEntrenos = actividades.map((a) => actividadAEntreno(a, userId!)).filter((x) => x != null);
    if (filasEntrenos.length) {
      const { error } = await db.from("entrenos").upsert(filasEntrenos, { onConflict: "user_id,garmin_id" });
      if (error) throw new Error("No se pudieron guardar los entrenos: " + error.message);
    }

    // 5. Primera sincronización: anotar el vencimiento de la llave (1 año).
    await db.from("perfil").update({ garmin_llave_vence: restar(hasta, -365) }).eq("user_id", userId).is("garmin_llave_vence", null);

    const total = filasBienestar.length + filasEntrenos.length;
    await cerrar(true, total, `${filasBienestar.length} días de bienestar, ${filasEntrenos.length} entrenos`);
    return responder({ ok: true, desde, hasta, dias_bienestar: filasBienestar.length, entrenos: filasEntrenos.length });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    await cerrar(false, 0, mensaje.slice(0, 500));
    return responder({ ok: false, error: mensaje }, 502);
  }
});
