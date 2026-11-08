import { describe, expect, it } from "vitest";
import { balanceReal } from "./balance";

describe("balanceReal", () => {
  it("el sábado 7-nov: gastó 3.700 y había comido 2.835", () => {
    expect(balanceReal(3700, 2835, true)).toEqual({ kcal: 865, texto: "Real hasta ahora: comiste 865 kcal menos de lo que gastas." });
  });
  it("en el historial es el cierre del día, y puede ser superávit", () => {
    expect(balanceReal(2400, 2650, false)).toEqual({ kcal: -250, texto: "Real del día: comiste 250 kcal más de lo que gastas." });
  });
  it("sin comidas registradas no muestra nada; diferencias chicas son 'lo mismo'", () => {
    expect(balanceReal(2400, 0, true)).toBeNull();
    expect(balanceReal(2400, 2380, false)?.texto).toBe("Real del día: comiste lo mismo que gastas.");
  });
});
