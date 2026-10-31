import { describe, expect, it } from "vitest";
import { diaSemana, fechaLarga, hoyEcuador, sumarDias, fechaHistorial } from "./fecha";

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

import { horaEcuador, horasDesde } from "./fecha";

describe("hora de sincronización", () => {
  it("11:35 UTC son las 06:35 en Quito", () => expect(horaEcuador("2026-10-26T11:35:00Z")).toBe("06:35"));
  it("cuenta horas desde la última sincronización", () =>
    expect(horasDesde("2026-10-24T11:35:00Z", new Date("2026-10-26T12:00:00Z"))).toBe(48));
});

describe("fechaHistorial", () => {
  it("acepta ayer", () => expect(fechaHistorial("2026-10-29", "2026-10-30")).toBe("2026-10-29"));
  it("hoy o el futuro vuelven a hoy", () => {
    expect(fechaHistorial("2026-10-30", "2026-10-30")).toBe("2026-10-30");
    expect(fechaHistorial("2026-11-02", "2026-10-30")).toBe("2026-10-30");
  });
  it("más de un año atrás o texto inválido vuelven a hoy", () => {
    expect(fechaHistorial("2025-01-01", "2026-10-30")).toBe("2026-10-30");
    expect(fechaHistorial("ayer", "2026-10-30")).toBe("2026-10-30");
    expect(fechaHistorial(undefined, "2026-10-30")).toBe("2026-10-30");
  });
});
