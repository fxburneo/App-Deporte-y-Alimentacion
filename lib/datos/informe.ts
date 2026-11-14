// Datos de una semana para el informe (etapa 6): plan del día de cada día con
// lo comido, entrenos, sueño y peso.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sumarDias } from "@/lib/fecha";
import { kcalDe } from "@/lib/nutricion/ajuste";
import { tipoDia } from "@/lib/nutricion/motor";
import type { DiaInforme } from "@/lib/entreno/informe";
import { planDelDia } from "./planDia";
import { aEntreno, type CarreraFila, type ComidaFila, type EntrenoFila, type PerfilFila, type PesoFila } from "./tipos";

export async function leerSemanaInforme(lunes: string) {
  const supabase = await createClient();
  const domingo = sumarDias(lunes, 6);
  const [perfil, pesos, entrenos, comidas, bienestar, carreras] = await Promise.all([
    supabase.from("perfil").select("*").maybeSingle(),
    supabase.from("pesos").select("id, fecha, kg, origen").gte("fecha", sumarDias(lunes, -60)).lte("fecha", domingo).order("fecha", { ascending: false }),
    supabase.from("entrenos").select("*").gte("fecha", lunes).lte("fecha", sumarDias(domingo, 1)),
    supabase.from("comidas").select("*").gte("fecha", lunes).lte("fecha", domingo),
    supabase.from("bienestar_diario").select("fecha, sueno_seg, hrv_noche").gte("fecha", lunes).lte("fecha", domingo),
    supabase.from("carreras").select("*"),
  ]);
  const p = perfil.data as PerfilFila | null;
  if (!p) return null;
  const listaPesos = ((pesos.data ?? []) as PesoFila[]).map((x) => ({ ...x, kg: Number(x.kg) }));
  const ents = (entrenos.data ?? []) as EntrenoFila[];
  const coms = (comidas.data ?? []) as ComidaFila[];
  const dias: DiaInforme[] = [];
  for (let i = 0; i < 7; i++) {
    const fecha = sumarDias(lunes, i);
    const hoyE = ents.filter((e) => e.fecha === fecha);
    const plan = planDelDia({
      fecha,
      perfil: p,
      pesos: listaPesos,
      entrenosHoy: hoyE,
      entrenosManana: ents.filter((e) => e.fecha === sumarDias(fecha, 1)),
      comidas: coms,
      carreras: (carreras.data ?? []) as CarreraFila[],
    });
    if (!plan) continue;
    const b = (bienestar.data ?? []).find((x) => x.fecha === fecha);
    const comioAlgo = coms.some((c) => c.fecha === fecha);
    dias.push({
      fecha,
      tipo: tipoDia(hoyE.map(aEntreno)),
      plan: hoyE.filter((e) => e.estado === "planificado" && e.deporte !== "descanso").map((e) => `${(e.nombre ?? e.deporte).replace(/^[^:]+:\s*/, "")} ${e.duracion_min} min`),
      hecho: hoyE.filter((e) => e.estado === "hecho").map((e) => ({ deporte: e.deporte, duracion_min: e.duracion_min, carga: e.carga ?? null })),
      objetivo: { ...plan.objetivo, kcal: plan.objetivo.kcal },
      comido: comioAlgo ? { ...plan.totalConsumido, kcal: kcalDe(plan.totalConsumido) } : null,
      durante: plan.objetivoDurante ? { objetivoG: plan.objetivoDurante.carboG, comidoG: plan.consumoDurante?.carboG ?? 0 } : null,
      suenoSeg: b?.sueno_seg ?? null,
      hrv: b?.hrv_noche ?? null,
    });
  }
  return { dias, pesos: listaPesos.map((x) => ({ fecha: x.fecha, kg: x.kg })) };
}
