// Indicadores de cumplimiento (aprobados 18-nov-2026, CONTEXTO.md).
// Funciones puras: puntajes 0-100 de entreno y alimentación y su agregado por
// periodo. Las pantallas (Yo, Hoy, /cumplimiento) solo leen datos y llaman aquí.

const limitar = (v: number) => Math.max(0, Math.min(100, v));
const redondear = (v: number) => Math.round(v);

// Entreno, por sesión del coach (bandas de TrainingPeaks): minutos hechos ÷
// planificados. 80-120 % = 100; bajo 80 % baja en proporción (60 % → 75);
// sobre 120 % baja 1 punto por punto (150 % → 70); no hecha = 0.
export function puntajeSesion(planMin: number, hechoMin: number): number {
  if (planMin <= 0) return hechoMin > 0 ? 100 : 0;
  if (hechoMin <= 0) return 0;
  const pct = (hechoMin / planMin) * 100;
  if (pct < 80) return limitar((pct / 80) * 100);
  if (pct <= 120) return 100;
  return limitar(100 - (pct - 120));
}

// Banda simétrica: 100 dentro de ±tolerancia, 0 al llegar a ±cero, lineal entre medio.
function banda(pct: number, tolerancia: number, cero: number): number {
  const desvio = Math.abs(pct - 100);
  if (desvio <= tolerancia) return 100;
  return limitar(100 - ((desvio - tolerancia) / (cero - tolerancia)) * 100);
}

export interface Macros {
  kcal: number;
  proteina: number;
  carbo: number;
}

export interface PuntajeDia {
  total: number;
  kcal: number;
  proteina: number;
  carbo: number;
}

// Alimentación, puntaje diario: calorías 40 % (100 entre 90-110 %, 0 a ±40 %),
// proteína 35 % (100 desde el objetivo, proporcional por debajo), carbohidrato
// 25 % (100 entre 85-115 %, 0 a ±50 %). Grasa no puntúa. Sin registro = 0.
export function puntajeAlimentacion(objetivo: Macros, comido: Macros | null): PuntajeDia {
  if (!comido || comido.kcal <= 0) return { total: 0, kcal: 0, proteina: 0, carbo: 0 };
  const pct = (c: number, o: number) => (o > 0 ? (c / o) * 100 : 100);
  const kcal = banda(pct(comido.kcal, objetivo.kcal), 10, 40);
  const proteina = limitar(pct(comido.proteina, objetivo.proteina));
  const carbo = banda(pct(comido.carbo, objetivo.carbo), 15, 50);
  return { total: redondear(kcal * 0.4 + proteina * 0.35 + carbo * 0.25), kcal: redondear(kcal), proteina: redondear(proteina), carbo: redondear(carbo) };
}

export interface Sesion {
  fecha: string;
  planMin: number;
  hechoMin: number;
}

// Periodo de entreno: ponderado por duración planificada. Sin sesiones = null
// (no hay nada que medir, no es 0).
export function cumplimientoEntreno(sesiones: Sesion[]): number | null {
  if (sesiones.length === 0) return null;
  // Sesiones sin minutos (fuerza sin duración) pesan como 30 min.
  const peso = (s: Sesion) => (s.planMin > 0 ? s.planMin : 30);
  const total = sesiones.reduce((a, s) => a + peso(s), 0);
  return redondear(sesiones.reduce((a, s) => a + puntajeSesion(s.planMin, s.hechoMin) * peso(s), 0) / total);
}

// Periodo de alimentación: promedio simple de los días (cada día pesa igual).
export function cumplimientoAlimentacion(dias: PuntajeDia[]): number | null {
  if (dias.length === 0) return null;
  return redondear(dias.reduce((a, d) => a + d.total, 0) / dias.length);
}

export type Semaforo = "verde" | "amarillo" | "rojo";
export const semaforo = (p: number): Semaforo => (p >= 85 ? "verde" : p >= 70 ? "amarillo" : "rojo");

// Fechas desde las que hay datos: antes de esto no se cuenta.
export const DATOS_COMIDAS_DESDE = "2026-11-03";
export const DATOS_PLAN_DESDE = "2026-11-06";

// ---------- Sesiones del coach contra lo hecho ----------
export interface EntrenoCumplimiento {
  fecha: string;
  estado: "planificado" | "hecho";
  deporte: string;
  duracion_min: number;
  nombre?: string | null;
  origen: string;
}

