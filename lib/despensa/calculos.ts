// Cuentas de Mi despensa (etapa 3.1): porciones, medida casera, la calculadora
// "¿Cuánto me sirvo?" y el ajuste traducido a alimentos del menú tipo.
// Funciones puras, probadas en calculos.test.ts.
import type { Alimento } from "@/lib/comidas/alimentos";
import type { Macros } from "@/lib/nutricion/ajuste";

export type Categoria = "proteina" | "carbo" | "grasa" | "mixto" | "libre";

export interface AlimentoDespensa {
  id: number;
  nombre: string;
  marca: string | null;
  tipo: "marca" | "generico";
  categoria: Categoria;
  carbo_100: number;
  proteina_100: number;
  grasa_100: number;
  porcion_g: number;
  porcion_nombre: string;
  unidad_g: number | null;
  unidad_nombre: string | null;
}

const r1 = (x: number) => Math.round(x * 10) / 10;

// Qué nutriente manda en un alimento: el que aporta 60 % o más de sus
// calorías (la proteína con un umbral menor, porque es la que se ajusta). Menos de 30 kcal por 100 g es "libre" (verduras, caldo).
export function inferirCategoria(c100: number, p100: number, g100: number): Categoria {
  const kc = c100 * 4, kp = p100 * 4, kg = g100 * 9;
  const total = kc + kp + kg;
  if (total < 30) return "libre";
  // Huevo y queso cuentan como proteína aunque tengan bastante grasa.
  if (kp / total >= 0.6 || (kp / total >= 0.45 && p100 >= 8) || (kp / total >= 0.3 && p100 >= 10)) return "proteina";
  if (kc / total >= 0.6) return "carbo";
  if (kg / total >= 0.6) return "grasa";
  return "mixto";
}

// Medida casera para unos gramos: en unidades si el alimento las tiene
// (con medios), si no, en fracción de su porción.
export function medidaCasera(a: Pick<AlimentoDespensa, "porcion_g" | "porcion_nombre" | "unidad_g" | "unidad_nombre">, gramos: number): string {
  const base = a.unidad_g ?? a.porcion_g;
  const n = Math.round((gramos / base) * 2) / 2;
  const fraccion = (x: number) => (x === 0.5 ? "½" : Number.isInteger(x) ? String(x) : `${Math.floor(x)} ½`);
  if (a.unidad_g && a.unidad_nombre) {
    if (n <= 0) return "un poco";
    return `${fraccion(n)} ${a.unidad_nombre}${n > 1 && !a.unidad_nombre.endsWith("s") ? "s" : ""}`;
  }
  if (n <= 0) return "un poco";
  return n === 1 ? a.porcion_nombre : `${fraccion(n)} × ${a.porcion_nombre}`;
}

// Alimento de la despensa convertido en alimento registrado.
export function aAlimento(a: AlimentoDespensa, gramos: number): Alimento {
  const f = gramos / 100;
  return {
    nombre: a.nombre,
    detalle: a.marca ?? "",
    gramos: Math.round(gramos),
    medida_casera: medidaCasera(a, gramos),
    carbo_g: r1(a.carbo_100 * f),
    proteina_g: r1(a.proteina_100 * f),
    grasa_g: r1(a.grasa_100 * f),
  };
}

// Etiqueta con valores solo "por porción": se pasan a 100 g.
export function por100DesdePorcion(porcionG: number, c: number, p: number, g: number) {
  const f = 100 / porcionG;
  return { carbo_100: r1(c * f), proteina_100: r1(p * f), grasa_100: r1(g * f) };
}

