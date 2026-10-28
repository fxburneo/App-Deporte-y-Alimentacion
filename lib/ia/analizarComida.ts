// Lectura de una comida con la IA de Claude: recibe una foto o un texto y
// devuelve los alimentos con gramos, medida casera y macros, más las
// preguntas sobre lo que no se ve. Corre solo en el servidor: la llave
// ANTHROPIC_API_KEY vive en las variables de entorno de Vercel.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AnalisisSchema, type Analisis } from "@/lib/comidas/alimentos";

const MODELO = "claude-opus-5-5";

const INSTRUCCIONES = `Eres nutricionista deportivo y estimas lo que come un ciclista y corredor de montaña que vive en Quito, Ecuador.
Tu trabajo: identificar cada alimento de la comida y estimar su porción y sus macros (carbohidrato, proteína y grasa en gramos).

Cómo estimar:
- Usa referencias visuales (plato de 26 cm, cubiertos, manos) para la porción. Gramos tal como se come: cocido si está cocido.
- Macros según tablas de composición estándar (USDA, INCAP). Redondea a enteros.
- Medida casera que se use en Ecuador: taza, cucharada, cucharón, unidad mediana, vaso. Platos típicos con su nombre local (menestra, patacones, mote, llapingachos, seco de pollo, colada).
- Separa en alimentos distintos lo que cambia los macros (arroz aparte del pollo, el aceite o aguacate aparte si se ve).
- Incluye aceite de cocción razonable en la grasa de frituras y salteados.

Preguntas: solo cuando algo no se ve y cambia los macros en más de 10 g (azúcar en un jugo, leche entera o descremada, frito o al horno). Máximo 2. Cada opción trae los macros que tendría ese alimento con esa respuesta. En la lista de alimentos pon los valores de la opción más probable.
Si la descripción en texto ya dice la cantidad, úsala tal cual. Si algo no se puede identificar, dilo en "nota".`;

export class ErrorIA extends Error {}

export async function analizarComida(entrada: { fotoBase64?: string; tipoFoto?: "image/jpeg" | "image/png" | "image/webp"; texto?: string }): Promise<Analisis> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ErrorIA("Falta conectar la IA: la llave de Anthropic todavía no está en Vercel.");
  }
  const contenido: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (entrada.fotoBase64) {
    contenido.push({ type: "image", source: { type: "base64", media_type: entrada.tipoFoto ?? "image/jpeg", data: entrada.fotoBase64 } });
  }
  const texto = entrada.texto?.trim();
  contenido.push({
    type: "text",
    text: entrada.fotoBase64
      ? `Analiza esta comida.${texto ? ` Lo que me dijo: "${texto}".` : ""}`
      : `Analiza esta comida descrita por él: "${texto}".`,
  });

  const client = new Anthropic();
  try {
    const r = await client.beta.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: INSTRUCCIONES,
      output_config: { effort: "medium", format: betaZodOutputFormat(AnalisisSchema) },
      messages: [{ role: "user", content: contenido }],
    });
    if (r.stop_reason === "refusal") throw new ErrorIA("La IA no pudo analizar esta comida. Prueba escribiéndola.");
    if (!r.parsed_output) throw new ErrorIA("La IA respondió algo que no se pudo leer. Intenta de nuevo.");
    return r.parsed_output;
  } catch (e) {
    if (e instanceof ErrorIA) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new ErrorIA("La llave de Anthropic no es válida. Revísala en Vercel.");
    if (e instanceof Anthropic.RateLimitError) throw new ErrorIA("Demasiadas consultas seguidas. Espera un minuto.");
    if (e instanceof Anthropic.APIError) {
      if (e.status === 402 || e.status === 403) throw new ErrorIA("La cuenta de Anthropic no tiene saldo o permiso. Revísala en console.anthropic.com.");
      throw new ErrorIA(`La IA no respondió (error ${e.status ?? "de conexión"}). Intenta de nuevo.`);
    }
    throw new ErrorIA("No se pudo conectar con la IA. Intenta de nuevo.");
  }
}
