// Lista de compras (maqueta 2d.3): suma lo que pide el menú de varios días y
// lo pasa a cantidades de compra (crudo, unidades, fundas, frutas enteras).
import type { Alimento } from "@/lib/comidas/alimentos";
import type { AlimentoDespensa } from "@/lib/despensa/calculos";

export type Grupo = "Proteína" | "Carbohidratos" | "Frutas, verduras y lácteos" | "Para entrenar";
export interface ItemCompra {
  clave: string;
  nombre: string;
  cantidad: string;
  detalle: string;
  grupo: Grupo;
}

const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const miles = (n: number) => Math.round(n).toLocaleString("de-DE");
const kg = (g: number) => (g >= 1000 ? `${(Math.round(g / 100) / 10).toLocaleString("de-DE")} kg` : `${Math.max(50, Math.round(g / 50) * 50)} g`);

// Cocido → crudo (como se compra).
const CRUDO: [string, number, string][] = [
  ["arroz integral", 1 / 2.5, "Arroz integral"],
  ["arroz blanco", 1 / 3, "Arroz blanco"],
  ["fideo", 1 / 2.2, "Fideo"],
  ["pechuga de pollo", 1.33, "Pechuga de pollo"],
  ["lomo de cerdo", 1.35, "Lomo de cerdo"],
  ["carne de res", 1.35, "Carne de res magra"],
];
// Fruta que se compra entera: gramos de pulpa por unidad.
const ENTERA: Record<string, [number, string]> = { papaya: [1000, "mediana"], "pina": [900, "grande"] };
const FRUTAS = ["papaya", "pina", "banano", "manzana", "mandarina", "mango", "frutilla", "naranja"];
const ENTRENO = ["gel", "bebida isotonica", "barra energetica"];
const UNIDAD_PESO = ["taza", "cucharada", "cucharadita", "filete", "pechuga", "medio aguacate"];

export function listaCompras(items: Alimento[], despensa: AlimentoDespensa[]): ItemCompra[] {
  // 1. Sumar gramos por alimento (el café pintado aporta leche: 60 ml por taza).
  const total = new Map<string, number>();
  let tazasCafe = 0;
  let ensaladas = 0;
  for (const a of items) {
    const n = normal(a.nombre);
    if (n.startsWith("cafe pintado")) tazasCafe += a.gramos / 250;
    else if (n.startsWith("ensalada")) ensaladas += 1;
    else total.set(a.nombre, (total.get(a.nombre) ?? 0) + a.gramos);
  }
  const leche = despensa.find((d) => normal(d.nombre).startsWith("leche"));
  if (tazasCafe > 0 && leche) total.set(leche.nombre, (total.get(leche.nombre) ?? 0) + tazasCafe * 60);

  // 2. Pasar a cantidad de compra.
  const lista: ItemCompra[] = [];
  for (const [nombre, g] of total) {
    const n = normal(nombre);
    const d = despensa.find((x) => x.nombre === nombre);
    const grupo: Grupo = ENTRENO.some((e) => n.startsWith(e))
      ? "Para entrenar"
      : FRUTAS.some((f) => n.startsWith(f)) || n.startsWith("leche") || d?.categoria === "grasa"
        ? "Frutas, verduras y lácteos"
        : d?.categoria === "proteina"
          ? "Proteína"
          : "Carbohidratos";
    const crudo = CRUDO.find(([k]) => n.startsWith(k));
    const entera = Object.entries(ENTERA).find(([k]) => n.startsWith(k));
    let cantidad: string;
    let detalle = "";
    let etiqueta = nombre.split(" (")[0].replace(/ cocid[oa]$/i, "");
    if (crudo) {
      etiqueta = crudo[2];
      cantidad = kg(g * crudo[1]);
      detalle = n.startsWith("arroz") || n.startsWith("fideo") ? `crudo · ${miles(g)} g cocido` : "crudo";
    } else if (entera) {
      const [pulpa, tam] = entera[1];
      const u = Math.max(1, Math.ceil(g / pulpa - 0.15));
      cantidad = `${u} ${tam}${u > 1 ? "s" : ""}`;
      detalle = `${miles(g)} g de pulpa`;
    } else if (n.startsWith("leche")) {
      cantidad = `${(Math.ceil(g / 500) / 2).toLocaleString("de-DE")} L`;
    } else if (d?.unidad_g && d.unidad_nombre && !UNIDAD_PESO.includes(normal(d.unidad_nombre))) {
      const u = Math.ceil(g / d.unidad_g - 0.1);
      cantidad = String(u);
      detalle = `${d.unidad_nombre}${u > 1 && !d.unidad_nombre.endsWith("s") ? (/[aeiou]$/.test(d.unidad_nombre) ? "s" : "es") : ""}`;
      if (n.startsWith("pan de agua")) {
        const fundas = Math.ceil(u / 6);
        cantidad = `${fundas} funda${fundas > 1 ? "s" : ""}`;
        detalle = `${u} panes · fundas de 6`;
      }
      if (d.categoria === "proteina" && d.unidad_g <= 40) {
        cantidad = kg(g);
        detalle = `${u} ${d.unidad_nombre}s`;
      }
    } else {
      cantidad = kg(g);
    }
    lista.push({ clave: nombre, nombre: etiqueta, cantidad, detalle, grupo });
  }
  if (ensaladas > 0) lista.push({ clave: "ensalada", nombre: "Lechuga, tomate y pepino", cantidad: `${ensaladas} comidas`, detalle: "para las ensaladas y el wrap", grupo: "Frutas, verduras y lácteos" });

  const orden: Grupo[] = ["Proteína", "Carbohidratos", "Frutas, verduras y lácteos", "Para entrenar"];
  return lista.sort((a, b) => orden.indexOf(a.grupo) - orden.indexOf(b.grupo) || a.nombre.localeCompare(b.nombre));
}
