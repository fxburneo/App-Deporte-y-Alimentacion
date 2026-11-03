// Llamada común a la IA de Claude con respuesta estructurada (esquema zod).
// Corre solo en el servidor: la llave ANTHROPIC_API_KEY vive en Vercel.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

const MODELO = "claude-opus-5-5";

export class ErrorIA extends Error {}

export type Contenido = Anthropic.Beta.BetaContentBlockParam;

export function imagen(base64: string, tipo: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"): Contenido {
  return { type: "image", source: { type: "base64", media_type: tipo, data: base64 } };
}

export async function pedirEstructurado<S extends z.ZodType>(args: {
  instrucciones: string;
  contenido: Contenido[];
  esquema: S;
  siRechaza: string;
}): Promise<z.infer<S>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ErrorIA("Falta conectar la IA: la llave de Anthropic todavía no está en Vercel.");
  }
  const client = new Anthropic();
  try {
    const r = await client.beta.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: args.instrucciones,
      output_config: { effort: "medium", format: betaZodOutputFormat(args.esquema) },
      messages: [{ role: "user", content: args.contenido }],
    });
    if (r.stop_reason === "refusal") throw new ErrorIA(args.siRechaza);
    if (!r.parsed_output) throw new ErrorIA("La IA respondió algo que no se pudo leer. Intenta de nuevo.");
    return r.parsed_output as z.infer<S>;
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
