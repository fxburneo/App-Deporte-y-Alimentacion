// Menú de un día (maqueta 2d.2): el plan del día (objetivo y reparto por
// comida) aplicado al menú tipo. Función pura; los datos los lee lib/datos/menu.ts.
import type { Alimento } from "@/lib/comidas/alimentos";
import type { PlanDia } from "@/lib/datos/planDia";
import type { AlimentoDespensa } from "@/lib/despensa/calculos";
import { sugerirDia } from "@/lib/despensa/sugerencia";
import type { Macros } from "@/lib/nutricion/ajuste";
import { COMIDAS, type Comida, type Momento } from "@/lib/nutricion/motor";
import { escalarPlato, menuDurante, menuPre, totalesItems, type ItemMenu } from "./escalar";

export interface ComidaMenu {
  momento: Momento;
  items: ItemMenu[];
  deMenuTipo: boolean; // false: sugerido con la despensa (esa comida no tiene menú tipo)
}

export interface MenuDia {
  fecha: string;
  comidas: ComidaMenu[];
  total: Macros;
}

export function menuDelDia(args: {
  fecha: string;
  plan: PlanDia;
  menuTipo: Partial<Record<Comida, Alimento[]>>;
  despensa: AlimentoDespensa[];
  horasLargas: number; // horas de entreno de 90 min o más (para la comida durante)
  dia: number; // para rotar el sugerido de las comidas sin menú tipo
}): MenuDia {
  const { plan, despensa } = args;
  const carga = plan.carrera?.modo === "carga";
  const comidas: ComidaMenu[] = [];
  if (plan.objetivoPre) comidas.push({ momento: "pre_entreno", items: menuPre(plan.objetivoPre.carboG, despensa, plan.objetivoPre.proteinaG), deMenuTipo: false });
  if (plan.objetivoDurante) comidas.push({ momento: "durante", items: menuDurante(plan.objetivoDurante.carboG, args.horasLargas, despensa), deMenuTipo: false });
  const sinMenu = COMIDAS.filter((c) => !args.menuTipo[c]?.length);
  const sugeridas = sinMenu.length ? sugerirDia(plan.reparto, despensa, args.dia, sinMenu) : {};
  for (const c of COMIDAS) {
    const tipo = args.menuTipo[c];
    if (tipo?.length) comidas.push({ momento: c, items: escalarPlato(tipo, plan.reparto[c], despensa, plan.objetivo.tipo, carga), deMenuTipo: true });
    else comidas.push({ momento: c, items: (sugeridas[c] ?? []).map((a) => ({ ...a, varia: false })), deMenuTipo: false });
  }
  const total = totalesItems(comidas.flatMap((x) => x.items));
  return { fecha: args.fecha, comidas, total };
}
