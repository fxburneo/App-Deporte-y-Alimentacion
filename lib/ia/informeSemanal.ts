// Informe semanal escrito por Claude con los datos de la semana (etapa 6).
// Segunda opinión en lenguaje simple: no cambia el plan del coach.
import "server-only";
import { z } from "zod";
import { pedirEstructurado } from "./claude";

export const InformeSchema = z.object({
  mejoro: z.array(z.string()).min(1).max(3),
  falta: z.array(z.string()).min(1).max(3),
  coach: z.array(z.string()).min(1).max(3),
});
export type Informe = z.infer<typeof InformeSchema>;

const INSTRUCCIONES = `Eres un entrenador de resistencia y nutricionista deportivo que da una segunda opinión semanal a un ciclista y corredor de montaña de 42 años que vive en Quito (2.800 m). Tiene un coach que le arma el plan en TrainingPeaks y una nutricionista que le fijó el plan de comidas: tú NO cambias ese plan, lo comentas.

Con los datos de la semana escribe, en español de Ecuador, tuteando, sin tecnicismos (nada de CTL, ATL, TSB, VO2; di "base física", "cansancio", "frescura"):
- mejoro: 1 a 3 cosas concretas que mejoraron, con números de los datos.
- falta: 1 a 3 cosas concretas a mejorar, con números y la comida o el día donde pasa.
- coach: 3 preguntas cortas para llevarle al coach, en primera persona ("¿Camino las cuestas…?"), basadas en lo que muestran los datos.

Reglas: cada punto en una o dos frases. Solo afirma lo que se ve en los datos; si falta información (no registró comidas, sin pesajes), dilo como algo a mejorar, no inventes. No diagnostiques salud: si ves fatiga, sugiere conversarlo con el coach.`;

export function escribirInforme(datos: string): Promise<Informe> {
  return pedirEstructurado({
    instrucciones: INSTRUCCIONES,
    contenido: [{ type: "text", text: datos }],
    esquema: InformeSchema,
    siRechaza: "La IA no pudo escribir el informe. Intenta de nuevo.",
  });
}
