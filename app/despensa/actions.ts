"use server";

// Mi despensa: leer etiquetas, guardar y borrar alimentos y platos, menú tipo.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AlimentoSchema, alimentoValido } from "@/lib/comidas/alimentos";
import { inferirCategoria, por100DesdePorcion } from "@/lib/despensa/calculos";
import { ErrorIA } from "@/lib/ia/claude";
import { leerEtiqueta, type Etiqueta } from "@/lib/ia/leerEtiqueta";
import { COMIDAS } from "@/lib/nutricion/motor";

async function usuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const FOTO = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export type ResultadoEtiqueta = { ok: true; etiqueta: Etiqueta } | { ok: false; error: string };

export async function leerEtiquetaAccion(fd: FormData): Promise<ResultadoEtiqueta> {
  const { user } = await usuario();
  if (!user) return { ok: false, error: "La sesión expiró, vuelve a entrar." };
  const m = FOTO.exec(String(fd.get("foto") ?? ""));
  if (!m) return { ok: false, error: "La foto no se pudo leer. Prueba con otra." };
  try {
    return { ok: true, etiqueta: await leerEtiqueta(m[2], m[1] as "image/jpeg") };
  } catch (e) {
    return { ok: false, error: e instanceof ErrorIA ? e.message : "No se pudo leer la etiqueta." };
  }
}

const AlimentoNuevo = z.object({
  nombre: z.string().trim().min(2).max(80),
  marca: z.string().trim().max(60),
  porcion_g: z.number().positive().max(2000),
  porcion_nombre: z.string().trim().min(1).max(60),
  unidad_g: z.number().positive().max(2000).nullable(),
  unidad_nombre: z.string().trim().max(30),
  // Macros de la porción (como en la etiqueta); se guardan por 100 g.
  carbo: z.number().min(0).max(2000),
  proteina: z.number().min(0).max(2000),
  grasa: z.number().min(0).max(2000),
  origen: z.enum(["etiqueta", "manual"]),
});

export type ResultadoGuardar = { ok: true } | { ok: false; error: string };

export async function guardarAlimento(datos: unknown): Promise<ResultadoGuardar> {
  const p = AlimentoNuevo.safeParse(datos);
  if (!p.success) return { ok: false, error: "Revisa los datos: falta el nombre, la porción o hay un número fuera de rango." };
  const d = p.data;
  const por100 = por100DesdePorcion(d.porcion_g, d.carbo, d.proteina, d.grasa);
  if (por100.carbo_100 + por100.proteina_100 + por100.grasa_100 > 101) return { ok: false, error: "Los macros superan el peso de la porción: revisa los gramos." };
  const { supabase, user } = await usuario();
  if (!user) return { ok: false, error: "La sesión expiró, vuelve a entrar." };
  const { error } = await supabase.from("despensa_alimentos").insert({
    user_id: user.id,
    nombre: d.nombre,
    marca: d.marca || null,
    tipo: d.marca ? "marca" : "generico",
    categoria: inferirCategoria(por100.carbo_100, por100.proteina_100, por100.grasa_100),
    ...por100,
    porcion_g: d.porcion_g,
    porcion_nombre: d.porcion_nombre,
    unidad_g: d.unidad_g,
    unidad_nombre: d.unidad_nombre || null,
    origen: d.origen,
  });
  if (error) return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function borrarAlimento(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const { supabase } = await usuario();
  await supabase.from("despensa_alimentos").delete().eq("id", id);
  revalidatePath("/", "layout");
}

const PlatoNuevo = z.object({
  nombre: z.string().trim().min(2).max(80),
  alimentos: z.array(AlimentoSchema).min(1).max(30),
});

export async function guardarPlato(datos: unknown): Promise<ResultadoGuardar> {
  const p = PlatoNuevo.safeParse(datos);
  if (!p.success || !p.data.alimentos.every(alimentoValido)) return { ok: false, error: "Revisa el plato: falta el nombre o un alimento." };
  const { supabase, user } = await usuario();
  if (!user) return { ok: false, error: "La sesión expiró, vuelve a entrar." };
  const { error } = await supabase.from("despensa_platos").insert({ user_id: user.id, nombre: p.data.nombre, alimentos: p.data.alimentos });
  if (error) return { ok: false, error: "No se pudo guardar el plato." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Guardar un registro de comida como plato habitual.
export async function guardarRegistroComoPlato(fd: FormData) {
  const id = Number(fd.get("comida_id"));
  const nombre = String(fd.get("nombre") ?? "").trim().slice(0, 80);
  if (!Number.isInteger(id) || nombre.length < 2) return;
  const { supabase, user } = await usuario();
  if (!user) return;
  const { data } = await supabase.from("comidas").select("alimentos").eq("id", id).maybeSingle();
  if (!data) return;
  await supabase.from("despensa_platos").insert({ user_id: user.id, nombre, alimentos: data.alimentos });
  revalidatePath("/", "layout");
}

// Menú tipo: un plato por comida. Asignarlo a una comida se lo quita al anterior.
export async function asignarMenuTipo(fd: FormData) {
  const id = Number(fd.get("id"));
  const comida = String(fd.get("comida") ?? "");
  if (!Number.isInteger(id)) return;
  const { supabase, user } = await usuario();
  if (!user) return;
  const valida = (COMIDAS as string[]).includes(comida) ? comida : null;
  if (valida) await supabase.from("despensa_platos").update({ menu_tipo: null }).eq("menu_tipo", valida).neq("id", id);
  await supabase.from("despensa_platos").update({ menu_tipo: valida }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function borrarPlato(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const { supabase } = await usuario();
  await supabase.from("despensa_platos").delete().eq("id", id);
  revalidatePath("/", "layout");
}
