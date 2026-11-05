// Menú sugerido para una comida (pedido de Francisco, 5-nov): con los
// alimentos de su despensa y el objetivo vigente de la comida arma un plato
// concreto en gramos. Sin IA: plantillas por comida, opciones que rotan cada
// día y los gramos de la calculadora. Función pura, probada en sugerencia.test.ts.
import type { Alimento } from "@/lib/comidas/alimentos";
import type { Macros } from "@/lib/nutricion/ajuste";
import type { Comida } from "@/lib/nutricion/motor";
import { aAlimento, calcularPlato, type AlimentoDespensa } from "./calculos";

// Cada plantilla es una lista de "huecos"; cada hueco tiene opciones (inicio
// del nombre en la despensa) y se elige una según el día.
const PLANTILLAS: Record<Comida, string[][]> = {
  desayuno: [["Huevo", "Yogur griego", "Queso fresco"], ["Pan integral", "Avena", "Pan tostado", "Pan blanco"], ["Papaya", "Banano"]],
  media_manana: [["Yogur griego", "Queso fresco"], ["Banano", "Papaya", "Pan tostado"]],
  almuerzo: [["Pechuga de pollo", "Carne de res", "Huevo"], ["Arroz", "Papa", "Fideo"], ["Aguacate", "Aceite"], ["Ensalada"]],
  media_tarde: [["Yogur griego", "Queso fresco"], ["Banano", "Papaya", "Pan tostado"]],
  cena: [["Pechuga de pollo", "Carne de res", "Huevo"], ["Papa", "Arroz", "Fideo"], ["Aguacate", "Aceite"], ["Ensalada"]],
};

const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function sugerirPlato(comida: Comida, objetivo: Macros, despensa: AlimentoDespensa[], dia: number): Alimento[] {
  const elegidos: AlimentoDespensa[] = [];
  PLANTILLAS[comida].forEach((opciones, hueco) => {
    const disponibles = opciones
      .map((o) => despensa.find((a) => normal(a.nombre).startsWith(normal(o)) && !elegidos.includes(a)))
      .filter((a): a is AlimentoDespensa => a != null);
    if (disponibles.length) elegidos.push(disponibles[(dia + hueco) % disponibles.length]);
  });
  if (elegidos.length === 0) return [];
  const gramos = calcularPlato(objetivo, elegidos);
  return elegidos
    .map((a, i) => (a.categoria === "libre" ? { ...aAlimento(a, a.porcion_g), medida_casera: "a gusto" } : aAlimento(a, gramos[i].gramos)))
    .filter((x) => x.gramos > 0);
}

// Texto corto: "Pechuga de pollo 120 g · Arroz blanco cocido 140 g (1 taza)".
export function textoPlato(plato: Alimento[]): string {
  return plato.map((a) => (a.medida_casera === "a gusto" ? `${a.nombre} a gusto` : `${a.nombre} ${a.gramos} g (${a.medida_casera})`)).join(" · ");
}
