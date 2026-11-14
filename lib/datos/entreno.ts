// Lectura para "Cómo vas" e informe semanal (etapa 6).
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sumarDias } from "@/lib/fecha";
import type { EntrenoSemana, EntrenoZonas, NocheSueno } from "@/lib/entreno/analisis";

export async function leerEntrenoAnalisis(hoy: string) {
  const supabase = await createClient();
  const desde = sumarDias(hoy, -200);
  const [entrenos, bienestar, carreras] = await Promise.all([
    supabase.from("entrenos").select("fecha, estado, deporte, duracion_min, nombre, origen, carga, zonas_seg").gte("fecha", desde).lte("fecha", sumarDias(hoy, 7)),
    supabase.from("bienestar_diario").select("fecha, sueno_seg, hrv_semana, hrv_base_bajo, hrv_base_alto").gte("fecha", sumarDias(hoy, -27)).lte("fecha", hoy).order("fecha"),
    supabase.from("carreras").select("nombre, fecha").gte("fecha", hoy).order("fecha").limit(1),
  ]);
  const filas = (entrenos.data ?? []) as (EntrenoSemana & { carga: number | null; zonas_seg: number[] | null })[];
  const cargas: Record<string, number> = {};
  let primera: string | null = null;
  for (const e of filas) {
    if (e.estado !== "hecho" || e.carga == null) continue;
    cargas[e.fecha] = (cargas[e.fecha] ?? 0) + Number(e.carga);
    if (!primera || e.fecha < primera) primera = e.fecha;
  }
  const zonas: EntrenoZonas[] = filas.filter((e) => e.estado === "hecho" && e.fecha >= sumarDias(hoy, -27) && e.zonas_seg).map((e) => ({ fecha: e.fecha, duracion_min: e.duracion_min, zonas_seg: e.zonas_seg, nombre: e.nombre }));
  return {
    cargas,
    primera: primera ?? hoy,
    zonas,
    semana: filas as EntrenoSemana[],
    noches: (bienestar.data ?? []) as NocheSueno[],
    carrera: (carreras.data ?? [])[0] as { nombre: string; fecha: string } | undefined,
  };
}
