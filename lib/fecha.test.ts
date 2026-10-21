import { describe, expect, it } from "vitest";
import { diaSemana, fechaLarga, hoyEcuador, sumarDias } from "./fecha";

describe("fechas en hora de Ecuador", () => {
  it("a las 20:30 de Quito sigue siendo el mismo día aunque en UTC ya sea el siguiente", () => {
    expect(hoyEcuador(new Date("2026-10-22T01:30:00Z"))).toBe("2026-10-21");
  });
  it("a las 05:00 de Quito ya es el nuevo día", () => {
    expect(hoyEcuador(new Date("2026-10-22T10:00:00Z"))).toBe("2026-10-22");
  });
  it("suma días cruzando fin de mes", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(sumarDias("2026-11-01", -1)).toBe("2026-10-31");
  });
  it("el 21 de octubre de 2026 es miércoles", () => {
    expect(diaSemana("2026-10-21")).toBe(3);
    expect(fechaLarga("2026-10-21")).toBe("Miércoles 21 oct");
  });
});
