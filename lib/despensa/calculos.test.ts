import { describe, expect, it } from "vitest";
import { aAlimento, ajusteEnAlimentos, calcularPlato, inferirCategoria, medidaCasera, por100DesdePorcion, type AlimentoDespensa } from "./calculos";
import { totales } from "@/lib/comidas/alimentos";

const base = { marca: null, tipo: "generico" as const, unidad_g: null, unidad_nombre: null };
const pollo: AlimentoDespensa = { ...base, id: 1, nombre: "Pechuga de pollo cocida", categoria: "proteina", carbo_100: 0, proteina_100: 31, grasa_100: 3.6, porcion_g: 150, porcion_nombre: "1 pechuga mediana", unidad_g: 150, unidad_nombre: "pechuga" };
const arroz: AlimentoDespensa = { ...base, id: 2, nombre: "Arroz blanco cocido", categoria: "carbo", carbo_100: 28, proteina_100: 2.7, grasa_100: 0.3, porcion_g: 160, porcion_nombre: "1 taza", unidad_g: 160, unidad_nombre: "taza" };
const aguacate: AlimentoDespensa = { ...base, id: 3, nombre: "Aguacate", categoria: "grasa", carbo_100: 8.5, proteina_100: 2, grasa_100: 14.7, porcion_g: 70, porcion_nombre: "½ aguacate" };
const ensalada: AlimentoDespensa = { ...base, id: 4, nombre: "Ensalada", categoria: "libre", carbo_100: 3.5, proteina_100: 1, grasa_100: 0.2, porcion_g: 100, porcion_nombre: "1 plato pequeño" };
const galletas: AlimentoDespensa = { ...base, id: 5, nombre: "Galletas Amor", marca: "Nestlé", tipo: "marca", categoria: "carbo", carbo_100: 68, proteina_100: 7, grasa_100: 18, porcion_g: 28, porcion_nombre: "3 galletas (28 g)", unidad_g: 9.3, unidad_nombre: "galleta" };

describe("inferirCategoria", () => {
  it("clasifica por el nutriente que aporta la mayoría de calorías", () => {
    expect(inferirCategoria(0, 31, 3.6)).toBe("proteina");
    expect(inferirCategoria(28, 2.7, 0.3)).toBe("carbo");
    expect(inferirCategoria(8.5, 2, 14.7)).toBe("grasa");
    expect(inferirCategoria(3.5, 1, 0.2)).toBe("libre");
    expect(inferirCategoria(4, 10, 2.5)).toBe("proteina"); // yogur griego
    expect(inferirCategoria(1.1, 12.6, 9.5)).toBe("proteina"); // huevo
    expect(inferirCategoria(20, 25, 50)).toBe("grasa"); // mantequilla de maní
    expect(inferirCategoria(5, 3.4, 0.2)).toBe("mixto"); // leche descremada
    expect(inferirCategoria(30, 8, 12)).toBe("mixto");
  });
});

describe("medidaCasera y aAlimento", () => {
  it("usa unidades cuando las hay", () => {
    expect(medidaCasera(galletas, 28)).toBe("3 galletas");
    expect(medidaCasera(pollo, 225)).toBe("1 ½ pechugas");
    expect(medidaCasera(aguacate, 70)).toBe("½ aguacate");
  });
  it("convierte gramos a macros con los valores por 100 g", () => {
    expect(aAlimento(arroz, 160)).toMatchObject({ gramos: 160, carbo_g: 44.8, proteina_g: 4.3, grasa_g: 0.5, medida_casera: "1 taza" });
  });
  it("pasa la etiqueta por porción a 100 g", () => {
    expect(por100DesdePorcion(28, 19, 2, 5)).toEqual({ carbo_100: 67.9, proteina_100: 7.1, grasa_100: 17.9 });
  });
});

describe("calcularPlato", () => {
  it("almuerzo de 57 C / 30 P / 10 G con pollo, arroz, aguacate y ensalada", () => {
    const r = calcularPlato({ carboG: 57, proteinaG: 30, grasaG: 10 }, [pollo, arroz, aguacate, ensalada]);
    const g = Object.fromEntries(r.map((x) => [x.id, x.gramos]));
    expect(g[4]).toBe(0); // la ensalada es libre
    const t = totales([aAlimento(pollo, g[1]), aAlimento(arroz, g[2]), aAlimento(aguacate, g[3])]);
    expect(Math.abs(t.carboG - 57)).toBeLessThanOrEqual(4);
    expect(Math.abs(t.proteinaG - 30)).toBeLessThanOrEqual(3);
    expect(Math.abs(t.grasaG - 10)).toBeLessThanOrEqual(2);
  });
  it("sin alimento de proteína no inventa: el resto igual se calcula", () => {
    const r = calcularPlato({ carboG: 40, proteinaG: 30, grasaG: 10 }, [arroz]);
    expect(r[0].gramos).toBeGreaterThan(130);
  });
});

describe("ajusteEnAlimentos", () => {
  const almuerzo = [aAlimento(pollo, 150), aAlimento(arroz, 160), aAlimento(aguacate, 70)];
  it("faltan 20 g de proteína y sobran 14 g de carbohidrato: más pollo, menos arroz", () => {
    const r = ajusteEnAlimentos(almuerzo, { carboG: -14, proteinaG: 20, grasaG: 0 });
    const pollo2 = r.cambios.find((c) => c.nombre.startsWith("Pechuga"))!;
    const arroz2 = r.cambios.find((c) => c.nombre.startsWith("Arroz"))!;
    expect(pollo2.despuesG).toBeGreaterThanOrEqual(210);
    expect(pollo2.despuesG).toBeLessThanOrEqual(225);
    expect(arroz2.despuesG).toBeLessThan(160);
    expect(r.sinAlimento).toEqual([]);
  });
  it("si el plato no tiene proteína, avisa en vez de inventar", () => {
    const r = ajusteEnAlimentos([aAlimento(arroz, 160)], { carboG: 0, proteinaG: 15, grasaG: 0 });
    expect(r.sinAlimento).toEqual(["proteinaG"]);
  });
});
