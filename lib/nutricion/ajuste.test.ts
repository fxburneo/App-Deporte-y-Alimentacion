import { describe, expect, it } from "vitest";
import { ajustarResto, kcalDe, sumarMacros, type Macros } from "./ajuste";
import type { Comida } from "./motor";

// Objetivos de Francisco en un día de descanso (pantalla Hoy, 27-oct).
const objetivos: Record<Comida, Macros> = {
  desayuno: { carboG: 68, proteinaG: 30, grasaG: 10 },
  media_manana: { carboG: 34, proteinaG: 30, grasaG: 10 },
  almuerzo: { carboG: 57, proteinaG: 30, grasaG: 10 },
  media_tarde: { carboG: 23, proteinaG: 30, grasaG: 10 },
  cena: { carboG: 46, proteinaG: 30, grasaG: 10 },
};

describe("ajustarResto", () => {
  it("almuerzo pasado en 240 kcal: compensa el 30 % de lo que queda, sin tocar la proteína", () => {
    const r = ajustarResto({
      objetivos,
      consumido: {
        desayuno: objetivos.desayuno,
        media_manana: objetivos.media_manana,
        almuerzo: { carboG: 81, proteinaG: 53, grasaG: 16 },
      },
      mananaExigente: false,
    });
    expect(r.diferenciaKcal).toBe(242);
    expect(r.pendientes).toEqual(["media_tarde", "cena"]);
    expect(r.siguiente).toBe("media_tarde");
    // Tope: 30 % de (302 + 394) = 209 kcal
    expect(r.compensadoKcal).toBeGreaterThan(190);
    expect(r.compensadoKcal).toBeLessThanOrEqual(215);
    expect(r.cambios.media_tarde).toEqual({ carboG: -14, proteinaG: 0, grasaG: -4 });
    expect(r.cambios.cena).toEqual({ carboG: -18, proteinaG: 0, grasaG: -5 });
    expect(r.objetivos.cena.proteinaG).toBe(30);
  });

  it("si mañana es día duro, la cena no pierde carbohidrato", () => {
    const r = ajustarResto({
      objetivos,
      consumido: { almuerzo: { carboG: 81, proteinaG: 53, grasaG: 16 } },
      mananaExigente: true,
    });
    expect(r.cambios.cena!.carboG).toBe(0);
    expect(r.cambios.cena!.grasaG).toBeLessThan(0);
  });

  it("proteína corta: la siguiente comida la recupera y el total de calorías se mantiene", () => {
    const r = ajustarResto({
      objetivos,
      consumido: { almuerzo: { carboG: 57, proteinaG: 10, grasaG: 10 } },
      mananaExigente: false,
    });
    expect(r.proteinaFaltaG).toBe(20);
    expect(r.cambios.media_tarde!.proteinaG).toBe(20);
    // Comió 80 kcal menos de proteína y se le suman 80 en la tarde: no hay nada más que mover
    expect(r.cambios.cena).toBeUndefined();
  });

  it("diferencias chicas (menos de 60 kcal) no cambian nada", () => {
    const r = ajustarResto({
      objetivos,
      consumido: { almuerzo: { carboG: 65, proteinaG: 32, grasaG: 12 } },
      mananaExigente: false,
    });
    expect(r.cambios).toEqual({});
  });

  it("si comió menos, las comidas que quedan suben", () => {
    const r = ajustarResto({
      objetivos,
      consumido: { desayuno: { carboG: 20, proteinaG: 30, grasaG: 5 } },
      mananaExigente: false,
    });
    expect(r.diferenciaKcal).toBeLessThan(0);
    expect(r.cambios.media_manana!.carboG).toBeGreaterThan(0);
  });

  it("la grasa de una comida no baja de 3 g ni el carbohidrato de 0", () => {
    const r = ajustarResto({
      objetivos,
      consumido: {
        desayuno: { carboG: 200, proteinaG: 30, grasaG: 60 },
        media_manana: objetivos.media_manana,
        almuerzo: objetivos.almuerzo,
        media_tarde: objetivos.media_tarde,
      },
      mananaExigente: false,
    });
    expect(r.objetivos.cena.carboG).toBeGreaterThanOrEqual(0);
    expect(r.objetivos.cena.grasaG).toBeGreaterThanOrEqual(3);
    expect(r.compensadoKcal).toBeLessThanOrEqual(Math.round(0.3 * kcalDe(objetivos.cena)) + 5);
  });

  it("con la cena registrada no queda nada por ajustar", () => {
    const r = ajustarResto({ objetivos, consumido: { cena: objetivos.cena }, mananaExigente: false });
    expect(r.siguiente).toBeNull();
    expect(r.cambios).toEqual({});
  });
});

describe("sumarMacros", () => {
  it("suma los registros de una comida", () => {
    expect(sumarMacros([{ carboG: 10, proteinaG: 5, grasaG: 2 }, { carboG: 1, proteinaG: 1, grasaG: 1 }])).toEqual({ carboG: 11, proteinaG: 6, grasaG: 3 });
  });
});
