import { describe, expect, it } from "vitest";
import { actividadAEntreno, armarBienestar, deporteDesdeTipo, intensidadDesde, tramos } from "@/supabase/functions/garmin-sync/mapeo";

describe("deporteDesdeTipo", () => {
  it("clasifica los deportes de Francisco", () => {
    expect(deporteDesdeTipo("indoor_cycling")).toBe("rodillo");
    expect(deporteDesdeTipo("virtual_ride")).toBe("rodillo");
    expect(deporteDesdeTipo("mountain_biking")).toBe("ruta_mtb");
    expect(deporteDesdeTipo("trail_running")).toBe("trail_correr");
    expect(deporteDesdeTipo("strength_training")).toBe("fuerza");
  });
  it("una caminata no cuenta como entreno", () => expect(deporteDesdeTipo("walking")).toBeNull());
});

describe("intensidadDesde", () => {
  it("20 % o más en zonas 4-5 es fuerte", () => expect(intensidadDesde([600, 1200, 600, 400, 200])).toBe("fuerte"));
  it("intervalos en zona 3 son moderado", () => expect(intensidadDesde([600, 1800, 1500, 300, 0])).toBe("moderado"));
  it("rodaje en zonas 1-2 es suave", () => expect(intensidadDesde([1200, 2400, 300, 0, 0])).toBe("suave"));
  it("sin zonas usa el efecto aeróbico", () => {
    expect(intensidadDesde([], 4.2)).toBe("fuerte");
    expect(intensidadDesde([], 3.1)).toBe("moderado");
    expect(intensidadDesde([], 2.0)).toBe("suave");
  });
});

describe("actividadAEntreno", () => {
  const rodillo = {
    activityId: 987654321,
    activityName: "Rodillo intervalos",
    startTimeLocal: "2026-10-21 05:02:11",
    activityType: { typeKey: "indoor_cycling" },
    duration: 3615.4,
    calories: 612.6,
    averageHR: 138.2,
    activityTrainingLoad: 92.37,
    aerobicTrainingEffect: 3.4,
    hrTimeInZone_1: 300, hrTimeInZone_2: 1500, hrTimeInZone_3: 1100, hrTimeInZone_4: 600, hrTimeInZone_5: 100,
  };
  it("convierte un rodillo de Garmin en un entreno hecho", () => {
    expect(actividadAEntreno(rodillo, "u1")).toMatchObject({
      user_id: "u1", garmin_id: 987654321, fecha: "2026-10-21", hora: "05:02", estado: "hecho",
      deporte: "rodillo", duracion_min: 60, intensidad: "moderado", kcal: 613, origen: "garmin",
      carga: 92.4, fc_media: 138, zonas_seg: [300, 1500, 1100, 600, 100],
    });
  });
  it("ignora actividades que no son entreno", () => {
    expect(actividadAEntreno({ ...rodillo, activityType: { typeKey: "walking" } }, "u1")).toBeNull();
  });
});

describe("armarBienestar", () => {
  it("junta sueño, HRV y resumen del mismo día en una fila", () => {
    const filas = armarBienestar(
      "u1",
      [{ calendarDate: "2026-10-21", sleepTimeSeconds: 24600, deepSleepSeconds: 5400, remSleepSeconds: 4800, awakeCount: 2, sleepScores: { overall: { value: 78 } } }],
      [{ calendarDate: "2026-10-21", lastNightAvg: 58, weeklyAvg: 55, status: "BALANCED", baseline: { balancedLow: 50, balancedUpper: 66 } }],
      [{ calendarDate: "2026-10-21", heartRate: { restingValue: 48 }, bodyBattery: { maxValue: 85, minValue: 20 }, stress: { avgLevel: -1 } }]
    );
    expect(filas).toEqual([{
      user_id: "u1", fecha: "2026-10-21", sueno_seg: 24600, sueno_profundo_seg: 5400, sueno_rem_seg: 4800,
      sueno_puntaje: 78, despertares: 2, hrv_noche: 58, hrv_semana: 55, hrv_estado: "BALANCED",
      hrv_base_bajo: 50, hrv_base_alto: 66, fc_reposo: 48, body_battery_max: 85, body_battery_min: 20, estres_promedio: null,
    }]);
  });
  it("descarta noches sin sueño registrado", () => {
    expect(armarBienestar("u1", [{ calendarDate: "2026-10-21", sleepTimeSeconds: 0 }], [], [])).toEqual([]);
  });
});

describe("tramos", () => {
  it("parte 60 días en 3 tramos de hasta 28", () => {
    const t = tramos("2026-08-28", "2026-10-26");
    expect(t).toHaveLength(3);
    expect(t[0]).toEqual(["2026-08-28", "2026-09-24"]);
    expect(t[2][1]).toBe("2026-10-26");
  });
});
