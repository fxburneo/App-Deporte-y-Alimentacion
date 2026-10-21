"use server";

// Guardar y borrar entrenos cargados a mano.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador, sumarDias } from "@/lib/fecha";
import { leerEntrenoForm } from "@/lib/datos/entrenoForm";

export async function guardarEntreno(_prev: { error: string | null }, fd: FormData): Promise<{ error: string | null }> {
  const hoy = hoyEcuador();
  const r = leerEntrenoForm(fd, hoy, sumarDias(hoy, 1));
  if (!r.ok) return { error: r.error };
  const supabase = await createClient();
  const { error } = await supabase.from("entrenos").insert({ ...r.entreno, origen: "manual" });
  if (error) return { error: "No se pudo guardar el entreno. Intenta de nuevo." };
  revalidatePath("/");
  redirect("/");
}

export async function borrarEntreno(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const supabase = await createClient();
  await supabase.from("entrenos").delete().eq("id", id);
  revalidatePath("/");
}
