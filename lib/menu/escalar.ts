// Menú tipo escalado al día (etapa 5, maqueta 2d): lo fijo no cambia; los
// alimentos de carbohidrato (pan, arroz, papa, galletas, fruta, tortillas) se
// ajustan para llegar al carbohidrato de la comida ese día, en unidades
// prácticas. El arroz va integral o blanco según el tipo de día.
import type { Alimento } from "@/lib/comidas/alimentos";
import { aAlimento, type AlimentoDespensa } from "@/lib/despensa/calculos";
import type { Macros } from "@/lib/nutricion/ajuste";
import type { TipoDia } from "@/lib/nutricion/motor";

const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const buscar = (despensa: AlimentoDespensa[], nombre: string) => despensa.find((d) => normal(d.nombre) === normal(nombre));

// Integral en descanso y Z2 (más fibra, llena más con menos carbohidrato);
// blanco en días moderados, intensos, largos y de carga (más carbohidrato con
// menos volumen y digestión rápida).
export function arrozDelDia(tipo: TipoDia, carga = false): "integral" | "blanco" {
  return carga || tipo === "moderado" || tipo === "duro" || tipo === "muy_largo" ? "blanco" : "integral";
}

// Paso de redondeo: una unidad si es chica (pan, galleta, tortilla), un cuarto
// si es grande (taza, banano).
export function pasoDe(d: AlimentoDespensa): number {
  const u = d.unidad_g ?? d.porcion_g;
  return u <= 60 ? u : u / 4;
}

export interface ItemMenu extends Alimento {
  varia: boolean; // cambia según el día (se muestra resaltado)
}

export function escalarPlato(alimentos: Alimento[], objetivo: Macros, despensa: AlimentoDespensa[], tipo: TipoDia, carga = false): ItemMenu[] {
  // 1. Arroz del día.
  const arroz = arrozDelDia(tipo, carga);
  const base: { a: Alimento; d: AlimentoDespensa | undefined }[] = alimentos.map((a) => {
    const n = normal(a.nombre);
    const otro = arroz === "blanco" && n.startsWith("arroz integral") ? "Arroz blanco cocido" : arroz === "integral" && n.startsWith("arroz blanco") ? "Arroz integral cocido" : null;
    const d2 = otro ? buscar(despensa, otro) : undefined;
    if (d2) {
      // Mismo carbohidrato con el otro arroz.
      const g = d2.carbo_100 > 0 ? (a.carbo_g / d2.carbo_100) * 100 : a.gramos;
      return { a: { ...aAlimento(d2, g), detalle: "" }, d: d2 };
    }
    return { a, d: buscar(despensa, a.nombre) };
  });

  // 2. Separar lo que varía (carbohidrato) de lo fijo.
  const esVariable = (x: { d: AlimentoDespensa | undefined }) => x.d?.categoria === "carbo";
  const fijoC = base.filter((x) => !esVariable(x)).reduce((s, x) => s + x.a.carbo_g, 0);
  const varC = base.filter(esVariable).reduce((s, x) => s + x.a.carbo_g, 0);
  const f = varC > 0 ? Math.min(3, Math.max(0, objetivo.carboG - fijoC) / varC) : 1;

  // 3. Escalar y redondear a unidades prácticas.
  const items: ItemMenu[] = [];
  for (const x of base) {
    if (!esVariable(x) || !x.d) {
      items.push({ ...x.a, varia: false });
      continue;
    }
    const paso = pasoDe(x.d);
    // Lo marcado "solo en días con entreno" no va en descanso; lo demás nunca
    // desaparece del menú tipo (mínimo una unidad o ¼ de taza).
    if (tipo === "descanso" && normal(x.a.detalle).includes("solo")) continue;
    // Tope: hasta el doble de lo que tiene el menú tipo (9 galletas no es una media mañana).
    const g = Math.max(paso, Math.min(Math.round((x.a.gramos * 2) / paso) * paso, Math.round((x.a.gramos * f) / paso) * paso));
    items.push({ ...aAlimento(x.d, g), detalle: x.a.detalle && !normal(x.a.detalle).includes("dias") ? x.a.detalle : "", varia: true });
  }
  return items;
}

// Snack antes de entrenar: ~25 g de carbohidrato con pan de agua y miel (o
// banano si no hay pan en la despensa).
export function menuPre(gramosC: number, despensa: AlimentoDespensa[]): ItemMenu[] {
  const pan = despensa.find((d) => normal(d.nombre).startsWith("pan de agua")) ?? despensa.find((d) => normal(d.nombre).startsWith("pan"));
  const miel = despensa.find((d) => normal(d.nombre).startsWith("miel"));
  if (pan) {
    const panes = Math.max(1, Math.round(gramosC / 35));
    const items: ItemMenu[] = [{ ...aAlimento(pan, (pan.unidad_g ?? pan.porcion_g) * panes), varia: true }];
    const resto = gramosC - items[0].carbo_g;
    if (miel && resto > 4) items.push({ ...aAlimento(miel, Math.min(21, Math.round((resto / miel.carbo_100) * 100))), varia: true });
    return items;
  }
  const banano = despensa.find((d) => normal(d.nombre).startsWith("banano"));
  return banano ? [{ ...aAlimento(banano, (gramosC / banano.carbo_100) * 100), varia: true }] : [];
}

// Durante el entreno: 1 botella de bebida isotónica cada 2 h y el resto en geles.
export function menuDurante(gramosC: number, horas: number, despensa: AlimentoDespensa[]): ItemMenu[] {
  const bebida = despensa.find((d) => normal(d.nombre).startsWith("bebida isotonica"));
  const gel = despensa.find((d) => normal(d.nombre).startsWith("gel"));
  const items: ItemMenu[] = [];
  let resto = gramosC;
  if (bebida) {
    const botellas = Math.max(1, Math.round(horas / 2));
    const b = aAlimento(bebida, bebida.porcion_g * botellas);
    items.push({ ...b, varia: true });
    resto -= b.carbo_g;
  }
  if (gel && resto > 10) {
    const porGel = (gel.carbo_100 * gel.porcion_g) / 100;
    items.push({ ...aAlimento(gel, gel.porcion_g * Math.max(1, Math.round(resto / porGel))), varia: true });
  }
  return items;
}

export const textoMenu = (items: Alimento[]) =>
  items.map((a) => (a.medida_casera === "a gusto" ? `${a.nombre.split(" (")[0]} a gusto` : `${a.nombre.split(" (")[0]} ${a.medida_casera}`)).join(" · ");

export const totalesItems = (items: Alimento[]): Macros =>
  items.reduce((s, a) => ({ carboG: s.carboG + a.carbo_g, proteinaG: s.proteinaG + a.proteina_g, grasaG: s.grasaG + a.grasa_g }), { carboG: 0, proteinaG: 0, grasaG: 0 });

