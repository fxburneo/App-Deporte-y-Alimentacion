import { describe, expect, it } from "vitest";
import {
  kcalEntreno,
  metabolismoReposo,
  objetivoDelDia,
  pesoReferencia,
  repartirComidas,
  tipoDia,
  type Entreno,
  type PerfilMotor,
} from "./motor";

// Datos reales de Francisco (blueprint, sección 00).
const francisco: PerfilMotor = {
  estaturaCm: 181,
  edad: 42,
  ritmo: "moderado",
  factorActividad: 1.35,
  pausa: false,
  horaDesayuno: "06:45",
};
const PESO = 75.4;
const rodillo75: Entreno = { deporte: "rodillo", duracionMin: 75, intensidad: "moderado", estado: "planificado", hora: "05:00" };

describe("metabolismoReposo", () => {
  it("Mifflin-St Jeor: 75,4 kg, 181 cm, 42 años = 1.680 kcal", () => {
    expect(metabolismoReposo(PESO, 181, 42)).toBe(1680);
  });
  it("con % de grasa usa Katch-McArdle (18 % → 1.705 kcal)", () => {
    expect(metabolismoReposo(PESO, 181, 42, 18)).toBe(1705);
  });
});

describe("kcalEntreno", () => {
  it("sin dato del reloj estima por MET: rodillo moderado 75 min = 613 kcal", () => {
    expect(kcalEntreno(rodillo75, PESO)).toBe(613);
  });
  it("en rodillo con potencia confía en el reloj", () => {
    expect(kcalEntreno({ ...rodillo75, kcal: 640 }, PESO)).toBe(640);
  });
  it("afuera, con solo pulso, descuenta 15 % a Garmin", () => {
    expect(kcalEntreno({ deporte: "ruta_mtb", duracionMin: 240, intensidad: "suave", estado: "hecho", kcal: 1000 }, PESO)).toBe(850);
  });
  it("descanso no suma", () => {
    expect(kcalEntreno({ deporte: "descanso", duracionMin: 0, intensidad: "suave", estado: "planificado" }, PESO)).toBe(0);
  });
});

describe("tipoDia", () => {
  const e = (deporte: Entreno["deporte"], duracionMin: number, intensidad: Entreno["intensidad"]): Entreno => ({
    deporte, duracionMin, intensidad, estado: "planificado",
  });
  it("sin entrenos o solo fuerza es descanso", () => {
    expect(tipoDia([])).toBe("descanso");
    expect(tipoDia([e("fuerza", 60, "moderado")])).toBe("descanso");
  });
  it("trote suave de 45 min es suave", () => expect(tipoDia([e("trail_correr", 45, "suave")])).toBe("suave"));
  it("rodillo de intervalos es moderado", () => expect(tipoDia([rodillo75])).toBe("moderado"));
  it("una sesión fuerte es día duro aunque sea corta", () => expect(tipoDia([e("rodillo", 45, "fuerte")])).toBe("duro"));
  it("trail de 2 h es día duro", () => expect(tipoDia([e("trail_correr", 120, "suave")])).toBe("duro"));
  it("el MTB de 4 h del sábado es muy largo", () => expect(tipoDia([e("ruta_mtb", 240, "suave")])).toBe("muy_largo"));
  it("lo hecho reemplaza a lo planificado", () => {
    const hecho: Entreno = { deporte: "rodillo", duracionMin: 40, intensidad: "suave", estado: "hecho" };
    expect(tipoDia([rodillo75, hecho])).toBe("suave");
  });
});

