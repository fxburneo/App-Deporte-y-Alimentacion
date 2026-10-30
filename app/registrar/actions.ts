"use server";

// Registrar comida: leer con la IA, guardar y borrar.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador } from "@/lib/fecha";
import { AlimentoSchema, alimentoValido, totales, type Analisis } from "@/lib/comidas/alimentos";
import { analizarComida, ErrorIA } from "@/lib/ia/analizarComida";
import { COMIDAS } from "@/lib/nutricion/motor";

export type ResultadoAnalisis = { ok: true; analisis: Analisis } | { ok: false; error: string };

const FOTO = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export async function analizar(fd: FormData): Promise<ResultadoAnalisis> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "La sesión expiró, vuelve a entrar." };

  const texto = String(fd.get("texto") ?? "").slice(0, 1000);
  const foto = String(fd.get("foto") ?? "");
  const m = foto ? FOTO.exec(foto) : null;
  if (foto && !m) return { ok: false, error: "La foto no se pudo leer. Prueba con otra." };
  if (!m && texto.trim().length < 3) return { ok: false, error: "Toma una foto o escribe qué comiste." };

  try {
    const analisis = await analizarComida({
      fotoBase64: m?.[2],
      tipoFoto: m?.[1] as "image/jpeg" | "image/png" | "image/webp" | undefined,
      texto,
    });
    return { ok: true, analisis };
  } catch (e) {
    return { ok: false, error: e instanceof ErrorIA ? e.message : "No se pudo analizar la comida. Intenta de nuevo." };
  }
}

const GuardarSchema = z.object({
  comida: z.enum(COMIDAS),
  origen: z.enum(["foto", "texto", "repetida"]),
  descripcion: z.string().max(1000),
  alimentos: z.array(AlimentoSchema).min(1).max(30),
});

export type ResultadoGuardar = { ok: true } | { ok: false; error: string };

export async function guardarComida(datos: unknown): Promise<ResultadoGuardar> {
  const p = GuardarSchema.safeParse(datos);
  if (!p.success || !p.data.alimentos.every(alimentoValido)) return { ok: false, error: "Revisa los alimentos: hay un valor fuera de rango." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "La sesión expiró, vuelve a entrar." };

  const t = totales(p.data.alimentos);
  const { error } = await supabase.from("comidas").insert({
    user_id: user.id,
    fecha: hoyEcuador(),
    comida: p.data.comida,
    origen: p.data.origen,
    descripcion: p.data.descripcion || null,
    alimentos: p.data.alimentos,
    carbo_g: t.carboG,
    proteina_g: t.proteinaG,
    grasa_g: t.grasaG,
    kcal: t.kcal,
  });
  if (error) return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function borrarComida(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const supabase = await createClient();
  await supabase.from("comidas").delete().eq("id", id);
  revalidatePath("/", "layout");
}
