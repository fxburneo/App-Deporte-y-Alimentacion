"use server";

// Guarda el perfil (crea o actualiza) y, si vino, el pesaje de hoy.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador } from "@/lib/fecha";
import { leerPerfilForm } from "@/lib/perfil/validar";

export async function guardarPerfil(_prev: { error: string | null }, fd: FormData): Promise<{ error: string | null }> {
  const hoy = hoyEcuador();
  const r = leerPerfilForm(fd, hoy);
  if (!r.ok) return { error: r.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "La sesión expiró, vuelve a entrar." };

  const { error } = await supabase
    .from("perfil")
    .upsert({ user_id: user.id, ...r.perfil, actualizado_en: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { error: "No se pudo guardar el perfil. Intenta de nuevo." };

  if (r.pesoKg != null) {
    const { error: e2 } = await supabase
      .from("pesos")
      .upsert({ user_id: user.id, fecha: hoy, kg: r.pesoKg, origen: "manual" }, { onConflict: "user_id,fecha,origen" });
    if (e2) return { error: "El perfil se guardó, pero el peso no. Cárgalo en Más › Peso." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
