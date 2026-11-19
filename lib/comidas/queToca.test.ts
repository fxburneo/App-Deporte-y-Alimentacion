import { describe, expect, it } from "vitest";
import { comidaQueToca, comidasDesfasadas } from "./queToca";

const horarios = { desayuno: "06:45", media_manana: "10:00", almuerzo: "13:00", media_tarde: "16:00", cena: "19:00" };

describe("comidaQueToca", () => {
  it("a las 13:20 toca el almuerzo", () => expect(comidaQueToca(horarios, "13:20", new Set())).toBe("almuerzo"));
  it("a las 12:15 ya ofrece el almuerzo (falta menos de 1 h)", () => expect(comidaQueToca(horarios, "12:15", new Set())).toBe("almuerzo"));
  it("si el almuerzo ya está, a las 14:00 sigue ofreciendo la media mañana olvidada", () =>
    expect(comidaQueToca(horarios, "14:00", new Set(["almuerzo"]))).toBe("media_manana"));
  it("de madrugada ofrece el desayuno", () => expect(comidaQueToca(horarios, "05:00", new Set())).toBe("desayuno"));
});

describe("comidas desfasadas", () => {
  const h = { desayuno: "06:45", media_manana: "10:00", almuerzo: "13:00", media_tarde: "16:00", cena: "19:00" };
  it("a las 15:11 sin almuerzo ni media mañana: las dos salen con Lo comí; media tarde es la que toca ahora", () => {
    const reg = new Set(["desayuno"] as const);
    const ahora = comidaQueToca(h, "15:11", reg);
    expect(ahora).toBe("media_tarde");
    expect(comidasDesfasadas(h, "15:11", reg, ahora)).toEqual(["media_manana", "almuerzo"]);
  });
  it("lo registrado y lo que todavía no llega no cuentan", () => {
    expect(comidasDesfasadas(h, "12:00", new Set(["desayuno", "media_manana"] as const), "almuerzo")).toEqual([]);
  });
});
