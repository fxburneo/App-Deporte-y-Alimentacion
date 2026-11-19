import { describe, expect, it } from "vitest";
import {
  cumplimientoAlimentacion,
  cumplimientoEntreno,
  moverPeriodo,
  puntajeAlimentacion,
  puntajeSesion,
  racha,
  rangoPeriodo,
  semaforo,
  sesionesDelCoach,
  type EntrenoCumplimiento,
} from "./cumplimiento";

describe("puntaje por sesión del coach", () => {
  it("entre 80 y 120 % de lo planificado es 100", () => {
    expect(puntajeSesion(70, 70)).toBe(100);
    expect(puntajeSesion(80, 88)).toBe(100); // 110 %
    expect(puntajeSesion(100, 80)).toBe(100);
    expect(puntajeSesion(100, 120)).toBe(100);
  });
  it("bajo 80 % baja en proporción: 60 % da 75", () => {
    expect(puntajeSesion(100, 60)).toBe(75);
  });
  it("sobre 120 % también baja: 150 % da 70", () => {
    expect(puntajeSesion(100, 150)).toBe(70);
    expect(Math.round(puntajeSesion(210, 256))).toBe(98); // 122 %
  });
  it("no hecha es 0 y nunca baja de 0", () => {
    expect(puntajeSesion(60, 0)).toBe(0);
    expect(puntajeSesion(60, 400)).toBe(0);
  });
});

describe("cumplimiento de entreno del periodo", () => {
  it("pondera por duración planificada", () => {
    // 3:30 hecha y 1:00 no hecha: 210/270 = 78
    expect(cumplimientoEntreno([{ fecha: "a", planMin: 210, hechoMin: 210 }, { fecha: "b", planMin: 60, hechoMin: 0 }])).toBe(78);
  });
  it("sin sesiones no hay nada que medir", () => {
    expect(cumplimientoEntreno([])).toBeNull();
  });
});

describe("puntaje diario de alimentación", () => {
  const obj = { kcal: 2000, proteina: 174, carbo: 250 };
  it("todo en objetivo es 100", () => {
    expect(puntajeAlimentacion(obj, { kcal: 2100, proteina: 180, carbo: 240 }).total).toBe(100);
  });
  it("día sin registrar es 0", () => {
    expect(puntajeAlimentacion(obj, null).total).toBe(0);
    expect(puntajeAlimentacion(obj, { kcal: 0, proteina: 0, carbo: 0 }).total).toBe(0);
  });
  it("calorías: 0 a ±40 %, lineal desde ±10 %", () => {
    expect(puntajeAlimentacion(obj, { kcal: 2800, proteina: 174, carbo: 250 }).kcal).toBe(0);
    expect(puntajeAlimentacion(obj, { kcal: 1500, proteina: 174, carbo: 250 }).kcal).toBe(50); // -25 %
  });
  it("proteína proporcional bajo el objetivo y sin premio por pasarse", () => {
    expect(puntajeAlimentacion(obj, { kcal: 2000, proteina: 87, carbo: 250 }).proteina).toBe(50);
    expect(puntajeAlimentacion(obj, { kcal: 2000, proteina: 250, carbo: 250 }).proteina).toBe(100);
  });
  it("pesos 40/35/25", () => {
    // kcal 100, proteína 50, carbo 0 (carbo al 50 %) → 40 + 17,5 + 0
    expect(puntajeAlimentacion(obj, { kcal: 2000, proteina: 87, carbo: 125 }).total).toBe(58);
  });
  it("el periodo promedia los días", () => {
    expect(cumplimientoAlimentacion([{ total: 100, kcal: 0, proteina: 0, carbo: 0 }, { total: 0, kcal: 0, proteina: 0, carbo: 0 }])).toBe(50);
    expect(cumplimientoAlimentacion([])).toBeNull();
  });
});

describe("semáforo", () => {
  it("verde desde 85, amarillo 70-84, rojo bajo 70", () => {
    expect(semaforo(85)).toBe("verde");
    expect(semaforo(84)).toBe("amarillo");
    expect(semaforo(70)).toBe("amarillo");
    expect(semaforo(69)).toBe("rojo");
  });
});

describe("sesiones del coach contra lo hecho", () => {
  const p = (fecha: string, deporte: string, min: number, nombre = "Bike: Tempo"): EntrenoCumplimiento => ({ fecha, estado: "planificado", deporte, duracion_min: min, nombre, origen: "trainingpeaks" });
  const h = (fecha: string, deporte: string, min: number): EntrenoCumplimiento => ({ fecha, estado: "hecho", deporte, duracion_min: min, origen: "garmin" });
  it("compara cada sesión con lo hecho ese día y limpia el nombre", () => {
    const s = sesionesDelCoach([p("2026-11-17", "rodillo", 70), h("2026-11-17", "rodillo", 70), p("2026-11-20", "trail_correr", 60)], "2026-11-16", "2026-11-22", "2026-11-22");
    expect(s.map((x) => [x.nombre, x.puntaje])).toEqual([["Tempo", 100], ["Tempo", 0]]);
  });
  it("hoy sin nada hecho está pendiente y el futuro no cuenta", () => {
    expect(sesionesDelCoach([p("2026-11-18", "rodillo", 60), p("2026-11-19", "rodillo", 60)], "2026-11-16", "2026-11-22", "2026-11-18")).toEqual([]);
  });
  it("fuerza no se cruza con la bici y el descanso no es sesión", () => {
    const s = sesionesDelCoach([p("2026-11-17", "fuerza", 0), h("2026-11-17", "rodillo", 60), p("2026-11-18", "descanso", 0)], "2026-11-16", "2026-11-22", "2026-11-22");
    expect(s).toHaveLength(1);
    expect(s[0].puntaje).toBe(0);
  });
  it("antes del 6-nov no hay plan del coach que medir", () => {
    expect(sesionesDelCoach([p("2026-11-04", "rodillo", 60)], "2026-11-01", "2026-11-30", "2026-11-30")).toEqual([]);
  });
});

describe("periodos y racha", () => {
  it("semana de lunes a domingo, mes y año calendario", () => {
    expect(rangoPeriodo("semana", "2026-11-18")).toEqual({ desde: "2026-11-16", hasta: "2026-11-22" });
    expect(rangoPeriodo("mes", "2027-02-10")).toEqual({ desde: "2027-02-01", hasta: "2027-02-28" });
    expect(rangoPeriodo("anio", "2027-05-05")).toEqual({ desde: "2027-01-01", hasta: "2027-12-31" });
  });
  it("las flechas mueven un periodo", () => {
    expect(moverPeriodo("semana", "2026-11-18", -1)).toBe("2026-11-09");
    expect(moverPeriodo("mes", "2026-12-15", 1)).toBe("2027-01-01");
    expect(moverPeriodo("anio", "2026-12-15", 1)).toBe("2027-01-01");
  });
  it("la racha cuenta hasta ayer si hoy todavía no registra", () => {
    expect(racha(["2026-11-15", "2026-11-16", "2026-11-17"], "2026-11-18")).toBe(3);
    expect(racha(["2026-11-15", "2026-11-17", "2026-11-18"], "2026-11-18")).toBe(2);
    expect(racha([], "2026-11-18")).toBe(0);
  });
});
