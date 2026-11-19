// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Medidor, { subAlimentacion, subEntreno } from "./Medidor";

afterEach(cleanup);

describe("medidor de cumplimiento", () => {
  it("muestra el porcentaje con el color del semáforo", () => {
    render(<Medidor nombre="ENTRENO" valor={86} sub="4 de 5 sesiones" />);
    expect(screen.getByText("86%").closest("div.flex-1")?.className).toContain("text-bien");
  });
  it("sin datos muestra una raya, no 0", () => {
    render(<Medidor nombre="ENTRENO" valor={null} sub="" />);
    expect(screen.getByText("—")).toBeTruthy();
  });
  it("frases bajo los medidores", () => {
    expect(subEntreno([{ puntaje: 100 }, { puntaje: 0 }, { puntaje: 92 }])).toBe("2 de 3 sesiones");
    expect(subEntreno([])).toBe("sin sesiones del coach todavía");
    expect(subAlimentacion({ diasMedidos: 7, diasProteinaCorta: 3, componentes: { kcal: 76, proteina: 70, carbo: 80 } })).toBe("proteína corta 3 días");
    expect(subAlimentacion({ diasMedidos: 7, diasProteinaCorta: 0, componentes: { kcal: 90, proteina: 95, carbo: 88 } })).toBe("vas en objetivo");
    expect(subAlimentacion({ diasMedidos: 0, diasProteinaCorta: 0, componentes: null })).toBe("se mide desde mañana");
  });
});