// "¿Cuánto me sirvo?": gramos de cada alimento del plato para acercarse al
// objetivo de la comida. El de carbohidrato cubre el carbohidrato, el de
// proteína la proteína que falta (descontando lo que ya trae el resto), el de
// grasa la grasa que falta. Los mixtos van en su porción y los libres no
// cuentan. Dos pasadas para que cada uno descuente lo que aportan los demás.
export function calcularPlato(objetivo: Macros, alimentos: AlimentoDespensa[]): { id: number; gramos: number }[] {
  const gramos = new Map<number, number>();
  for (const a of alimentos) gramos.set(a.id, a.categoria === "mixto" ? a.porcion_g : 0);
  const por = (cat: Categoria) => alimentos.filter((a) => a.categoria === cat);
  const aporte = (campo: "carbo_100" | "proteina_100" | "grasa_100", excluir: Categoria) =>
    alimentos.filter((a) => a.categoria !== excluir).reduce((s, a) => s + (a[campo] * (gramos.get(a.id) ?? 0)) / 100, 0);
  const repartir = (cat: Categoria, campo: "carbo_100" | "proteina_100" | "grasa_100", meta: number) => {
    const lista = por(cat);
    if (lista.length === 0) return;
    const falta = Math.max(0, meta - aporte(campo, cat));
    for (const a of lista) gramos.set(a.id, a[campo] > 0 ? (falta / lista.length / a[campo]) * 100 : 0);
  };
  for (let pasada = 0; pasada < 2; pasada++) {
    repartir("carbo", "carbo_100", objetivo.carboG);
    repartir("proteina", "proteina_100", objetivo.proteinaG);
    repartir("grasa", "grasa_100", objetivo.grasaG);
  }
  // Redondeo práctico: de 5 en 5 g.
  return alimentos.map((a) => ({ id: a.id, gramos: Math.round((gramos.get(a.id) ?? 0) / 5) * 5 }));
}

export interface CambioAlimento {
  nombre: string;
  antesG: number;
  despuesG: number;
  medida: string; // medida casera aproximada después del cambio
}

// Ajuste del día traducido a gramos del menú tipo: cada diferencia de
// nutriente va al alimento del plato que más lo aporta.
export function ajusteEnAlimentos(plato: Alimento[], cambio: Macros): { cambios: CambioAlimento[]; sinAlimento: (keyof Macros)[] } {
  const items = plato.map((a) => ({ ...a }));
  const sinAlimento: (keyof Macros)[] = [];
  const campos: [keyof Macros, "carbo_g" | "proteina_g" | "grasa_g"][] = [
    ["proteinaG", "proteina_g"],
    ["carboG", "carbo_g"],
    ["grasaG", "grasa_g"],
  ];
  for (const [clave, campo] of campos) {
    const delta = cambio[clave];
    if (delta === 0) continue;
    // El alimento que aporta más de ese nutriente por gramo y lo tiene como principal.
    const candidato = items
      .filter((a) => a.gramos > 0 && a[campo] > 0)
      .map((a) => ({ a, densidad: a[campo] / a.gramos, peso: a[campo] / Math.max(1, a.carbo_g * 4 + a.proteina_g * 4 + a.grasa_g * 9) }))
      .sort((x, y) => y.peso - x.peso || y.densidad - x.densidad)[0];
    if (!candidato || candidato.peso < 0.03) {
      sinAlimento.push(clave);
      continue;
    }
    const a = candidato.a;
    const nuevosG = Math.max(0, Math.round((a.gramos + delta / candidato.densidad) / 5) * 5);
    const f = a.gramos > 0 ? nuevosG / a.gramos : 0;
    a.carbo_g = r1(a.carbo_g * f);
    a.proteina_g = r1(a.proteina_g * f);
    a.grasa_g = r1(a.grasa_g * f);
    a.gramos = nuevosG;
  }
  const cambios: CambioAlimento[] = [];
  items.forEach((a, i) => {
    const antes = plato[i].gramos;
    if (Math.abs(a.gramos - antes) >= 5) {
      const proporcion = antes > 0 ? a.gramos / antes : 0;
      cambios.push({ nombre: a.nombre, antesG: Math.round(antes), despuesG: a.gramos, medida: proporcion === 1 ? plato[i].medida_casera : `${fraccionDe(proporcion)} de lo habitual` });
    }
  });
  return { cambios, sinAlimento };
}

function fraccionDe(x: number): string {
  const opciones: [number, string][] = [[0.25, "¼"], [0.5, "la mitad"], [0.75, "¾"], [1.25, "1 ¼"], [1.5, "1 ½"], [2, "el doble"]];
  return opciones.reduce((m, o) => (Math.abs(o[0] - x) < Math.abs(m[0] - x) ? o : m))[1];
}
