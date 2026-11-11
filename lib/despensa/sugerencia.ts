// Menú sugerido para una comida (pedido de Francisco, 5-nov): con los
// alimentos de su despensa y el objetivo vigente de la comida arma un plato
// concreto en gramos. Sin IA: plantillas por comida, opciones que rotan cada
// día y los gramos de la calculadora. Función pura, probada en sugerencia.test.ts.
import type { Alimento } from "@/lib/comidas/alimentos";
import type { Macros } from "@/lib/nutricion/ajuste";
import { COMIDAS, type Comida } from "@/lib/nutricion/motor";
import { aAlimento, calcularPlato, type AlimentoDespensa } from "./calculos";

// Cada plantilla es una lista de "huecos"; cada hueco tiene opciones (inicio
// del nombre en la despensa) y se elige una según el día. Media mañana y media
// tarde tienen plantillas distintas para que no se repitan.
const PLANTILLAS: Record<Comida, string[][]> = {
  desayuno: [["Huevo", "Queso fresco"], ["Pan de agua", "Pan integral", "Avena", "Pan tostado"], ["Papaya", "Banano"]],
  media_manana: [["Yogur griego", "Leche"], ["Banano", "Papaya"]],
  almuerzo: [["Pechuga de pollo", "Carne de res"], ["Arroz", "Papa", "Fideo"], ["Aguacate", "Aceite"], ["Ensalada"]],
  media_tarde: [["Pan de agua", "Pan tostado", "Pan integral"], ["Queso fresco", "Huevo", "Yogur griego"]],
  cena: [["Pechuga de pollo", "Carne de res", "Huevo"], ["Papa", "Fideo", "Arroz"], ["Aguacate", "Aceite"], ["Ensalada"]],
};

// Tope de una porción realista: proteína hasta 1½ porción (o 3 unidades
// chicas: huevos, tajadas); carbohidrato hasta 2½ porciones (3 si son
// unidades chicas, como panes); lo demás, 2 porciones.
export function topeGramos(a: AlimentoDespensa): number {
  const chica = a.unidad_g != null && a.unidad_g <= 60;
  if (a.categoria === "proteina") return chica ? 3 * a.unidad_g! : 1.5 * a.porcion_g;
  if (a.categoria === "carbo") return chica ? Math.max(3 * a.unidad_g!, 2.5 * a.porcion_g) : 2.5 * a.porcion_g;
  return 2 * a.porcion_g;
}

const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Un plato para una comida. `evitar`: alimentos ya sugeridos hoy en otra
// comida; se saltan si queda otra opción en ese hueco.
export function sugerirPlato(comida: Comida, objetivo: Macros, despensa: AlimentoDespensa[], dia: number, evitar: AlimentoDespensa[] = []): Alimento[] {
  const elegidos: AlimentoDespensa[] = [];
  PLANTILLAS[comida].forEach((opciones, hueco) => {
    const disponibles = opciones
      .map((o) => despensa.find((a) => normal(a.nombre).startsWith(normal(o)) && !elegidos.includes(a)))
      .filter((a): a is AlimentoDespensa => a != null);
    const nuevos = disponibles.filter((a) => !evitar.includes(a));
    const lista = nuevos.length ? nuevos : disponibles;
    if (lista.length) elegidos.push(lista[(dia + hueco) % lista.length]);
  });
  if (elegidos.length === 0) return [];
  const gramos = calcularPlato(objetivo, elegidos);
  return elegidos
    .map((a, i) =>
      a.categoria === "libre"
        ? { ...aAlimento(a, a.porcion_g), medida_casera: "a gusto" }
        : aAlimento(a, Math.min(gramos[i].gramos, Math.round(topeGramos(a) / 5) * 5))
    )
    .filter((x) => x.gramos > 0);
}

// Menú del día completo, en orden: cada comida evita la proteína y el
// carbohidrato que ya sugirieron las anteriores (si hay alternativa), así
// media mañana y media tarde no se repiten y almuerzo y cena tampoco.
export function sugerirDia(objetivos: Record<Comida, Macros>, despensa: AlimentoDespensa[], dia: number, comidas: Comida[] = COMIDAS): Partial<Record<Comida, Alimento[]>> {
  const usados: AlimentoDespensa[] = [];
  const r: Partial<Record<Comida, Alimento[]>> = {};
  for (const c of COMIDAS) {
    if (!comidas.includes(c)) continue;
    const plato = sugerirPlato(c, objetivos[c], despensa, dia, usados);
    for (const a of plato) {
      const d = despensa.find((x) => x.nombre === a.nombre);
      if (d && (d.categoria === "proteina" || d.categoria === "carbo")) usados.push(d);
    }
    r[c] = plato;
  }
  return r;
}

// Texto corto: "Pechuga de pollo 120 g · Arroz blanco cocido 140 g (1 taza)".
export function textoPlato(plato: Alimento[]): string {
  return plato.map((a) => (a.medida_casera === "a gusto" ? `${a.nombre} a gusto` : `${a.nombre} ${a.gramos} g (${a.medida_casera})`)).join(" · ");
}
