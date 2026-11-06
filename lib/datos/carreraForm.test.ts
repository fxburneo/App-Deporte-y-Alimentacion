import { describe, expect, it } from "vitest";
import { leerCarreraForm } from "./carreraForm";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const petzl = { nombre: "Petzl 50K", fecha: "2027-04-03", deporte: "trail", distancia_km: "50", desnivel_m: "", horas_min: "8", horas_max: "10", prioridad: "A" };

describe("leerCarreraForm", () => {
  it("lee la carrera de Francisco", () => {
    expect(leerCarreraForm(fd(petzl), "2026-11-07")).toEqual({
      ok: true,
      carrera: { nombre: "Petzl 50K", fecha: "2027-04-03", deporte: "trail", distancia_km: 50, desnivel_m: null, horas_min: 8, horas_max: 10, prioridad: "A" },
    });
  });
  it("acepta coma decimal en las horas", () => {
    const r = leerCarreraForm(fd({ ...petzl, horas_min: "3,5", horas_max: "4,5" }), "2026-11-07");
    expect(r.ok && r.carrera.horas_min).toBe(3.5);
  });
  it("rechaza datos imposibles", () => {
    expect(leerCarreraForm(fd({ ...petzl, nombre: " " }), "2026-11-07")).toMatchObject({ ok: false });
    expect(leerCarreraForm(fd({ ...petzl, fecha: "2026-10-01" }), "2026-11-07")).toMatchObject({ ok: false, error: "La fecha ya pasó." });
    expect(leerCarreraForm(fd({ ...petzl, horas_min: "10", horas_max: "8" }), "2026-11-07")).toMatchObject({ ok: false });
    expect(leerCarreraForm(fd({ ...petzl, deporte: "natacion" }), "2026-11-07")).toMatchObject({ ok: false });
  });
});
