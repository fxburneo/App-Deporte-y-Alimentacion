import { describe, expect, it } from "vitest";
import { planDelDia } from "./planDia";
import type { ComidaFila, EntrenoFila, PerfilFila } from "./tipos";

const perfil = {
  user_id: "u", nombre: "Francisco", fecha_nacimiento: "1984-07-05", estatura_cm: 181, grasa_pct: null, objetivo_min_kg: 72, objetivo_max_kg: 73,
  ritmo: "moderado", ciudad: "Quito", altitud_m: 2800, no_incluir: [], dias_pesaje: [1, 3, 5], factor_actividad: 1.35, pausa: false,
  horarios_comida: { desayuno: "06:45", media_manana: "10:00", almuerzo: "13:00", media_tarde: "16:00", cena: "19:00" },
  entreno_semana: "05:15", entreno_finde: "06:30", deficit_descanso: 300,
} as unknown as PerfilFila;
const fondo = { id: 1, fecha: "2026-11-07", hora: "06:35", estado: "hecho", deporte: "ruta_mtb", duracion_min: 256, intensidad: "moderado", kcal: 1684, origen: "garmin" } as EntrenoFila;
const comida = (momento: string, carbo: number) => ({ id: 1, fecha: "2026-11-07", comida: momento, carbo_g: carbo, proteina_g: 0, grasa_g: 0 }) as unknown as ComidaFila;
const base = { fecha: "2026-11-07", perfil, pesos: [{ id: 1, fecha: "2026-11-06", kg: 75.5, origen: "manual" as const }], entrenosHoy: [fondo], entrenosManana: [] };

describe("planDelDia · durante el entreno", () => {
  it("el fondo de 4 h 16 reserva 60 g/h (tope: la mitad del carbohidrato del día) y las comidas se reparten el resto", () => {
    const p = planDelDia({ ...base, comidas: [] })!;
    const comidasC = Object.values(p.reparto).reduce((s, m) => s + m.carboG, 0);
    const reserva = p.objetivoDurante!.carboG;
    expect(reserva).toBe(Math.min(256, Math.round(p.objetivo.carboG * 0.5)));
    // Comidas + durante + snack previo (salió a las 06:35, antes del desayuno) = total del día
    expect(Math.abs(comidasC + reserva + (p.objetivoPre?.carboG ?? 0) - p.objetivo.carboG)).toBeLessThanOrEqual(3);
  });
  it("si comió justo lo previsto en la bici, no hay ajuste; si comió menos, las comidas suben", () => {
    const reserva = planDelDia({ ...base, comidas: [] })!.objetivoDurante!.carboG;
    expect(planDelDia({ ...base, comidas: [comida("durante", reserva)] })!.ajuste.diferenciaKcal).toBe(0);
    const corto = planDelDia({ ...base, comidas: [comida("durante", 100)] })!;
    expect(corto.ajuste.diferenciaKcal).toBeLessThan(0);
    expect(corto.consumoDurante?.carboG).toBe(100);
  });
  it("sin entreno largo no hay reserva", () => {
    expect(planDelDia({ ...base, entrenosHoy: [], comidas: [] })!.objetivoDurante).toBeNull();
  });
});
