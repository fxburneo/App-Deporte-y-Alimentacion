import { describe, expect, it } from "vitest";
import { planDelDia } from "./planDia";
import { resumenPeriodo } from "./cumplimientoPeriodo";
import type { ComidaFila, EntrenoFila, PerfilFila } from "./tipos";

const perfil = {
  user_id: "u", nombre: "Francisco", fecha_nacimiento: "1984-07-05", estatura_cm: 181, grasa_pct: null, objetivo_min_kg: 72, objetivo_max_kg: 73,
  ritmo: "moderado", ciudad: "Quito", altitud_m: 2800, no_incluir: [], dias_pesaje: [1, 3, 5], factor_actividad: 1.35, pausa: false,
  horarios_comida: { desayuno: "06:45", media_manana: "10:00", almuerzo: "13:00", media_tarde: "16:00", cena: "19:00" },
  entreno_semana: "05:15", entreno_finde: "06:30", deficit_descanso: 300,
} as unknown as PerfilFila;
const pesos = [{ id: 1, fecha: "2026-11-10", kg: 75.5, origen: "manual" as const }];
const plan = (fecha: string, min: number) => ({ id: 1, fecha, hora: "05:15", estado: "planificado", deporte: "rodillo", duracion_min: min, intensidad: "suave", kcal: null, origen: "trainingpeaks", nombre: "Bike: Z2" }) as EntrenoFila;
const hecho = (fecha: string, min: number) => ({ id: 2, fecha, hora: "05:15", estado: "hecho", deporte: "rodillo", duracion_min: min, intensidad: "suave", kcal: 600, origen: "garmin" }) as EntrenoFila;

describe("resumen del periodo", () => {
  it("día comido justo en el objetivo da 100 y día sin registro da 0; hoy no cuenta", () => {
    const entrenos = [plan("2026-11-17", 60), hecho("2026-11-17", 60)];
    const obj = planDelDia({ fecha: "2026-11-16", perfil, pesos, entrenosHoy: [], entrenosManana: entrenos.filter((e) => e.fecha === "2026-11-17"), comidas: [] })!.objetivo;
    const comida = { id: 1, fecha: "2026-11-16", comida: "almuerzo", carbo_g: obj.carboG, proteina_g: obj.proteinaG, grasa_g: obj.grasaG, kcal: obj.kcal } as unknown as ComidaFila;
    const r = resumenPeriodo({ desde: "2026-11-16", hasta: "2026-11-22", hoy: "2026-11-18", perfil, pesos, entrenos, comidas: [comida], carreras: [] });
    expect(r.dias[0].alimentacion?.total).toBe(100);
    expect(r.dias[1].alimentacion?.total).toBe(0);
    expect(r.dias[2].alimentacion).toBeNull(); // hoy
    expect(r.alimentacion).toBe(50);
    expect(r.entreno).toBe(100);
    expect(r.sesiones).toHaveLength(1);
    expect(r.diasMedidos).toBe(2);
  });
  it("sin plan del coach el entreno queda sin medir", () => {
    const r = resumenPeriodo({ desde: "2026-11-16", hasta: "2026-11-22", hoy: "2026-11-23", perfil, pesos, entrenos: [], comidas: [], carreras: [] });
    expect(r.entreno).toBeNull();
    expect(r.alimentacion).toBe(0);
  });
});
