import { describe, expect, it } from "vitest";
import { leerPerfilForm, objetivoSugerido } from "./validar";

function formulario(cambios: Record<string, string | string[]> = {}) {
  const base: Record<string, string | string[]> = {
    fecha_nacimiento: "1984-07-05",
    estatura_cm: "181",
    peso_kg: "75,4",
    grasa_pct: "",
    objetivo_min_kg: "72",
    objetivo_max_kg: "73",
    ritmo: "moderado",
    hora_desayuno: "06:45",
    hora_media_manana: "10:00",
    hora_almuerzo: "13:00",
    hora_media_tarde: "16:00",
    hora_cena: "19:00",
    entreno_semana: "05:00",
    entreno_finde: "06:30",
    dias_pesaje: ["1", "3", "5"],
    no_incluir: ["Pescado", "Mariscos", "Vísceras", "Pescado"],
    ...cambios,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) (Array.isArray(v) ? v : [v]).forEach((x) => fd.append(k, x));
  return fd;
}

describe("leerPerfilForm", () => {
  it("acepta los datos de Francisco y convierte la coma decimal", () => {
    const r = leerPerfilForm(formulario(), "2026-10-21");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.pesoKg).toBe(75.4);
    expect(r.perfil.grasa_pct).toBeNull();
    expect(r.perfil.no_incluir).toEqual(["Pescado", "Mariscos", "Vísceras"]);
    expect(r.perfil.dias_pesaje).toEqual([1, 3, 5]);
    expect(r.perfil.horarios_comida.cena).toBe("19:00");
  });
  it("rechaza estatura en metros", () => {
    const r = leerPerfilForm(formulario({ estatura_cm: "1,81" }), "2026-10-21");
    expect(r).toEqual({ ok: false, error: "La estatura va en centímetros, entre 120 y 230." });
  });
  it("rechaza objetivo invertido", () => {
    const r = leerPerfilForm(formulario({ objetivo_min_kg: "74", objetivo_max_kg: "72" }), "2026-10-21");
    expect(r.ok).toBe(false);
  });
  it("rechaza una hora mal escrita", () => {
    expect(leerPerfilForm(formulario({ hora_cena: "7pm" }), "2026-10-21").ok).toBe(false);
  });
  it("el peso es opcional al editar el perfil", () => {
    const r = leerPerfilForm(formulario({ peso_kg: "" }), "2026-10-21");
    expect(r.ok && r.pesoKg).toBeNull();
  });
});

describe("objetivoSugerido", () => {
  it("para 181 cm sugiere 72–73 kg", () => expect(objetivoSugerido(181)).toEqual([72, 73]));
});
