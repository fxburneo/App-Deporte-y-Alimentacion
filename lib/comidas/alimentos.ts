// Alimentos de una comida: esquema compartido entre la IA, la pantalla y el
// guardado, y las cuentas (corregir gramos, totales). Funciones puras.
import { z } from "zod";
import type { Macros } from "@/lib/nutricion/ajuste";

export const AlimentoSchema = z.object({
  nombre: z.string().describe("Nombre corto del alimento, en español de Ecuador"),
  detalle: z.string().describe("Corte, preparación o ingredientes visibles; vacío si no aplica"),
  gramos: z.number().describe("Peso estimado de la porción en gramos, tal como se come (cocido si está cocido)"),
  medida_casera: z.string().describe("Medida casera equivalente, p. ej. '1 taza', '1 pechuga mediana', '1 vaso (300 ml)'"),
  carbo_g: z.number(),
  proteina_g: z.number(),
  grasa_g: z.number(),
});
export type Alimento = z.infer<typeof AlimentoSchema>;

export const PreguntaSchema = z.object({
  texto: z.string().describe("Pregunta corta sobre algo que no se ve y cambia los macros"),
  alimento: z.number().int().describe("Índice (desde 0) del alimento al que se refiere"),
  opciones: z
    .array(
      z.object({
        etiqueta: z.string(),
        carbo_g: z.number(),
        proteina_g: z.number(),
        grasa_g: z.number(),
      })
    )
    .describe("2 o 3 respuestas posibles, cada una con los macros que tendría el alimento"),
});
export type Pregunta = z.infer<typeof PreguntaSchema>;

export const AnalisisSchema = z.object({
  alimentos: z.array(AlimentoSchema),
  preguntas: z.array(PreguntaSchema).describe("Máximo 2; vacío si todo se ve claro"),
  nota: z.string().describe("Una frase si algo no se pudo identificar; vacío si no"),
});
export type Analisis = z.infer<typeof AnalisisSchema>;

const r1 = (x: number) => Math.round(x * 10) / 10;

// Corregir los gramos de un alimento escala sus macros en la misma proporción.
export function cambiarGramos(a: Alimento, gramos: number): Alimento {
  if (!(gramos > 0) || !(a.gramos > 0)) return a;
  const f = gramos / a.gramos;
  return { ...a, gramos: Math.round(gramos), carbo_g: r1(a.carbo_g * f), proteina_g: r1(a.proteina_g * f), grasa_g: r1(a.grasa_g * f) };
}

export function totales(lista: Alimento[]): Macros & { kcal: number } {
  const carboG = r1(lista.reduce((s, a) => s + a.carbo_g, 0));
  const proteinaG = r1(lista.reduce((s, a) => s + a.proteina_g, 0));
  const grasaG = r1(lista.reduce((s, a) => s + a.grasa_g, 0));
  return { carboG, proteinaG, grasaG, kcal: Math.round(carboG * 4 + proteinaG * 4 + grasaG * 9) };
}

// Valores fuera de rango que la IA o un error de tipeo podrían dejar pasar.
export function alimentoValido(a: Alimento): boolean {
  const ok = (x: number, max: number) => Number.isFinite(x) && x >= 0 && x <= max;
  return a.nombre.trim().length > 0 && ok(a.gramos, 3000) && ok(a.carbo_g, 500) && ok(a.proteina_g, 300) && ok(a.grasa_g, 300);
}
