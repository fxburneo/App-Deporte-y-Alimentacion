import { describe, expect, it } from "vitest";
import { datosParaIA, lunesInforme, numerosSemana, type DiaInforme } from "./informe";

const dia = (fecha: string, extra: Partial<DiaInforme> = {}): DiaInforme => ({
  fecha, tipo: "suave", plan: [], hecho: [], objetivo: { kcal: 2100, carboG: 220, proteinaG: 174, grasaG: 60 }, comido: null, durante: null, suenoSeg: null, hrv: null, ...extra,
});

describe("lunesInforme", () => {
  it("sábado y domingo: la semana actual; de lunes a viernes: la anterior", () => {
    expect(lunesInforme("2026-11-14")).toBe("2026-11-09"); // sábado
    expect(lunesInforme("2026-11-15")).toBe("2026-11-09"); // domingo
    expect(lunesInforme("2026-11-17")).toBe("2026-11-09"); // martes
  });
});

describe("numerosSemana", () => {
  it("entrenos cumplidos, días en objetivo, sueño y peso", () => {
    const dias = [
      dia("2026-11-09", { plan: ["Movilidad 0:40"], hecho: [{ deporte: "fuerza", duracion_min: 42, carga: 2 }], comido: { kcal: 2000, carboG: 200, proteinaG: 150, grasaG: 60 }, suenoSeg: 7 * 3600 }),
      dia("2026-11-10", { plan: ["Run 1:00"], comido: { kcal: 1500, carboG: 150, proteinaG: 112, grasaG: 50 }, suenoSeg: 8 * 3600 }),
      dia("2026-11-11"),
    ];
    const n = numerosSemana(dias, [{ fecha: "2026-11-11", kg: 75.5 }, { fecha: "2026-10-20", kg: 76 }], "2026-11-09");
    expect(n).toEqual({ entrenos: { cumplidos: 1, planificados: 2 }, comidas: { enObjetivo: 1, registrados: 2 }, suenoMin: 450, peso: { kg: 75.5, cambio: -0.5 } });
  });
});

describe("datosParaIA", () => {
  it("resume la semana en texto, sin datos personales", () => {
    const dias = [dia("2026-11-14", { tipo: "muy_largo", plan: ["Fondo Medio 3:00"], hecho: [{ deporte: "ruta_mtb", duracion_min: 190, carga: 120 }], durante: { objetivoG: 190, comidoG: 120 } })];
    const t = datosParaIA({ dias, numeros: numerosSemana(dias, [], "2026-11-09"), base: 31, cansancio: 47, frescura: -16, intensidad: { suave: 51, media: 42, fuerte: 7 }, hrvRango: [49, 67], carrera: { nombre: "Petzl 50K", semanas: 20 }, pausa: null });
    expect(t).toMatch(/suave 51 %, media 42 %/);
    expect(t).toMatch(/durante el entreno 120 de 190 g/);
    expect(t).toMatch(/Petzl 50K en 20 semanas/);
    expect(t).not.toMatch(/Francisco|@/);
  });
});
