"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador } from "@/lib/fecha";

type Estado = { error: string | null; ok: boolean };

export async function guardarPeso(_prev: Estado, fd: FormData): Promise<Estado> {
  const kg = Number(String(fd.get("kg") ?? "").replace(",", "."));
  if (!Number.isFinite(kg) || kg < 30 || kg > 250) return { error: "El peso va en kilos, por ejemplo 75,4.", ok: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "La sesión expiró, vuelve a entrar.", ok: false };
  const { error } = await supabase
    .from("pesos")
    .upsert({ user_id: user.id, fecha: hoyEcuador(), kg, origen: "manual" }, { onConflict: "user_id,fecha,origen" });
  if (error) return { error: "No se pudo guardar. Intenta de nuevo.", ok: false };
  revalidatePath("/", "layout");
  return { error: null, ok: true };
}
