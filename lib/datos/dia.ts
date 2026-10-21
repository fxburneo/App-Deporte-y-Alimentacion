// Lectura de todo lo que necesita una pantalla para calcular el día.
// Corre en el servidor con la sesión del usuario: la seguridad por fila de
// Supabase garantiza que solo se leen sus propios datos.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador, sumarDias } from "@/lib/fecha";
import type { EntrenoFila, PerfilFila, PesoFila } from "./tipos";

export async function leerPerfil(): Promise<PerfilFila | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("perfil").select("*").maybeSingle();
  return (data as PerfilFila | null) ?? null;
}

export async function leerDatosDia(fecha: string = hoyEcuador()) {
  const supabase = await createClient();
  const manana = sumarDias(fecha, 1);
  const [perfil, pesos, entrenos] = await Promise.all([
    supabase.from("perfil").select("*").maybeSingle(),
    supabase.from("pesos").select("id, fecha, kg, origen").gte("fecha", sumarDias(fecha, -60)).order("fecha", { ascending: false }),
    supabase.from("entrenos").select("*").in("fecha", [fecha, manana]).order("hora", { ascending: true }),
  ]);
  const listaEntrenos = (entrenos.data ?? []) as EntrenoFila[];
  return {
    fecha,
    manana,
    perfil: (perfil.data as PerfilFila | null) ?? null,
    pesos: ((pesos.data ?? []) as PesoFila[]).map((p) => ({ ...p, kg: Number(p.kg) })),
    entrenosHoy: listaEntrenos.filter((e) => e.fecha === fecha),
    entrenosManana: listaEntrenos.filter((e) => e.fecha === manana),
  };
}
