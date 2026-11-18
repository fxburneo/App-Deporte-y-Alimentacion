import { describe, expect, it } from "vitest";
import { cumplimientoAlimentacion, cumplimientoEntreno, puntajeAlimentacion, puntajeSesion, semaforo } from "./cumplimiento";

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
