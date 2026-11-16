// "Lo de siempre" de un día (botón "Lo comí" y botón +): calcula en el
// servidor el plato de cada momento con las cantidades vigentes, para que lo
// que se registra sea exactamente lo que la app propone.
import "server-only";
import { comidaQueToca } from "@/lib/comidas/queToca";
import { horaEcuador } from "@/lib/fecha";
import { entrenosQueCuentan, type Comida, type Momento } from "@/lib/nutricion/motor";
import { platoDeMomento } from "@/lib/menu/semana";
import type { ItemMenu } from "@/lib/menu/escalar";
import type { Macros } from "@/lib/nutricion/ajuste";
import { leerDatosDia } from "./dia";
import { leerDespensa } from "./despensa";
import { planDelDia } from "./planDia";
import { aEntreno } from "./tipos";

export async function loDeSiempreDelDia(fecha: string) {
  const [d, despensa] = await Promise.all([leerDatosDia(fecha), leerDespensa()]);
  if (!d.perfil) return null;
  const plan = planDelDia({ ...d, perfil: d.perfil });
  if (!plan) return null;
  const menuTipo = Object.fromEntries(despensa.platos.filter((p) => p.menu_tipo).map((p) => [p.menu_tipo!, p.alimentos]));
  const horasLargas = entrenosQueCuentan(d.entrenosHoy.map(aEntreno))
    .filter((e) => e.deporte !== "descanso" && e.deporte !== "fuerza" && e.duracionMin >= 90)
    .reduce((s, e) => s + e.duracionMin / 60, 0);
  const dia = Math.floor(new Date(fecha + "T12:00:00Z").getTime() / 86400000);
  const objetivoDe = (m: Momento): Macros | null =>
    m === "pre_entreno" ? plan.objetivoPre : m === "durante" ? plan.objetivoDurante : m === "extra" ? null : plan.ajuste.objetivos[m as Comida];
  const plato = (m: Momento): ItemMenu[] =>
    platoDeMomento({ momento: m, objetivo: objetivoDe(m), tipo: plan.objetivo.tipo, carga: plan.carrera?.modo === "carga", menuTipo, despensa: despensa.alimentos, horasLargas, dia });
  const registradas = new Set(Object.keys(plan.consumido) as Comida[]);
  const siguiente = comidaQueToca(d.perfil.horarios_comida, horaEcuador(new Date().toISOString()), registradas);
  return { plan, plato, siguiente, registradas, horarios: d.perfil.horarios_comida, menuTipo };
}
