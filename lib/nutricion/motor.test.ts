import { describe, expect, it } from "vitest";
import {
  carboDurante,
  deficitDelTipo,
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
  it("trail de 2 h suave es salida media (moderado, como la planilla)", () => expect(tipoDia([e("trail_correr", 120, "suave")])).toBe("moderado"));
  it("cuestas tempo 1:20 (fuerte) es intenso", () => expect(tipoDia([e("trail_correr", 80, "fuerte")])).toBe("duro"));
  it("el MTB de 4 h del sábado es muy largo", () => expect(tipoDia([e("ruta_mtb", 240, "suave")])).toBe("muy_largo"));
  it("lo hecho reemplaza a lo planificado", () => {
    const hecho: Entreno = { deporte: "rodillo", duracionMin: 40, intensidad: "suave", estado: "hecho" };
    expect(tipoDia([rodillo75, hecho])).toBe("suave");
  });
});

// Planilla de la nutricionista (19-25 abr): 75 kg, 41 años, 181 cm.
// Reposo 1.681 (la planilla redondea a 1.684) + 500 de actividad diaria.
const planilla: PerfilMotor = { ...francisco, edad: 41 };
const sesion = (deporte: Entreno["deporte"], min: number, intensidad: Entreno["intensidad"], kcal: number, hora: string | null = null): Entreno => ({
  deporte, duracionMin: min, intensidad, estado: "planificado", kcal, hora,
});

describe("objetivoDelDia · plan de la nutricionista", () => {
  it("lunes de descanso: gasto 2.181 − 300 = 1.881; 173 P, 60 G y 162 C (planilla: 163)", () => {
    const o = objetivoDelDia({ perfil: planilla, pesoKg: 75, entrenosHoy: [] });
    expect(o).toMatchObject({ tipo: "descanso", reposoKcal: 1681, gastoKcal: 2181, proteinaG: 173, grasaG: 60, carboG: 162, snackPreEntreno: false });
    expect(o.deficitKcal).toBeGreaterThanOrEqual(295);
    expect(o.deficitKcal).toBeLessThanOrEqual(305);
  });

  it("martes duro (rodillo 1:10 de 650 kcal a las 05:15): −350 y 312 C (planilla: 313) con snack previo", () => {
    const o = objetivoDelDia({ perfil: planilla, pesoKg: 75, entrenosHoy: [sesion("rodillo", 70, "fuerte", 650, "05:15")] });
    expect(o).toMatchObject({ tipo: "duro", gastoKcal: 2831, carboG: 312, proteinaG: 173, grasaG: 60, snackPreEntreno: true });
  });

  it("miércoles Z2 (rodillo 1:10 de 450 kcal): −500 y 225 C (planilla: 226)", () => {
    const o = objetivoDelDia({ perfil: planilla, pesoKg: 75, entrenosHoy: [sesion("rodillo", 70, "suave", 450)] });
    expect(o).toMatchObject({ tipo: "suave", carboG: 225 });
  });

  it("sábado de 4 h (2.000 kcal): −500 y 612 C, que incluyen lo que se come en la bici (planilla: 613)", () => {
    const o = objetivoDelDia({ perfil: planilla, pesoKg: 75, entrenosHoy: [sesion("rodillo", 240, "suave", 2000)] });
    expect(o).toMatchObject({ tipo: "muy_largo", gastoKcal: 4181, carboG: 612 });
  });

  it("la proteína (2,3 g/kg) y la grasa (0,8 g/kg) no cambian entre días; sin víspera ni cena extra", () => {
    const descanso = objetivoDelDia({ perfil: planilla, pesoKg: 75, entrenosHoy: [], entrenosManana: [sesion("rodillo", 240, "suave", 2000)] });
    const largo = objetivoDelDia({ perfil: planilla, pesoKg: 75, entrenosHoy: [sesion("rodillo", 240, "suave", 2000)] });
    expect(descanso.proteinaG).toBe(largo.proteinaG);
    expect(descanso.grasaG).toBe(largo.grasaG);
    expect(descanso).toMatchObject({ vispera: false, extraCenaG: 0 });
  });

  it("modo pausa come a mantenimiento", () => {
    const o = objetivoDelDia({ perfil: { ...planilla, pausa: true }, pesoKg: 75, entrenosHoy: [] });
    expect(o.deficitKcal).toBeLessThanOrEqual(10);
  });

  it("el déficit de descanso elegido mueve todos los días en proporción, con tope", () => {
    expect(deficitDelTipo("descanso")).toBe(300);
    expect(deficitDelTipo("duro")).toBe(350);
    expect(deficitDelTipo("moderado")).toBe(400);
    expect(deficitDelTipo("suave", 450)).toBe(750);
    expect(deficitDelTipo("descanso", 2000)).toBe(450);
  });

  it("el carbohidrato no baja de 2 g/kg aunque el déficit lo pida", () => {
    const o = objetivoDelDia({ perfil: { ...planilla, deficitDescanso: 450, factorActividad: 1 }, pesoKg: 75, entrenosHoy: [] });
    expect(o.carboG).toBeGreaterThanOrEqual(150);
  });

  it("un trote suave temprano no pide snack previo", () => {
    const o = objetivoDelDia({ perfil: planilla, pesoKg: 75, entrenosHoy: [{ deporte: "trail_correr", duracionMin: 45, intensidad: "suave", estado: "planificado", hora: "05:00" }] });
    expect(o.snackPreEntreno).toBe(false);
  });
});

describe("repartirComidas", () => {
  it("con entreno temprano el desayuno lleva la mayor parte del carbohidrato y el total cuadra", () => {
    const o = objetivoDelDia({ perfil: francisco, pesoKg: PESO, entrenosHoy: [rodillo75] });
    const r = repartirComidas(o, true);
    expect(r.desayuno.carboG).toBeGreaterThan(r.almuerzo.carboG);
    const suma = Object.values(r).reduce((s, c) => s + c.carboG, 0);
    expect(Math.abs(suma - o.carboG)).toBeLessThanOrEqual(2);
  });
  it("proteína como la planilla: 38 · 15 · 75 · 8 · 55 g en proporción", () => {
    const o = objetivoDelDia({ perfil: planilla, pesoKg: 75, entrenosHoy: [] });
    const r = repartirComidas(o, false);
    expect([r.desayuno, r.media_manana, r.almuerzo, r.media_tarde, r.cena].map((m) => m.proteinaG)).toEqual([34, 14, 68, 7, 50]);
    const p = Object.values(r).reduce((s, c) => s + c.proteinaG, 0);
    expect(Math.abs(p - o.proteinaG)).toBeLessThanOrEqual(2);
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

describe("carboDurante", () => {
  const ruta = (min: number, estado: "hecho" | "planificado" = "hecho"): Entreno => ({ deporte: "ruta_mtb", duracionMin: min, intensidad: "moderado", estado });
  it("60 g por hora solo en entrenos de 90 min o más", () => {
    expect(carboDurante([ruta(256)])).toBe(256); // el fondo del 7-nov
    expect(carboDurante([ruta(75)])).toBe(0);
    expect(carboDurante([ruta(90)])).toBe(90);
  });
  it("lo hecho reemplaza al plan y la fuerza no cuenta", () => {
    expect(carboDurante([ruta(180, "planificado"), ruta(256)])).toBe(256);
    expect(carboDurante([{ deporte: "fuerza", duracionMin: 120, intensidad: "suave", estado: "hecho" }])).toBe(0);
  });
});
