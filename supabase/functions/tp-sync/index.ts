// Lectura del plan del coach desde el calendario iCal de TrainingPeaks (etapa 4).
// La llaman las tareas programadas de Supabase (con x-sync-token) o la app
// (con la sesión del usuario, botón "Actualizar"). Guarda los entrenos
// planificados y borra los que el coach quitó o movió.
// Responde solo un resumen: nunca devuelve el enlace del calendario.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { eventoAEntreno, leerEventos, unirCarreras } from "./mapeo.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-token",
};
const hoyEcuador = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date());
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

  const { data: registro } = await db
    .from("sincronizaciones")
    .insert({ user_id: userId, fuente: "trainingpeaks" })
    .select("id")
    .single();
  const cerrar = async (ok: boolean, registros: number, detalle: string | null) => {
    if (registro) {
      await db.from("sincronizaciones").update({ fin: new Date().toISOString(), ok, registros, detalle }).eq("id", registro.id);
    }
  };

  try {
    // 2. Leer el calendario.
    const url = Deno.env.get("TP_ICAL_URL")?.trim().replace(/^webcal:\/\//i, "https://");
    if (!url) throw new Error("Falta TP_ICAL_URL en Supabase.");
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status === 404 || r.status === 403 ? "TrainingPeaks rechazó el enlace del calendario: puede haber cambiado." : `TrainingPeaks respondió ${r.status}.`);
    const eventos = leerEventos(await r.text());

    // 3. Desde hoy en adelante: lo pasado ya lo cubre Garmin con lo hecho.
    const hoy = hoyEcuador();
    const { data: p } = await db.from("perfil").select("entreno_semana, entreno_finde").eq("user_id", userId).single();
    const horarios = { semana: String(p?.entreno_semana ?? "05:00").slice(0, 5), finde: String(p?.entreno_finde ?? "06:30").slice(0, 5) };
    const filas = eventos
      .filter((e) => e.fecha >= hoy)
      .map((e) => eventoAEntreno(e, userId!, horarios))
      .filter((x) => x != null);

    if (filas.length) {
      const { error } = await db.from("entrenos").upsert(filas, { onConflict: "user_id,tp_uid" });
      if (error) throw new Error("No se pudieron guardar los entrenos: " + error.message);
    }

    // 4. Lo que el coach quitó o movió: se borra el plan viejo (solo futuro).
    const vigentes = new Set(filas.map((f) => f.tp_uid));
    const { data: guardados } = await db
      .from("entrenos")
      .select("id, tp_uid")
      .eq("user_id", userId)
      .eq("origen", "trainingpeaks")
      .eq("estado", "planificado")
      .gte("fecha", hoy);
    const sobran = (guardados ?? []).filter((g) => !vigentes.has(g.tp_uid)).map((g) => g.id);
    if (sobran.length) await db.from("entrenos").delete().in("id", sobran);

    // 5. Carreras cargadas en la app: se enlazan cuando aparecen en TP.
    const { data: carreras } = await db.from("carreras").select("id, nombre, fecha, tp_uid").eq("user_id", userId).gte("fecha", hoy);
    const unidas = unirCarreras(eventos.filter((e) => e.fecha >= hoy), carreras ?? []);
    for (const u of unidas) await db.from("carreras").update({ tp_uid: u.tp_uid, fecha: u.fecha }).eq("id", u.id);

    await cerrar(true, filas.length, `${filas.length} entrenos planificados, ${sobran.length} quitados, ${unidas.length} carreras unidas`);
    // Resumen sin datos privados: rango de fechas del calendario y lo que no se
    // tradujo a entreno (tipos que no cuentan, eventos o carreras).
    const fechas = eventos.map((e) => e.fecha).sort();
    const sinTraducir = eventos
      .filter((e) => e.fecha >= hoy && !filas.some((f) => f.tp_uid === e.uid))
      .map((e) => ({ fecha: e.fecha, resumen: e.resumen.slice(0, 80) }));
    return responder({ ok: true, planificados: filas.length, quitados: sobran.length, carreras_unidas: unidas.length, desde: fechas[0] ?? null, hasta: fechas.at(-1) ?? null, sin_traducir: sinTraducir });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    await cerrar(false, 0, mensaje.slice(0, 500));
    return responder({ ok: false, error: mensaje }, 502);
  }
});
