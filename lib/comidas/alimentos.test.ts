import { describe, expect, it } from "vitest";
import { alimentoValido, cambiarGramos, totales } from "./alimentos";

const arroz = { nombre: "Arroz", detalle: "", gramos: 160, medida_casera: "1 taza", carbo_g: 45, proteina_g: 4, grasa_g: 0.4 };

describe("alimentos", () => {
  it("cambiar gramos escala los macros", () => {
    expect(cambiarGramos(arroz, 80)).toMatchObject({ gramos: 80, carbo_g: 22.5, proteina_g: 2, grasa_g: 0.2 });
  });
  it("gramos inválidos no cambian nada", () => expect(cambiarGramos(arroz, 0)).toBe(arroz));
  it("totales suma y calcula calorías", () => {
    expect(totales([arroz, { ...arroz, nombre: "Pollo", carbo_g: 0, proteina_g: 46, grasa_g: 5 }])).toEqual({ carboG: 90 / 2, proteinaG: 50, grasaG: 5.4, kcal: 429 });
  });
  it("rechaza valores absurdos", () => {
    expect(alimentoValido(arroz)).toBe(true);
    expect(alimentoValido({ ...arroz, carbo_g: -1 })).toBe(false);
    expect(alimentoValido({ ...arroz, nombre: " " })).toBe(false);
  });
});
