// Lectura para el menú de la semana: perfil, pesos, entrenos planificados de
// los próximos días (TrainingPeaks), carreras y despensa.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hoyEcuador, sumarDias } from "@/lib/fecha";
import { entrenosQueCuentan } from "@/lib/nutricion/motor";
import { menuDelDia, type MenuDia } from "@/lib/menu/semana";
import { leerDespensa } from "./despensa";
import { planDelDia, type PlanDia } from "./planDia";
import { aEntreno, type CarreraFila, type EntrenoFila, type PerfilFila, type PesoFila } from "./tipos";

export interface DiaSemana {
  fecha: string;
  plan: PlanDia;
  menu: MenuDia;
  entrenos: EntrenoFila[];
}

export async function leerMenuSemana(dias: number, desde: string = hoyEcuador()) {
  const supabase = await createClient();
  const hasta = sumarDias(desde, dias);
  const [perfil, pesos, entrenos, carreras, despensa] = await Promise.all([
    supabase.from("perfil").select("*").maybeSingle(),
    supabase.from("pesos").select("id, fecha, kg, origen").order("fecha", { ascending: false }).limit(20),
    supabase.from("entrenos").select("*").gte("fecha", desde).lte("fecha", hasta).order("hora", { ascending: true }),
    supabase.from("carreras").select("*").gte("fecha", desde),
    leerDespensa(),
  ]);
  const p = perfil.data as PerfilFila | null;
  if (!p) return null;
  const listaPesos = ((pesos.data ?? []) as PesoFila[]).map((x) => ({ ...x, kg: Number(x.kg) }));
  const lista = (entrenos.data ?? []) as EntrenoFila[];
  const menuTipo = Object.fromEntries(despensa.platos.filter((x) => x.menu_tipo).map((x) => [x.menu_tipo!, x.alimentos]));
  const resultado: DiaSemana[] = [];
  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(desde, i);
    const hoy = lista.filter((e) => e.fecha === fecha);
    const plan = planDelDia({
      fecha,
      perfil: p,
      pesos: listaPesos,
      entrenosHoy: hoy,
      entrenosManana: lista.filter((e) => e.fecha === sumarDias(fecha, 1)),
      comidas: [],
      carreras: (carreras.data ?? []) as CarreraFila[],
    });
    if (!plan) return null;
    const horasLargas = entrenosQueCuentan(hoy.map(aEntreno))
      .filter((e) => e.deporte !== "descanso" && e.deporte !== "fuerza" && e.duracionMin >= 90)
      .reduce((s, e) => s + e.duracionMin / 60, 0);
    const dia = Math.floor(new Date(fecha + "T12:00:00Z").getTime() / 86400000);
    resultado.push({ fecha, plan, entrenos: hoy, menu: menuDelDia({ fecha, plan, menuTipo, despensa: despensa.alimentos, horasLargas, dia }) });
  }
  return { dias: resultado, despensa: despensa.alimentos };
}
