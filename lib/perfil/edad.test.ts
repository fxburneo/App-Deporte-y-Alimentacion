import { describe, expect, it } from "vitest";
import { edadEnAnios } from "./edad";

describe("edadEnAnios", () => {
  it("Francisco (5-jul-1984) tiene 42 años en octubre de 2026", () => {
    expect(edadEnAnios("1984-07-05", new Date(2026, 9, 20))).toBe(42);
  });

  it("todavía no cumple el día anterior a su cumpleaños", () => {
    expect(edadEnAnios("1984-07-05", new Date(2027, 6, 4))).toBe(42);
  });

  it("cumple justo el día de su cumpleaños", () => {
    expect(edadEnAnios("1984-07-05", new Date(2027, 6, 5))).toBe(43);
  });

  it("antes del mes de cumpleaños resta un año", () => {
    expect(edadEnAnios("1984-07-05", new Date(2027, 0, 15))).toBe(42);
  });
});
