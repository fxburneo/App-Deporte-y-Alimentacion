import { describe, expect, it } from "vitest";
import { leerEntrenoForm } from "./entrenoForm";

const fd = (v: Record<string, string>) => {
  const f = new FormData();
  Object.entries(v).forEach(([k, x]) => f.append(k, x));
  return f;
};
const base = { dia: "manana", estado: "planificado", deporte: "rodillo", duracion_min: "75", intensidad: "moderado", hora: "05:00", kcal: "" };

describe("leerEntrenoForm", () => {
  it("rodillo planificado para mañana", () => {
    const r = leerEntrenoForm(fd(base), "2026-10-21", "2026-10-22");
    expect(r).toEqual({
      ok: true,
      entreno: { fecha: "2026-10-22", hora: "05:00", estado: "planificado", deporte: "rodillo", duracion_min: 75, intensidad: "moderado", kcal: null },
    });
  });
  it("lo hecho guarda las calorías del reloj", () => {
    const r = leerEntrenoForm(fd({ ...base, dia: "hoy", estado: "hecho", kcal: "612" }), "2026-10-21", "2026-10-22");
    expect(r.ok && r.entreno.kcal).toBe(612);
  });
  it("las calorías de un plan se ignoran", () => {
    const r = leerEntrenoForm(fd({ ...base, kcal: "612" }), "2026-10-21", "2026-10-22");
    expect(r.ok && r.entreno.kcal).toBeNull();
  });
  it("no se puede marcar como hecho un entreno de mañana", () => {
    expect(leerEntrenoForm(fd({ ...base, estado: "hecho" }), "2026-10-21", "2026-10-22").ok).toBe(false);
  });
  it("descanso guarda duración cero", () => {
    const r = leerEntrenoForm(fd({ ...base, deporte: "descanso", duracion_min: "60" }), "2026-10-21", "2026-10-22");
    expect(r.ok && r.entreno.duracion_min).toBe(0);
  });
  it("rechaza duración cero en un deporte", () => {
    expect(leerEntrenoForm(fd({ ...base, duracion_min: "0" }), "2026-10-21", "2026-10-22").ok).toBe(false);
  });
});
