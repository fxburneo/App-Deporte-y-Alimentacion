"use server";

// Guardar, editar y borrar carreras (etapa 4).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador } from "@/lib/fecha";
import { leerCarreraForm } from "@/lib/datos/carreraForm";

export async function guardarCarrera(_prev: { error: string | null }, fd: FormData): Promise<{ error: string | null }> {
  const r = leerCarreraForm(fd, hoyEcuador());
  if (!r.ok) return { error: r.error };
  const id = Number(fd.get("id"));
  const supabase = await createClient();
  const { error } = Number.isInteger(id) && id > 0
    ? await supabase.from("carreras").update(r.carrera).eq("id", id)
    : await supabase.from("carreras").insert(r.carrera);
  if (error) return { error: "No se pudo guardar la carrera. Intenta de nuevo." };
  revalidatePath("/", "layout");
  redirect("/carreras");
}

export async function borrarCarrera(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const supabase = await createClient();
  await supabase.from("carreras").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/carreras");
}
