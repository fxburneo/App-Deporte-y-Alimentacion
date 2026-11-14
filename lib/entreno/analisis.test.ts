import { describe, expect, it } from "vitest";
import { intensidad, resumenSueno, semanaEntreno, serieCarga, textoCansancio, textoFrescura, ultimoHueco } from "./analisis";

// Cargas reales de Garmin de Francisco (29-ago → 13-nov).
const cargas: Record<string, number> = {"2026-08-29":84.7,"2026-08-30":113.6,"2026-09-01":32.3,"2026-09-03":122.4,"2026-09-05":147.7,"2026-09-06":138.4,"2026-09-08":29.9,"2026-09-09":70.1,"2026-09-10":138.9,"2026-09-11":37.0,"2026-09-12":133.1,"2026-10-07":24.7,"2026-10-14":42.8,"2026-10-15":4.6,"2026-10-16":63.1,"2026-10-17":65.7,"2026-10-20":85.7,"2026-10-23":63.5,"2026-10-24":112.9,"2026-10-27":8.0,"2026-10-28":43.6,"2026-10-29":108.2,"2026-10-30":139.9,"2026-10-31":135.5,"2026-11-04":47.5,"2026-11-05":107.8,"2026-11-06":97.4,"2026-11-07":83.8,"2026-11-08":105.0,"2026-11-09":1.6,"2026-11-10":78.7,"2026-11-12":68.5};

describe("serieCarga", () => {
  it("al 13-nov: base 31 (TrainingPeaks marcaba 33), cansancio 47 y frescura −16", () => {
    const s = serieCarga(cargas, "2026-08-29", "2026-11-13");
    const h = s.at(-1)!;
    expect([Math.round(h.base), Math.round(h.cansancio), Math.round(h.frescura)]).toEqual([31, 47, -16]);
  });
});

describe("ultimoHueco", () => {
  it("detecta la lesión: desde el 13-sep hasta el primer entreno (7-oct)", () => {
    expect(ultimoHueco(cargas, "2026-08-29", "2026-11-13")).toEqual({ desde: "2026-09-13", hasta: "2026-10-06" });
    expect(ultimoHueco({ ...cargas, "2026-10-07": 0 }, "2026-08-29", "2026-11-13")).toEqual({ desde: "2026-09-13", hasta: "2026-10-13" });
  });
});

describe("textos", () => {
  it("cansancio y frescura en lenguaje simple", () => {
    expect(textoCansancio(31, 47)).toBe("alto para tu base");
    expect(textoCansancio(31, 30)).toBe("bajo: estás descansado");
    expect(textoFrescura(-16)).toBe("cansado, normal en semana de carga");
    expect(textoFrescura(-37)).toMatch(/bajar la carga/);
    expect(textoFrescura(8)).toMatch(/fresco/);
  });
});

describe("intensidad", () => {
  it("porcentajes por zona y el ejemplo con más zona media", () => {
    const r = intensidad([
      { fecha: "2026-11-08", duracion_min: 87, zonas_seg: [500, 630, 3578, 300, 42] },
      { fecha: "2026-11-07", duracion_min: 256, zonas_seg: [4000, 5034, 4099, 800, 87] },
    ])!;
    expect(r.suave + r.media + r.fuerte).toBe(100);
    expect(r.ejemplo).toEqual({ fecha: "2026-11-08", zona3Min: 60, totalMin: 84 });
  });
  it("sin zonas no muestra nada", () => expect(intensidad([{ fecha: "x", duracion_min: 30, zonas_seg: null }])).toBeNull());
});

describe("semanaEntreno", () => {
  it("plan del coach contra lo hecho, día por día", () => {
    const s = semanaEntreno(
      [
        { fecha: "2026-11-10", estado: "planificado", deporte: "trail_correr", duracion_min: 60, nombre: "Run: Run Aeróbico", origen: "trainingpeaks" },
        { fecha: "2026-11-10", estado: "hecho", deporte: "trail_correr", duracion_min: 65, nombre: null, origen: "garmin" },
        { fecha: "2026-11-13", estado: "planificado", deporte: "trail_correr", duracion_min: 60, nombre: "Run: Run Aeróbico", origen: "trainingpeaks" },
        { fecha: "2026-11-14", estado: "planificado", deporte: "ruta_mtb", duracion_min: 180, nombre: "Bike: Fondo Medio", origen: "trainingpeaks" },
      ],
      "2026-11-09",
      "2026-11-14"
    );
    expect(s[1]).toEqual({ fecha: "2026-11-10", plan: "Run Aeróbico 1:00", hecho: "1:05", estado: "ok" });
    expect(s[4].estado).toBe("falta");
    expect(s[5].estado).toBe("hoy");
    expect(s[6].estado).toBe("libre");
  });
});

describe("resumenSueno", () => {
  it("promedio, noches cortas y el HRV semanal con su rango", () => {
    const r = resumenSueno([
      { fecha: "a", sueno_seg: 8 * 3600, hrv_semana: 47, hrv_base_bajo: 49, hrv_base_alto: 67 },
      { fecha: "b", sueno_seg: 6.5 * 3600, hrv_semana: 50, hrv_base_bajo: 49, hrv_base_alto: 67 },
    ])!;
    expect(r).toEqual({ promedioMin: 435, nochesCortas: 1, noches: 2, hrvSemana: 50, rango: [49, 67] });
  });
});
