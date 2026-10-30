import { describe, expect, it } from "vitest";
import { estimarRitmo } from "./estimacion";
import type { Entreno, PerfilMotor } from "./motor";

const francisco: PerfilMotor = { estaturaCm: 181, edad: 42, ritmo: "moderado", factorActividad: 1.35, pausa: false, horaDesayuno: "06:45" };
const rodillo: Entreno = { deporte: "rodillo", duracionMin: 60, intensidad: "suave", estado: "hecho" };
const mtb: Entreno = { deporte: "ruta_mtb", duracionMin: 240, intensidad: "suave", estado: "hecho" };
const trail: Entreno = { deporte: "trail_correr", duracionMin: 120, intensidad: "suave", estado: "hecho" };
// Semana tipo: L-V rodillo 1 h, sábado MTB 4 h, domingo trail 2 h (4 semanas + 1 día)
const semana = [[rodillo], [rodillo], [rodillo], [rodillo], [rodillo], [mtb], [trail]];
const dias = [...semana, ...semana, ...semana, ...semana, [rodillo]];

describe("estimarRitmo", () => {
  it("con el déficit por defecto baja poco (víspera y fondo sin déficit)", () => {
    const r = estimarRitmo({ perfil: francisco, pesoKg: 76, objetivoKg: 73, dias });
    expect(r.deficitPromedio).toBeGreaterThan(150);
    expect(r.deficitPromedio).toBeLessThan(320);
    expect(r.kgSemana).toBeGreaterThan(0.1);
    expect(r.semanasAlObjetivo).toBeGreaterThan(8);
  });
  it("subir el déficit de descanso acelera la bajada", () => {
    const base = estimarRitmo({ perfil: francisco, pesoKg: 76, objetivoKg: 73, dias });
    const mas = estimarRitmo({ perfil: { ...francisco, deficitDescanso: 650 }, pesoKg: 76, objetivoKg: 73, dias });
    expect(mas.kgSemana).toBeGreaterThan(base.kgSemana);
    expect(mas.semanasAlObjetivo!).toBeLessThan(base.semanasAlObjetivo!);
  });
  it("en modo pausa no hay déficit ni fecha", () => {
    const r = estimarRitmo({ perfil: { ...francisco, pausa: true }, pesoKg: 76, objetivoKg: 73, dias });
    expect(r.semanasAlObjetivo).toBeNull();
  });
});
