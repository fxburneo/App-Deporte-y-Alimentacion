// Menú de un día (maqueta 2d.2): el plan del día (objetivo y reparto por
// comida) aplicado al menú tipo. Función pura; los datos los lee lib/datos/menu.ts.
import type { Alimento } from "@/lib/comidas/alimentos";
import type { PlanDia } from "@/lib/datos/planDia";
import type { AlimentoDespensa } from "@/lib/despensa/calculos";
import { sugerirDia } from "@/lib/despensa/sugerencia";
import type { Macros } from "@/lib/nutricion/ajuste";
import { COMIDAS, type Comida, type Momento, type TipoDia } from "@/lib/nutricion/motor";
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

// "Lo de siempre" para una comida de hoy (botón "Lo comí"): el menú tipo con
// las cantidades del objetivo vigente (ya ajustado por lo registrado), o el
// sugerido con la despensa si esa comida no tiene menú tipo. Antes y durante
// el entreno usan su armado propio.
export function platoDeMomento(args: {
  momento: Momento;
  objetivo: Macros | null;
  tipo: TipoDia;
  carga: boolean;
  menuTipo: Partial<Record<Comida, Alimento[]>>;
  despensa: AlimentoDespensa[];
  horasLargas: number;
  dia: number;
}): ItemMenu[] {
  const { momento, objetivo, despensa } = args;
  if (!objetivo) return [];
  if (momento === "pre_entreno") return menuPre(objetivo.carboG, despensa, objetivo.proteinaG);
  if (momento === "durante") return menuDurante(objetivo.carboG, args.horasLargas, despensa);
  if (momento === "extra") return [];
  const tipo = args.menuTipo[momento];
  if (tipo?.length) return escalarPlato(tipo, objetivo, despensa, args.tipo, args.carga);
  const s = sugerirDia({ desayuno: objetivo, media_manana: objetivo, almuerzo: objetivo, media_tarde: objetivo, cena: objetivo }, despensa, args.dia, [momento]);
  return (s[momento] ?? []).map((a) => ({ ...a, varia: false }));
}
