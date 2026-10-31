// Lectura de una etiqueta nutricional con la IA (una sola vez por producto):
// nombre, marca, porción y macros por porción y, si la trae, por 100 g.
import "server-only";
import { z } from "zod";
import { imagen, pedirEstructurado } from "./claude";

export const EtiquetaSchema = z.object({
  nombre: z.string().describe("Nombre corto del producto, en español"),
  marca: z.string().describe("Marca; vacío si no se ve"),
  porcion_g: z.number().describe("Gramos (o ml) de la porción que declara la etiqueta"),
  porcion_texto: z.string().describe("Cómo describe la etiqueta la porción, p. ej. '3 galletas', '1 vaso'"),
  unidades_por_porcion: z.number().describe("Cuántas unidades hay en la porción (3 galletas = 3); 0 si no aplica"),
  unidad_nombre: z.string().describe("Nombre de una unidad en singular ('galleta', 'rebanada'); vacío si no aplica"),
  carbo_porcion: z.number(),
  proteina_porcion: z.number(),
  grasa_porcion: z.number(),
  trae_100g: z.boolean().describe("true si la tabla tiene columna por 100 g o 100 ml"),
  carbo_100: z.number().describe("0 si no la trae"),
  proteina_100: z.number().describe("0 si no la trae"),
  grasa_100: z.number().describe("0 si no la trae"),
  nota: z.string().describe("Una frase si algo no se pudo leer; vacío si todo está claro"),
});
export type Etiqueta = z.infer<typeof EtiquetaSchema>;

const INSTRUCCIONES = `Lees tablas de información nutricional de productos vendidos en Ecuador.
Copia los valores tal como están impresos: carbohidratos totales, proteína y grasa total en gramos.
Usa la columna "por porción" y, si existe, la columna "por 100 g" o "por 100 ml". No inventes valores: si algo no se lee, ponlo en 0 y explícalo en "nota".
Si la foto muestra el empaque, saca nombre y marca de ahí.`;

export function leerEtiqueta(fotoBase64: string, tipo?: "image/jpeg" | "image/png" | "image/webp"): Promise<Etiqueta> {
  return pedirEstructurado({
    instrucciones: INSTRUCCIONES,
    contenido: [imagen(fotoBase64, tipo), { type: "text", text: "Lee esta etiqueta nutricional." }],
    esquema: EtiquetaSchema,
    siRechaza: "La IA no pudo leer esta etiqueta. Prueba con otra foto o escríbela a mano.",
  });
}
