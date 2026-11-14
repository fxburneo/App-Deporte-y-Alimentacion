"use server";

// Genera (o vuelve a generar) el informe de una semana con Claude y lo guarda.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador, sumarDias } from "@/lib/fecha";
import { construirDatosInforme } from "./datos";
import { escribirInforme } from "@/lib/ia/informeSemanal";
import { ErrorIA } from "@/lib/ia/claude";

export async function generarInforme(lunes: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lunes) || lunes > hoyEcuador() || lunes < sumarDias(hoyEcuador(), -120)) return { ok: false, error: "Semana no válida." };
  const datos = await construirDatosInforme(lunes);
  if (!datos) return { ok: false, error: "Faltan datos para armar el informe." };
  try {
    const informe = await escribirInforme(datos.texto);
    const supabase = await createClient();
    const { error } = await supabase.from("informes_semanales").upsert({ semana: lunes, contenido: informe }, { onConflict: "user_id,semana" });
    if (error) return { ok: false, error: "No se pudo guardar el informe." };
    revalidatePath("/entreno/informe");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof ErrorIA ? e.message : "No se pudo escribir el informe. Intenta de nuevo." };
  }
}
