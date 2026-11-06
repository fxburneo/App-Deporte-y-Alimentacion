"use server";

// Botón "Actualizar": pide a las funciones de Supabase que traigan lo último
// de Garmin y el plan de TrainingPeaks, usando la sesión del usuario (la llave de Garmin nunca pasa
// por aquí: vive como secreto en Supabase).
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function actualizarGarmin(): Promise<{ ok: boolean; mensaje: string }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, mensaje: "La sesión expiró, vuelve a entrar." };
  try {
    const llamar = (funcion: string, cuerpo: unknown) =>
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${funcion}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
        cache: "no-store",
      });
    // El plan del coach se pide en paralelo; si falla, no bloquea lo de Garmin.
    const [r] = await Promise.all([llamar("garmin-sync", { dias: 3 }), llamar("tp-sync", {}).catch(() => null)]);
    const j = await r.json().catch(() => ({}));
    revalidatePath("/", "layout");
    if (!r.ok || !j.ok) return { ok: false, mensaje: j.error ?? "Garmin no respondió. Intenta en unos minutos." };
    return { ok: true, mensaje: "Actualizado." };
  } catch {
    return { ok: false, mensaje: "No se pudo conectar. Intenta en unos minutos." };
  }
}
