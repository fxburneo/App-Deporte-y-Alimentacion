import { describe, expect, it } from "vitest";
import { duracion, kg, miles } from "./formato";

describe("formato", () => {
  it("miles con punto", () => expect(miles(2630)).toBe("2.630"));
  it("kilos con coma", () => expect(kg(75.4)).toBe("75,4"));
  it("duración en h:mm", () => {
    expect(duracion(75)).toBe("1:15");
    expect(duracion(240)).toBe("4:00");
  });
});
