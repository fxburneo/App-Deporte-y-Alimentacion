// Balance real del día: lo que gastas contra lo que comiste. Distinto del
// déficit planificado (lo que el plan te pide comer por debajo del gasto).
// Hoy es "hasta ahora" porque el día no terminó; en el historial es el cierre.
import { miles } from "@/lib/formato";

export interface BalanceReal {
  kcal: number; // positivo = déficit (comiste menos de lo que gastas); negativo = superávit
  texto: string;
}

export function balanceReal(gastoKcal: number, comidoKcal: number, esHoy: boolean): BalanceReal | null {
  if (comidoKcal <= 0) return null;
  const kcal = Math.round(gastoKcal - comidoKcal);
  const n = miles(Math.abs(kcal));
  const cuando = esHoy ? "Real hasta ahora" : "Real del día";
  if (Math.abs(kcal) < 50) return { kcal, texto: `${cuando}: comiste lo mismo que gastas.` };
  return {
    kcal,
    texto: kcal > 0 ? `${cuando}: comiste ${n} kcal menos de lo que gastas.` : `${cuando}: comiste ${n} kcal más de lo que gastas.`,
  };
}
