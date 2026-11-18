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
