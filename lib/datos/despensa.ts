// Lectura de Mi despensa: alimentos y platos del usuario (RLS).
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AlimentoDespensa } from "@/lib/despensa/calculos";
import type { AlimentoRegistrado } from "./tipos";
import type { Comida } from "@/lib/nutricion/motor";

export interface PlatoFila {
  id: number;
  nombre: string;
  alimentos: AlimentoRegistrado[];
  menu_tipo: Comida | null;
}

const num = (x: unknown) => (x == null ? null : Number(x));

export async function leerDespensa() {
  const supabase = await createClient();
  const [a, p] = await Promise.all([
    supabase.from("despensa_alimentos").select("*").order("nombre"),
    supabase.from("despensa_platos").select("id, nombre, alimentos, menu_tipo").order("nombre"),
  ]);
  const alimentos: AlimentoDespensa[] = (a.data ?? []).map((f) => ({
    id: f.id,
    nombre: f.nombre,
    marca: f.marca,
    tipo: f.tipo,
    categoria: f.categoria,
    carbo_100: Number(f.carbo_100),
    proteina_100: Number(f.proteina_100),
    grasa_100: Number(f.grasa_100),
    porcion_g: Number(f.porcion_g),
    porcion_nombre: f.porcion_nombre,
    unidad_g: num(f.unidad_g),
    unidad_nombre: f.unidad_nombre,
  }));
  return { alimentos, platos: (p.data ?? []) as PlatoFila[] };
}
