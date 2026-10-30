// Estimación del ritmo de bajada con el déficit elegido: recalcula el
// objetivo de cada uno de los últimos 28 días con los entrenos reales y
// promedia el déficit que de verdad queda (los pisos de macros lo limitan).
// 1 kg de grasa ≈ 7.700 kcal. Función pura, probada en estimacion.test.ts.
import { objetivoDelDia, type Entreno, type PerfilMotor } from "./motor";

export interface Estimacion {
  deficitPromedio: number; // kcal/día
  kgSemana: number;
  semanasAlObjetivo: number | null; // null si no hay déficit o ya llegó
}

export function estimarRitmo(args: {
  perfil: PerfilMotor;
  pesoKg: number;
  objetivoKg: number;
  dias: Entreno[][]; // entrenos de cada día (y del siguiente para la víspera)
}): Estimacion {
  const { perfil, pesoKg, dias } = args;
  const n = Math.max(1, dias.length - 1);
  let suma = 0;
  for (let i = 0; i < n; i++) {
    suma += objetivoDelDia({ perfil, pesoKg, entrenosHoy: dias[i] ?? [], entrenosManana: dias[i + 1] ?? [] }).deficitKcal;
  }
  const deficitPromedio = Math.round(suma / n);
  const kgSemana = Math.round(((deficitPromedio * 7) / 7700) * 100) / 100;
  const falta = pesoKg - args.objetivoKg;
  const semanasAlObjetivo = kgSemana > 0 && falta > 0 ? Math.ceil(falta / kgSemana) : null;
  return { deficitPromedio, kgSemana, semanasAlObjetivo };
}
