import { describe, expect, it } from "vitest";
import { dondeAjustar, porcentajeDelObjetivo } from "./resumen";
import type { Macros } from "@/lib/nutricion/ajuste";
import type { Comida } from "@/lib/nutricion/motor";

const o: Macros = { carboG: 50, proteinaG: 30, grasaG: 13 };
const objetivos: Record<Comida, Macros> = { desayuno: o, media_manana: o, almuerzo: o, media_tarde: o, cena: o };

describe("dondeAjustar", () => {
  it("grasa de más en la cena y proteína corta en la media tarde (caso de la maqueta)", () => {
    const r = dondeAjustar(objetivos, {
      almuerzo: { carboG: 52, proteinaG: 31, grasaG: 17 },
      media_tarde: { carboG: 45, proteinaG: 5, grasaG: 12 },
      cena: { carboG: 50, proteinaG: 30, grasaG: 27 },
    });
    expect(r).toEqual([
      { nutriente: "grasa", diferenciaG: 17, comida: "cena", diferenciaComidaG: 14 },
      { nutriente: "proteina", diferenciaG: -24, comida: "media_tarde", diferenciaComidaG: -25 },
    ]);
  });
  it("desvíos chicos no aparecen", () => {
    expect(dondeAjustar(objetivos, { almuerzo: { carboG: 60, proteinaG: 25, grasaG: 16 } })).toEqual([]);
  });
  it("sin comidas registradas no hay nada que ajustar", () => expect(dondeAjustar(objetivos, {})).toEqual([]));
});

describe("porcentajeDelObjetivo", () => {
  it("redondea y protege la división", () => {
    expect(porcentajeDelObjetivo(2310, 2250)).toBe(103);
    expect(porcentajeDelObjetivo(100, 0)).toBe(0);
  });
});
