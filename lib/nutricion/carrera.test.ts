import { describe, expect, it } from "vitest";
import { carreraDelDia, entrenoDeCarrera, fasesCarrera, planCarrera, tipoCarga, type Carrera } from "./carrera";
import { objetivoDelDia, type PerfilMotor } from "./motor";

// Carrera objetivo de Francisco: Petzl 50K, sábado 3-abr-2027, 8 a 10 h.
const petzl: Carrera = { nombre: "Petzl 50K", fecha: "2027-04-03", deporte: "trail", horasMin: 8, horasMax: 10, prioridad: "A" };

describe("tipoCarga", () => {
  it("la duración decide la carga", () => {
    expect(tipoCarga(2)).toBe("ninguna");
    expect(tipoCarga(4)).toBe("corta");
    expect(tipoCarga(9)).toBe("larga");
    expect(tipoCarga(30)).toBe("ultra");
  });
});

describe("fasesCarrera", () => {
  it("Petzl: sin déficit desde el 13-mar, test de sudoración antes del 9-ene, ensayo desde el 6-feb y carga jueves y viernes", () => {
    expect(fasesCarrera(petzl)).toEqual({
      tipo: "larga",
      sinDeficitDesde: "2027-03-13",
      sudoracionHasta: "2027-01-09",
      ensayoDesde: "2027-02-06",
      carga: ["2027-04-01", "2027-04-02"],
    });
  });
  it("carrera B de 4 h: solo 1 día de carga, sin semanas sin déficit", () => {
    const f = fasesCarrera({ ...petzl, horasMin: 3.5, horasMax: 4.5, prioridad: "B" });
    expect(f.carga).toEqual(["2027-04-02"]);
    expect(f.sinDeficitDesde).toBeNull();
  });
});

describe("carreraDelDia", () => {
  it("cada fecha cae en su fase", () => {
    expect(carreraDelDia("2026-11-06", [petzl])).toBeNull();
    expect(carreraDelDia("2027-03-20", [petzl])).toMatchObject({ modo: "sin_deficit", diasFaltan: 14 });
    expect(carreraDelDia("2027-04-01", [petzl])).toMatchObject({ modo: "carga", diaCarga: 1, diasCarga: 2, cargaGKg: 9 });
    expect(carreraDelDia("2027-04-02", [petzl])).toMatchObject({ modo: "carga", diaCarga: 2 });
    expect(carreraDelDia("2027-04-03", [petzl])).toMatchObject({ modo: "carrera", diasFaltan: 0 });
    expect(carreraDelDia("2027-04-04", [petzl])).toBeNull();
  });
});

describe("entrenoDeCarrera", () => {
  it("9 h de trail como entreno planificado", () => {
    expect(entrenoDeCarrera(petzl)).toMatchObject({ deporte: "trail_correr", duracionMin: 540, intensidad: "moderado" });
  });
});

describe("planCarrera", () => {
  it("Petzl con 73 kg: 70 g/h, 630 g en total y tres tramos", () => {
    const p = planCarrera(petzl, 73);
    expect(p).toMatchObject({ horas: 9, carboHora: 70, carboTotal: 630, liquidoTotalL: 5.4, sodioTotalG: 6.3, desayunoG: 110 });
    expect(p.bloques.map((b) => [b.desde, b.hasta])).toEqual([[1, 2], [3, 6], [7, 9]]);
  });
  it("carrera de 2,5 h: sin tramo final", () => {
    const p = planCarrera({ ...petzl, horasMin: 2, horasMax: 3 }, 73);
    expect(p.bloques.map((b) => [b.desde, b.hasta])).toEqual([[1, 2], [3, 3]]);
  });
});

describe("motor con carrera", () => {
  const francisco: PerfilMotor = { estaturaCm: 181, edad: 42, ritmo: "moderado", factorActividad: 1.35, pausa: false, horaDesayuno: "06:45", deficitDescanso: 600 };
  it("día de carga: 9 g/kg de carbohidrato, proteína 1,6 y grasa 0,7, sin déficit", () => {
    const o = objetivoDelDia({ perfil: francisco, pesoKg: 73, entrenosHoy: [], carrera: { modo: "carga", cargaGKg: 9 } });
    expect(o).toMatchObject({ carboG: 657, proteinaG: 117, grasaG: 51, carrera: "carga", deficitKcal: 0 });
    expect(o.kcal).toBe(3560); // 657×4 + 117×4 + 51×9 = 3.555
  });
  it("semanas sin déficit: come lo que gasta", () => {
    const normal = objetivoDelDia({ perfil: francisco, pesoKg: 73, entrenosHoy: [] });
    const sin = objetivoDelDia({ perfil: francisco, pesoKg: 73, entrenosHoy: [], carrera: { modo: "sin_deficit", cargaGKg: 9 } });
    expect(normal.deficitKcal).toBeGreaterThan(300);
    expect(sin.deficitKcal).toBeLessThan(30);
    expect(sin.carrera).toBe("sin_deficit");
  });
});
