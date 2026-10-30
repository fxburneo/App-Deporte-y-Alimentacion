import { describe, expect, it } from "vitest";
import { comidaQueToca } from "./queToca";

const horarios = { desayuno: "06:45", media_manana: "10:00", almuerzo: "13:00", media_tarde: "16:00", cena: "19:00" };

describe("comidaQueToca", () => {
  it("a las 13:20 toca el almuerzo", () => expect(comidaQueToca(horarios, "13:20", new Set())).toBe("almuerzo"));
  it("a las 12:15 ya ofrece el almuerzo (falta menos de 1 h)", () => expect(comidaQueToca(horarios, "12:15", new Set())).toBe("almuerzo"));
  it("si el almuerzo ya está, a las 14:00 sigue ofreciendo la media mañana olvidada", () =>
    expect(comidaQueToca(horarios, "14:00", new Set(["almuerzo"]))).toBe("media_manana"));
  it("de madrugada ofrece el desayuno", () => expect(comidaQueToca(horarios, "05:00", new Set())).toBe("desayuno"));
});
