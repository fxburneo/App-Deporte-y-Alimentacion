// "Dónde ajustar" (maqueta 2.4): compara lo comido contra el objetivo de las
// comidas ya registradas y señala el nutriente que más se desvió y en qué
// comida. Funciones puras, probadas en resumen.test.ts.
import type { Macros } from "@/lib/nutricion/ajuste";
import { COMIDAS, type Comida } from "@/lib/nutricion/motor";

export interface Desvio {
  nutriente: "carbo" | "proteina" | "grasa";
  diferenciaG: number; // + de más, − de menos
  comida: Comida; // la comida que más aportó al desvío
  diferenciaComidaG: number;
}

const CAMPO = { carbo: "carboG", proteina: "proteinaG", grasa: "grasaG" } as const;
// Desvío mínimo que vale la pena mostrar (la grasa pesa más por gramo).
const UMBRAL = { carbo: 15, proteina: 10, grasa: 8 };

export function dondeAjustar(objetivos: Record<Comida, Macros>, consumido: Partial<Record<Comida, Macros>>): Desvio[] {
  const registradas = COMIDAS.filter((c) => consumido[c] != null);
  const r: Desvio[] = [];
  for (const n of ["carbo", "proteina", "grasa"] as const) {
    const k = CAMPO[n];
    const porComida = registradas.map((c) => ({ c, d: consumido[c]![k] - objetivos[c][k] }));
    const total = Math.round(porComida.reduce((s, x) => s + x.d, 0));
    if (Math.abs(total) < UMBRAL[n]) continue;
    // La comida que más empujó en la misma dirección que el total
    const peor = porComida.reduce((a, b) => (Math.sign(total) * b.d > Math.sign(total) * a.d ? b : a));
    r.push({ nutriente: n, diferenciaG: total, comida: peor.c, diferenciaComidaG: Math.round(peor.d) });
  }
  return r.sort((a, b) => Math.abs(b.diferenciaG) * peso(b.nutriente) - Math.abs(a.diferenciaG) * peso(a.nutriente));
}

const peso = (n: Desvio["nutriente"]) => (n === "grasa" ? 9 : 4);

// Porcentaje del objetivo de calorías del día que se comió (para "últimos 7 días").
export function porcentajeDelObjetivo(kcalComidas: number, kcalObjetivo: number): number {
  return kcalObjetivo > 0 ? Math.round((kcalComidas / kcalObjetivo) * 100) : 0;
}
