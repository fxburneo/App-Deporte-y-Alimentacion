// Lectura de todo lo que necesita una pantalla para calcular el día.
// Corre en el servidor con la sesión del usuario: la seguridad por fila de
// Supabase garantiza que solo se leen sus propios datos.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador, sumarDias } from "@/lib/fecha";
import type { DiaBienestar } from "@/lib/recuperacion";
import type { ComidaFila, EntrenoFila, PerfilFila, PesoFila, SincronizacionFila } from "./tipos";

export async function leerPerfil(): Promise<PerfilFila | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("perfil").select("*").maybeSingle();
  return (data as PerfilFila | null) ?? null;
}

export async function leerDatosDia(fecha: string = hoyEcuador()) {
  const supabase = await createClient();
  const manana = sumarDias(fecha, 1);
  const [perfil, pesos, entrenos, bienestar, sync, comidas] = await Promise.all([
    supabase.from("perfil").select("*").maybeSingle(),
    supabase.from("pesos").select("id, fecha, kg, origen").gte("fecha", sumarDias(fecha, -60)).order("fecha", { ascending: false }),
    supabase.from("entrenos").select("*").in("fecha", [fecha, manana]).order("hora", { ascending: true }),
    supabase.from("bienestar_diario").select("*").gte("fecha", sumarDias(fecha, -14)).lte("fecha", fecha),
    supabase.from("sincronizaciones").select("inicio, fin, ok, registros, detalle").order("inicio", { ascending: false }).limit(10),
    supabase.from("comidas").select("*").eq("fecha", fecha).order("creado_en", { ascending: true }),
  ]);
  const syncs = (sync.data ?? []) as SincronizacionFila[];
  const listaEntrenos = (entrenos.data ?? []) as EntrenoFila[];
  return {
    fecha,
    manana,
    perfil: (perfil.data as PerfilFila | null) ?? null,
    pesos: ((pesos.data ?? []) as PesoFila[]).map((p) => ({ ...p, kg: Number(p.kg) })),
    entrenosHoy: listaEntrenos.filter((e) => e.fecha === fecha),
    entrenosManana: listaEntrenos.filter((e) => e.fecha === manana),
    bienestar: (bienestar.data ?? []) as DiaBienestar[],
    ultimaSync: syncs[0] ?? null,
    ultimaSyncOk: syncs.find((x) => x.ok) ?? null,
    comidas: (comidas.data ?? []) as ComidaFila[],
  };
}

// Últimos 7 días (para "últimos 7 días" en Comidas): entrenos desde hace 6
// días hasta mañana y comidas de esos 7 días. El peso ya viene en leerDatosDia.
export async function leerSemana(fecha: string = hoyEcuador()) {
  const supabase = await createClient();
  const desde = sumarDias(fecha, -6);
  const [entrenos, comidas] = await Promise.all([
    supabase.from("entrenos").select("*").gte("fecha", desde).lte("fecha", sumarDias(fecha, 1)),
    supabase.from("comidas").select("*").gte("fecha", desde).lte("fecha", fecha),
  ]);
  return {
    entrenos: (entrenos.data ?? []) as EntrenoFila[],
    comidas: (comidas.data ?? []) as ComidaFila[],
  };
}

// Entrenos de un rango de fechas (para estimar el ritmo de bajada en Más).
export async function leerEntrenos(desde: string, hasta: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("entrenos").select("*").gte("fecha", desde).lte("fecha", hasta);
  return (data ?? []) as EntrenoFila[];
}