describe("objetivoDelDia", () => {
  it("día moderado con rodillo a las 05:00: 2.630 kcal, 405 C, 151 P, 45 G y snack previo", () => {
    const o = objetivoDelDia({ perfil: francisco, pesoKg: PESO, entrenosHoy: [rodillo75] });
    expect(o).toMatchObject({
      tipo: "moderado", reposoKcal: 1680, entrenoKcal: 613, gastoKcal: 2881,
      kcal: 2630, carboG: 405, proteinaG: 151, grasaG: 45, snackPreEntreno: true, extraCenaG: 0,
    });
    expect(o.deficitKcal).toBe(251);
  });

  it("día de descanso: déficit cercano a 450 kcal sin bajar la grasa del mínimo", () => {
    const o = objetivoDelDia({ perfil: francisco, pesoKg: PESO, entrenosHoy: [] });
    expect(o).toMatchObject({ tipo: "descanso", kcal: 1820, carboG: 202, proteinaG: 151, grasaG: 45, snackPreEntreno: false });
    expect(o.grasaG).toBeGreaterThanOrEqual(Math.round(0.6 * PESO));
  });

  it("la proteína no cambia entre días: siempre 2 g/kg", () => {
    const suave = objetivoDelDia({ perfil: francisco, pesoKg: PESO, entrenosHoy: [] });
    const duro = objetivoDelDia({
      perfil: francisco, pesoKg: PESO,
      entrenosHoy: [{ deporte: "ruta_mtb", duracionMin: 240, intensidad: "suave", estado: "planificado" }],
    });
    expect(suave.proteinaG).toBe(duro.proteinaG);
    expect(duro.carboG).toBeGreaterThan(suave.carboG * 2);
  });

  it("modo pausa come a mantenimiento, sin déficit", () => {
    const o = objetivoDelDia({ perfil: { ...francisco, pausa: true }, pesoKg: PESO, entrenosHoy: [] });
    expect(o).toMatchObject({ kcal: 2260, carboG: 246, grasaG: 75 });
    expect(o.deficitKcal).toBeLessThanOrEqual(10);
  });

  it("si mañana es el fondo largo, la cena de hoy sube 0,5 g/kg de carbohidrato", () => {
    const o = objetivoDelDia({
      perfil: francisco, pesoKg: PESO, entrenosHoy: [],
      entrenosManana: [{ deporte: "ruta_mtb", duracionMin: 240, intensidad: "suave", estado: "planificado" }],
    });
    expect(o.extraCenaG).toBe(38);
    expect(o.carboG).toBe(202 + 38);
  });

  it("un trote suave temprano no pide snack previo", () => {
    const o = objetivoDelDia({
      perfil: francisco, pesoKg: PESO,
      entrenosHoy: [{ deporte: "trail_correr", duracionMin: 45, intensidad: "suave", estado: "planificado", hora: "05:00" }],
    });
    expect(o.snackPreEntreno).toBe(false);
  });
});

describe("repartirComidas", () => {
  it("con entreno temprano el desayuno lleva la mayor parte del carbohidrato", () => {
    const o = objetivoDelDia({ perfil: francisco, pesoKg: PESO, entrenosHoy: [rodillo75] });
    const r = repartirComidas(o, true);
    expect(r.desayuno.carboG).toBeGreaterThan(r.almuerzo.carboG);
    const suma = Object.values(r).reduce((s, c) => s + c.carboG, 0);
    expect(Math.abs(suma - o.carboG)).toBeLessThanOrEqual(2);
    expect(r.cena.proteinaG).toBe(30);
  });
  it("el extra de la cena va solo a la cena", () => {
    const o = objetivoDelDia({
      perfil: francisco, pesoKg: PESO, entrenosHoy: [],
      entrenosManana: [{ deporte: "ruta_mtb", duracionMin: 240, intensidad: "suave", estado: "planificado" }],
    });
    const r = repartirComidas(o, false);
    expect(r.cena.carboG).toBe(Math.round(202 * 0.2) + 38);
  });
});

describe("pesoReferencia", () => {
  const pesajes = [
    { fecha: "2026-10-13", kg: 75.5 },
    { fecha: "2026-10-15", kg: 75.0 },
    { fecha: "2026-10-17", kg: 75.4 },
  ];
  it("promedia los pesajes de la última semana", () => {
    expect(pesoReferencia(pesajes, "2026-10-17")).toBe(75.3);
  });
  it("si no hay pesajes recientes usa el último", () => {
    expect(pesoReferencia(pesajes, "2026-10-30")).toBe(75.4);
  });
  it("sin pesajes devuelve null", () => {
    expect(pesoReferencia([], "2026-10-17")).toBeNull();
  });
});
