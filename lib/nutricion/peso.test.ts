import { describe, expect, it } from "vitest";
import { proyeccionPeso } from "./peso";

describe("proyeccionPeso", () => {
  // Baja ~0,44 kg por semana, con un lunes alto como ruido.
  const pesajes = [
    { fecha: "2026-10-01", kg: 76.0 },
    { fecha: "2026-10-05", kg: 76.0 }, // lunes alto
    { fecha: "2026-10-07", kg: 75.6 },
    { fecha: "2026-10-09", kg: 75.5 },
    { fecha: "2026-10-12", kg: 75.5 },
    { fecha: "2026-10-14", kg: 75.2 },
    { fecha: "2026-10-16", kg: 75.1 },
  ];

  it("calcula la tendencia semanal", () => {
    const p = proyeccionPeso(pesajes, 73, "2026-10-16");
    expect(p!.kgPorSemana).toBeLessThan(-0.3);
    expect(p!.kgPorSemana).toBeGreaterThan(-0.5);
  });

  it("a ese ritmo, desde ~75 kg llega a 73 kg en unas 4–5 semanas", () => {
    const p = proyeccionPeso(pesajes, 73, "2026-10-16");
    expect(p!.fechaObjetivo).toBe("2026-11-19");
  });

  it("con menos de 4 pesajes o menos de 10 días no proyecta", () => {
    expect(proyeccionPeso(pesajes.slice(0, 3), 73, "2026-10-16")).toBeNull();
    expect(proyeccionPeso(pesajes.slice(-4), 73, "2026-10-16")).toBeNull();
  });

  it("si el peso no baja no inventa una fecha", () => {
    const planos = pesajes.map((p) => ({ ...p, kg: 75.5 }));
    expect(proyeccionPeso(planos, 73, "2026-10-16")!.fechaObjetivo).toBeNull();
  });

  it("si ya está en el objetivo devuelve hoy", () => {
    const abajo = pesajes.map((p) => ({ ...p, kg: p.kg - 3 }));
    expect(proyeccionPeso(abajo, 73, "2026-10-16")!.fechaObjetivo).toBe("2026-10-16");
  });
});
