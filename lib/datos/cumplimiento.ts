// Lectura de lo que necesita el cumplimiento de un periodo (Yo, Hoy y la
// pantalla de cumplimiento). Corre en el servidor con la sesión del usuario.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sumarDias } from "@/lib/fecha";
import { resumenPeriodo } from "./cumplimientoPeriodo";
import type { CarreraFila, ComidaFila, EntrenoFila, PerfilFila, PesoFila } from "./tipos";

export async function leerCumplimiento(desde: string, hasta: string, hoy: string) {
  const supabase = await createClient();
  const [perfil, pesos, entrenos, comidas, carreras] = await Promise.all([
    supabase.from("perfil").select("*").maybeSingle(),
    supabase.from("pesos").select("id, fecha, kg, origen").lte("fecha", hasta).order("fecha", { ascending: false }),
    supabase.from("entrenos").select("*").gte("fecha", desde).lte("fecha", sumarDias(hasta, 1)),
    supabase.from("comidas").select("id, fecha, comida, carbo_g, proteina_g, grasa_g, kcal").gte("fecha", desde).lte("fecha", hasta),
    supabase.from("carreras").select("*"),
  ]);
  if (!perfil.data) return null;
  return resumenPeriodo({
    desde,
    hasta,
    hoy,
    perfil: perfil.data as PerfilFila,
    pesos: ((pesos.data ?? []) as PesoFila[]).map((p) => ({ ...p, kg: Number(p.kg) })),
    entrenos: (entrenos.data ?? []) as EntrenoFila[],
    comidas: (comidas.data ?? []) as ComidaFila[],
    carreras: (carreras.data ?? []) as CarreraFila[],
  });
}

// Fechas con al menos una comida registrada (para la racha), últimos 120 días.
export async function leerFechasConRegistro(hoy: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("comidas").select("fecha").gte("fecha", sumarDias(hoy, -120)).lte("fecha", hoy);
  return (data ?? []).map((x) => x.fecha as string);
}
