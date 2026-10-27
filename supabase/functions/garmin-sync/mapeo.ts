// Traducción de los datos de Garmin a las tablas de FXB Performance.
// Funciones puras (sin Deno ni red): las usa la Edge Function y las prueba
// Vitest en lib/garmin/mapeo.test.ts.

export type Deporte = "rodillo" | "ruta_mtb" | "trail_correr" | "fuerza";
export type Intensidad = "suave" | "moderado" | "fuerte";

const RODILLO = ["indoor_cycling", "virtual_ride"];
const BICI = ["cycling", "road_biking", "mountain_biking", "gravel_cycling", "cyclocross", "e_bike_mountain", "e_bike_fitness"];
const CORRER = ["running", "trail_running", "treadmill_running", "track_running", "street_running", "ultra_run", "hiking", "mountaineering"];
const FUERZA = ["strength_training", "indoor_cardio", "hiit", "yoga", "pilates"];

export function deporteDesdeTipo(tipo: string | null | undefined): Deporte | null {
  if (!tipo) return null;
  if (RODILLO.includes(tipo)) return "rodillo";
  if (BICI.includes(tipo)) return "ruta_mtb";
  if (CORRER.includes(tipo)) return "trail_correr";
  if (FUERZA.includes(tipo)) return "fuerza";
  return null; // caminatas, natación, etc.: no cuentan como entreno para la nutrición
}

// Intensidad por tiempo en zonas de pulso (zona 1 a 5). Si no hay zonas,
// usa el efecto aeróbico de Garmin (0 a 5).
export function intensidadDesde(zonas: (number | null | undefined)[], efecto?: number | null): Intensidad {
  const z = [0, 1, 2, 3, 4].map((i) => Number(zonas[i] ?? 0) || 0);
  const total = z.reduce((a, b) => a + b, 0);
  if (total > 0) {
    const alta = (z[3] + z[4]) / total;
    const media = z[2] / total;
    if (alta >= 0.2) return "fuerte";
    if (alta + media >= 0.35) return "moderado";
    return "suave";
  }
  if (efecto != null) {
    if (efecto >= 4) return "fuerte";
    if (efecto >= 3) return "moderado";
  }
  return "suave";
}

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON de Garmin sin tipos publicados
type Json = any;

export function actividadAEntreno(a: Json, userId: string) {
  const tipo: string | undefined = a?.activityType?.typeKey;
  const deporte = deporteDesdeTipo(tipo);
  const inicio: string | undefined = a?.startTimeLocal; // "2026-10-25 05:02:11"
  if (!deporte || !inicio || !a?.activityId) return null;
  const zonas = [1, 2, 3, 4, 5].map((i) => Math.round(Number(a[`hrTimeInZone_${i}`] ?? 0)));
  return {
    user_id: userId,
    garmin_id: Number(a.activityId),
    fecha: inicio.slice(0, 10),
    hora: inicio.slice(11, 16),
    estado: "hecho" as const,
    deporte,
    duracion_min: Math.max(1, Math.round(Number(a.duration ?? 0) / 60)),
    intensidad: intensidadDesde(zonas, a.aerobicTrainingEffect),
    kcal: a.calories != null ? Math.round(Number(a.calories)) : null,
    origen: "garmin" as const,
    tipo_garmin: tipo ?? null,
    nombre: typeof a.activityName === "string" ? a.activityName.slice(0, 120) : null,
    carga: a.activityTrainingLoad != null ? Math.round(Number(a.activityTrainingLoad) * 10) / 10 : null,
    fc_media: a.averageHR != null ? Math.round(Number(a.averageHR)) : null,
    zonas_seg: zonas.some((x) => x > 0) ? zonas : null,
    distancia_m: a.distance != null ? Math.round(Number(a.distance)) : null,
    efecto_aerobico: a.aerobicTrainingEffect != null ? Math.round(Number(a.aerobicTrainingEffect) * 10) / 10 : null,
  };
}

const ent = (v: Json) => (v == null || Number.isNaN(Number(v)) ? null : Math.round(Number(v)));

// Junta sueño, HRV y resumen diario de Garmin en una fila por día.
export function armarBienestar(userId: string, sueno: Json[], hrv: Json[], resumen: Json[]) {
  const dias = new Map<string, Record<string, unknown>>();
  const fila = (fecha: string) => {
    if (!dias.has(fecha)) dias.set(fecha, { user_id: userId, fecha });
    return dias.get(fecha)!;
  };
  for (const s of sueno ?? []) {
    if (!s?.calendarDate || !s.sleepTimeSeconds) continue;
    Object.assign(fila(s.calendarDate), {
      sueno_seg: ent(s.sleepTimeSeconds),
      sueno_profundo_seg: ent(s.deepSleepSeconds),
      sueno_rem_seg: ent(s.remSleepSeconds),
      sueno_puntaje: ent(s.sleepScores?.overall?.value),
      despertares: ent(s.awakeCount),
    });
  }
  for (const h of hrv ?? []) {
    if (!h?.calendarDate) continue;
    Object.assign(fila(h.calendarDate), {
      hrv_noche: ent(h.lastNightAvg),
      hrv_semana: ent(h.weeklyAvg),
      hrv_estado: typeof h.status === "string" ? h.status : null,
      hrv_base_bajo: ent(h.baseline?.balancedLow),
      hrv_base_alto: ent(h.baseline?.balancedUpper),
    });
  }
  for (const r of resumen ?? []) {
    if (!r?.calendarDate) continue;
    const f = fila(r.calendarDate);
    Object.assign(f, {
      fc_reposo: ent(r.heartRate?.restingValue),
      body_battery_max: ent(r.bodyBattery?.maxValue),
      body_battery_min: ent(r.bodyBattery?.minValue),
      estres_promedio: r.stress?.avgLevel != null && Number(r.stress.avgLevel) >= 0 ? ent(r.stress.avgLevel) : null,
    });
  }
  return [...dias.values()].filter((f) => Object.keys(f).length > 2);
}

// Divide un rango de fechas en tramos de hasta 28 días (algunos servicios
// de Garmin limitan el rango por consulta).
export function tramos(desde: string, hasta: string, maxDias = 28): [string, string][] {
  const r: [string, string][] = [];
  let ini = new Date(desde + "T00:00:00Z");
  const fin = new Date(hasta + "T00:00:00Z");
  while (ini <= fin) {
    const corte = new Date(Math.min(fin.getTime(), ini.getTime() + (maxDias - 1) * 86400000));
    r.push([ini.toISOString().slice(0, 10), corte.toISOString().slice(0, 10)]);
    ini = new Date(corte.getTime() + 86400000);
  }
  return r;
}
