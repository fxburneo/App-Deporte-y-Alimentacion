// Lectura de una comida con la IA de Claude: recibe una foto o un texto y
// devuelve los alimentos con gramos, medida casera y macros, más las
// preguntas sobre lo que no se ve. Corre solo en el servidor (ver claude.ts).
import "server-only";
import { ErrorIA, imagen, pedirEstructurado, type Contenido } from "./claude";
import { AnalisisSchema, type Analisis } from "@/lib/comidas/alimentos";

const INSTRUCCIONES = `Eres nutricionista deportivo y estimas lo que come un ciclista y corredor de montaña que vive en Quito, Ecuador.
Tu trabajo: identificar cada alimento de la comida y estimar su porción y sus macros (carbohidrato, proteína y grasa en gramos).

Cómo estimar:
- Usa referencias visuales (plato de 26 cm, cubiertos, manos) para la porción. Gramos tal como se come: cocido si está cocido.
- Macros según tablas de composición estándar (USDA, INCAP). Redondea a enteros.
- Medida casera que se use en Ecuador: taza, cucharada, cucharón, unidad mediana, vaso. Platos típicos con su nombre local (menestra, patacones, mote, llapingachos, seco de pollo, colada).
- Separa en alimentos distintos lo que cambia los macros (arroz aparte del pollo, el aceite o aguacate aparte si se ve).
- Incluye aceite de cocción razonable en la grasa de frituras y salteados.

Bebidas típicas de Ecuador (carbohidrato por taza de 250 ml; escala según la cantidad):
- Colada morada, de avena o de maicena: 40-50 g.
- Jugo natural con azúcar (mora, naranjilla, tomate de árbol, maracuyá): 30-35 g. Sin azúcar: 12-20 g.
- Chicha o morocho: 35-45 g.
- Avena con leche (bebida): 30-40 g.
En Ecuador estas bebidas casi siempre llevan azúcar: si no se sabe, asume que sí y pregunta.

Preguntas: solo cuando algo no se ve y cambia los macros en más de 10 g (azúcar en un jugo, leche entera o descremada, frito o al horno). Máximo 2. Cada opción trae los macros que tendría ese alimento con esa respuesta. En la lista de alimentos pon los valores de la opción más probable.
Si la descripción en texto ya dice la cantidad, úsala tal cual. Si algo no se puede identificar, dilo en "nota".`;

export { ErrorIA };

export async function analizarComida(entrada: { fotoBase64?: string; tipoFoto?: "image/jpeg" | "image/png" | "image/webp"; texto?: string }): Promise<Analisis> {
  const contenido: Contenido[] = [];
  if (entrada.fotoBase64) contenido.push(imagen(entrada.fotoBase64, entrada.tipoFoto));
  const texto = entrada.texto?.trim();
  contenido.push({
    type: "text",
    text: entrada.fotoBase64
      ? `Analiza esta comida.${texto ? ` Lo que me dijo: "${texto}".` : ""}`
      : `Analiza esta comida descrita por él: "${texto}".`,
  });
  return pedirEstructurado({
    instrucciones: INSTRUCCIONES,
    contenido,
    esquema: AnalisisSchema,
    siRechaza: "La IA no pudo analizar esta comida. Prueba escribiéndola.",
  });
}
