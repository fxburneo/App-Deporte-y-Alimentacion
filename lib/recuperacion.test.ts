import { describe, expect, it } from "vitest";
import { calcularRecuperacion, puntajeFc, puntajeHrv, type DiaBienestar } from "./recuperacion";

const dia = (fecha: string, cambios: Partial<DiaBienestar> = {}): DiaBienestar => ({
  fecha, sueno_seg: 7.2 * 3600, sueno_puntaje: 80, hrv_noche: 58, hrv_estado: "BALANCED",
  hrv_base_bajo: 50, hrv_base_alto: 66, fc_reposo: 48, ...cambios,
});
const semana = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"].map((f) => dia(f));

describe("calcularRecuperacion", () => {
  it("noche normal: verde y listo para entrenar", () => {
    const r = calcularRecuperacion([...semana, dia("2026-10-26")], "2026-10-26")!;
    expect(r.puntaje).toBe(92);
    expect(r.nivel).toBe("listo");
    expect(r.fcPromedio).toBe(48);
    expect(r.mensaje).toMatch(/^Listo para entrenar: dormiste bien/);
  });

  it("dormir poco con HRV bajo y pulso alto: rojo, con las causas en el mensaje", () => {
    const r = calcularRecuperacion(
      [...semana, dia("2026-10-26", { sueno_seg: 5.5 * 3600, sueno_puntaje: 48, hrv_noche: 42, fc_reposo: 54 })],
      "2026-10-26"
    )!;
    expect(r.nivel).toBe("descansa");
    expect(r.mensaje).toContain("dormiste 5,5 h");
    expect(r.mensaje).toContain("HRV");
    expect(r.mensaje).toContain("6 latidos arriba");
  });

  it("sueño regular y HRV algo bajo: ámbar", () => {
    const r = calcularRecuperacion([...semana, dia("2026-10-26", { sueno_puntaje: 55, hrv_noche: 46 })], "2026-10-26")!;
    expect(r.nivel).toBe("cuidado");
  });

  it("si falta una señal, reparte el peso entre las demás", () => {
    const r = calcularRecuperacion([dia("2026-10-26", { fc_reposo: null })], "2026-10-26")!;
    expect(r.fc).toBeNull();
    expect(r.puntaje).toBe(90);
  });

  it("sin datos del día devuelve null", () => {
    expect(calcularRecuperacion(semana, "2026-10-26")).toBeNull();
  });
});

describe("señales sueltas", () => {
  it("HRV dentro del rango = 100; 5 ms bajo el límite = 60", () => {
    expect(puntajeHrv(dia("x"))).toBe(100);
    expect(puntajeHrv(dia("x", { hrv_noche: 45 }))).toBe(60);
  });
  it("sin rango usa el estado de Garmin", () => {
    expect(puntajeHrv(dia("x", { hrv_base_bajo: null, hrv_base_alto: null, hrv_estado: "LOW" }))).toBe(35);
  });
  it("pulso en reposo: igual a tu semana = 100, 5 arriba = 45", () => {
    expect(puntajeFc(48, 48)).toBe(100);
    expect(puntajeFc(53, 48)).toBe(45);
  });
});
