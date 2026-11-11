import { describe, expect, it } from "vitest";
import { sugerirDia, sugerirPlato, textoPlato } from "./sugerencia";
import { totales } from "@/lib/comidas/alimentos";
import type { AlimentoDespensa } from "./calculos";

const g = (id: number, nombre: string, categoria: AlimentoDespensa["categoria"], c: number, p: number, gr: number, porcion: number, unidad: string | null = null): AlimentoDespensa => ({
  id, nombre, marca: null, tipo: "generico", categoria, carbo_100: c, proteina_100: p, grasa_100: gr, porcion_g: porcion, porcion_nombre: `${porcion} g`, unidad_g: unidad ? porcion : null, unidad_nombre: unidad,
});
const despensa = [
  g(1, "Pechuga de pollo cocida", "proteina", 0, 31, 3.6, 150, "pechuga"),
  g(2, "Carne de res magra cocida", "proteina", 0, 27, 8, 120, "filete"),
  g(3, "Arroz blanco cocido", "carbo", 28, 2.7, 0.3, 160, "taza"),
  g(4, "Papa cocida", "carbo", 20, 2, 0.1, 150, "papa"),
  g(5, "Aguacate", "grasa", 8.5, 2, 14.7, 70),
  g(6, "Ensalada verde", "libre", 3.5, 1, 0.2, 100),
  g(7, "Yogur griego natural", "proteina", 4, 10, 2.5, 150, "vaso"),
  g(8, "Banano", "carbo", 23, 1.1, 0.3, 120, "banano"),
];

describe("sugerirPlato", () => {
  it("almuerzo: proteína + carbo + grasa + ensalada cerca del objetivo", () => {
    const plato = sugerirPlato("almuerzo", { carboG: 57, proteinaG: 30, grasaG: 10 }, despensa, 0);
    expect(plato.map((a) => a.nombre)).toEqual(["Pechuga de pollo cocida", "Papa cocida", "Aguacate", "Ensalada verde"]);
    const t = totales(plato.filter((a) => a.medida_casera !== "a gusto"));
    expect(Math.abs(t.carboG - 57)).toBeLessThanOrEqual(5);
    expect(Math.abs(t.proteinaG - 30)).toBeLessThanOrEqual(4);
  });
  it("rota opciones según el día", () => {
    const a = sugerirPlato("cena", { carboG: 46, proteinaG: 30, grasaG: 10 }, despensa, 0);
    const b = sugerirPlato("cena", { carboG: 46, proteinaG: 30, grasaG: 10 }, despensa, 1);
    expect(a[0].nombre).not.toBe(b[0].nombre);
  });
  it("media mañana con yogur y fruta", () => {
    const plato = sugerirPlato("media_manana", { carboG: 25, proteinaG: 18, grasaG: 7 }, despensa, 0);
    expect(plato.map((a) => a.nombre)).toEqual(["Yogur griego natural", "Banano"]);
    expect(textoPlato(plato)).toMatch(/Yogur griego natural \d+ g/);
  });
  it("media mañana y media tarde no sugieren lo mismo", () => {
    const conPan = [...despensa, g(9, "Pan de agua precocido", "carbo", 51.4, 8.6, 5.7, 35, "pan"), g(10, "Queso fresco", "proteina", 3, 18, 15, 30, "tajada")];
    const m = { carboG: 25, proteinaG: 18, grasaG: 7 };
    for (let dia = 0; dia < 6; dia++) {
      const a = sugerirPlato("media_manana", m, conPan, dia).map((x) => x.nombre);
      const b = sugerirPlato("media_tarde", m, conPan, dia).map((x) => x.nombre);
      expect(a).not.toEqual(b);
    }
  });
  it("el menú del día no repite proteína entre almuerzo y cena ni yogur entre desayuno y media mañana", () => {
    const conMas = [...despensa, g(11, "Huevo entero", "proteina", 1.1, 12.6, 9.5, 50, "huevo"), g(12, "Papaya", "carbo", 11, 0.5, 0.3, 150, "taza")];
    const objetivos = {
      desayuno: { carboG: 33, proteinaG: 38, grasaG: 9 },
      media_manana: { carboG: 25, proteinaG: 18, grasaG: 7 },
      almuerzo: { carboG: 49, proteinaG: 43, grasaG: 11 },
      media_tarde: { carboG: 25, proteinaG: 18, grasaG: 7 },
      cena: { carboG: 71, proteinaG: 35, grasaG: 11 },
    };
    for (let dia = 0; dia < 6; dia++) {
      const m = sugerirDia(objetivos, conMas, dia);
      expect(m.almuerzo![0].nombre).not.toBe(m.cena![0].nombre);
      expect(m.almuerzo![0].nombre).not.toBe("Huevo entero");
      expect(m.desayuno![0].nombre).not.toBe(m.media_manana![0].nombre);
    }
  });
  it("ninguna porción pasa el tope: 3 tajadas de queso aunque falte proteína", () => {
    const queso = g(10, "Queso fresco", "proteina", 3, 18, 15, 30, "tajada");
    const plato = sugerirPlato("media_tarde", { carboG: 20, proteinaG: 30, grasaG: 9 }, [queso, g(9, "Pan de agua precocido", "carbo", 51.4, 8.6, 5.7, 35, "pan")], 0);
    expect(plato.find((a) => a.nombre === "Queso fresco")!.gramos).toBeLessThanOrEqual(90);
  });
  it("sin despensa no sugiere nada", () => expect(sugerirPlato("almuerzo", { carboG: 50, proteinaG: 30, grasaG: 10 }, [], 0)).toEqual([]));
});