export interface SesionCoach extends Sesion {
  nombre: string;
  puntaje: number;
}

// Fuerza se compara con fuerza; todo lo demás (rodillo, bici, trote) entre sí.
const familia = (deporte: string) => (deporte === "fuerza" ? "fuerza" : "aerobico");
const limpio = (n: string | null | undefined) => (n ?? "").replace(/^[^:]+:\s*/, "");

// Cada sesión planificada en TrainingPeaks contra lo hecho ese día en Garmin
// (o a mano). Si el coach puso dos sesiones de la misma familia el mismo día,
// lo hecho se reparte en proporción a lo planificado. Hoy solo cuenta si ya
// hay algo hecho (si no, todavía está pendiente); el futuro no cuenta.
export function sesionesDelCoach(entrenos: EntrenoCumplimiento[], desde: string, hasta: string, hoy: string): SesionCoach[] {
  const inicio = desde > DATOS_PLAN_DESDE ? desde : DATOS_PLAN_DESDE;
  const plan = entrenos
    .filter((e) => e.estado === "planificado" && e.origen === "trainingpeaks" && e.deporte !== "descanso")
    .filter((e) => e.fecha >= inicio && e.fecha <= hasta && e.fecha <= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const salida: SesionCoach[] = [];
  const grupos = new Map<string, EntrenoCumplimiento[]>();
  for (const p of plan) {
    const k = `${p.fecha}|${familia(p.deporte)}`;
    grupos.set(k, [...(grupos.get(k) ?? []), p]);
  }
  for (const [k, sesiones] of grupos) {
    const [fecha, fam] = k.split("|");
    const hecho = entrenos.filter((e) => e.estado === "hecho" && e.fecha === fecha && familia(e.deporte) === fam).reduce((a, e) => a + e.duracion_min, 0);
    if (fecha === hoy && hecho === 0) continue;
    const planTotal = sesiones.reduce((a, s) => a + s.duracion_min, 0);
    for (const s of sesiones) {
      const hechoMin = planTotal > 0 ? Math.round((hecho * s.duracion_min) / planTotal) : hecho;
      salida.push({ fecha, nombre: limpio(s.nombre) || s.deporte, planMin: s.duracion_min, hechoMin, puntaje: Math.round(puntajeSesion(s.duracion_min, hechoMin)) });
    }
  }
  return salida.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ---------- Periodos ----------
export type Periodo = "semana" | "mes" | "anio";

const dia = (f: string) => new Date(f + "T12:00:00Z");
const iso = (d: Date) => d.toISOString().slice(0, 10);

// Rango del periodo que contiene la fecha: semana de lunes a domingo, mes
// calendario o año calendario.
export function rangoPeriodo(periodo: Periodo, fecha: string): { desde: string; hasta: string } {
  const d = dia(fecha);
  if (periodo === "semana") {
    const lunes = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000);
    return { desde: iso(lunes), hasta: iso(new Date(lunes.getTime() + 6 * 86400000)) };
  }
  if (periodo === "mes") {
    const desde = `${fecha.slice(0, 7)}-01`;
    const fin = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12));
    return { desde, hasta: iso(fin) };
  }
  return { desde: `${fecha.slice(0, 4)}-01-01`, hasta: `${fecha.slice(0, 4)}-12-31` };
}

// Fecha dentro del periodo anterior o siguiente (para las flechas).
export function moverPeriodo(periodo: Periodo, fecha: string, paso: 1 | -1): string {
  const { desde } = rangoPeriodo(periodo, fecha);
  const d = dia(desde);
  if (periodo === "semana") return iso(new Date(d.getTime() + paso * 7 * 86400000));
  if (periodo === "mes") return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + paso, 1, 12)));
  return `${d.getUTCFullYear() + paso}-01-01`;
}

// Racha: días seguidos con al menos una comida registrada, terminando hoy (o
// ayer, si hoy todavía no registra nada: la racha no se corta a media mañana).
export function racha(fechasConRegistro: Iterable<string>, hoy: string): number {
  const set = new Set(fechasConRegistro);
  let f = set.has(hoy) ? hoy : iso(new Date(dia(hoy).getTime() - 86400000));
  let n = 0;
  while (set.has(f)) {
    n++;
    f = iso(new Date(dia(f).getTime() - 86400000));
  }
  return n;
}
