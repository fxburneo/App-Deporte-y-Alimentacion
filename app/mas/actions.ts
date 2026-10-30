"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador } from "@/lib/fecha";

export async function cambiarPausa(fd: FormData) {
  const activar = fd.get("activar") === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("perfil")
    .update({ pausa: activar, pausa_desde: activar ? hoyEcuador() : null, actualizado_en: new Date().toISOString() })
    .eq("user_id", user.id);
  revalidatePath("/", "layout");
}

// Déficit en días de descanso: de 0 a 750 kcal, en pasos de 50.
export async function cambiarDeficit(fd: FormData) {
  const valor = Math.round(Number(fd.get("deficit")) / 50) * 50;
  if (!Number.isFinite(valor) || valor < 0 || valor > 750) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("perfil").update({ deficit_descanso: valor, actualizado_en: new Date().toISOString() }).eq("user_id", user.id);
  revalidatePath("/", "layout");
}
