import { describe, expect, it } from "vitest";
import { planDelDia } from "@/lib/datos/planDia";
import type { EntrenoFila, PerfilFila } from "@/lib/datos/tipos";
import type { AlimentoDespensa } from "@/lib/despensa/calculos";
import { menuDelDia } from "./semana";

const d = (id: number, nombre: string, categoria: AlimentoDespensa["categoria"], c: number, p: number, g: number, porcion: number, unidad: number | null, un: string | null): AlimentoDespensa => ({
  id, nombre, marca: null, tipo: "generico", categoria, carbo_100: c, proteina_100: p, grasa_100: g, porcion_g: porcion, porcion_nombre: `${porcion} g`, unidad_g: unidad, unidad_nombre: un,
});
const despensa = [
  d(1, "Pechuga de pollo cocida", "proteina", 0, 31, 3.6, 150, 150, "pechuga"),
  d(7, "Arroz blanco cocido", "carbo", 28, 2.7, 0.3, 160, 160, "taza"),
  d(27, "Arroz integral cocido", "carbo", 23, 2.6, 0.9, 160, 160, "taza"),
  d(20, "Pan de agua precocido", "carbo", 51.4, 8.6, 5.7, 35, 35, "pan"),
  d(31, "Miel de abeja", "carbo", 82, 0.3, 0, 21, 21, "cucharada"),
  d(21, "Gel energético", "carbo", 78, 0, 0, 32, 32, "gel"),
  d(22, "Bebida isotónica", "carbo", 6, 0, 0, 500, 500, "botella"),
];
const perfil = {
  user_id: "u", nombre: "Francisco", fecha_nacimiento: "1984-07-05", estatura_cm: 181, grasa_pct: null, objetivo_min_kg: 72, objetivo_max_kg: 73,
  ritmo: "moderado", ciudad: "Quito", altitud_m: 2800, no_incluir: [], dias_pesaje: [1, 3, 5], factor_actividad: 1.35, pausa: false,
  horarios_comida: { desayuno: "06:45", media_manana: "10:00", almuerzo: "13:00", media_tarde: "16:00", cena: "19:00" },
  entreno_semana: "05:15", entreno_finde: "06:30", deficit_descanso: 300,
} as unknown as PerfilFila;
const almuerzo = [
  { nombre: "Pechuga de pollo cocida", detalle: "", gramos: 200, medida_casera: "1 pechuga", carbo_g: 0, proteina_g: 62, grasa_g: 7.2 },
  { nombre: "Arroz integral cocido", detalle: "", gramos: 200, medida_casera: "1 ¼ taza", carbo_g: 46, proteina_g: 5.2, grasa_g: 1.8 },
];
const base = { perfil, pesos: [{ id: 1, fecha: "2026-11-09", kg: 75.5, origen: "manual" as const }], entrenosManana: [], comidas: [] };
const fondo = { id: 1, fecha: "2026-11-21", hora: "06:30", estado: "planificado", deporte: "ruta_mtb", duracion_min: 240, intensidad: "suave", kcal: null, origen: "trainingpeaks" } as EntrenoFila;

describe("menuDelDia", () => {
  it("sábado de 4 h: antes de salir, durante la salida (geles y bebida) y almuerzo con arroz blanco", () => {
    const plan = planDelDia({ ...base, fecha: "2026-11-21", entrenosHoy: [fondo] })!;
    const m = menuDelDia({ fecha: "2026-11-21", plan, menuTipo: { almuerzo }, despensa, horasLargas: 4, dia: 0 });
    expect(m.comidas.map((c) => c.momento).slice(0, 2)).toEqual(["pre_entreno", "durante"]);
    expect(m.comidas[1].items.map((i) => i.nombre)).toEqual(["Bebida isotónica", "Gel energético"]);
    const alm = m.comidas.find((c) => c.momento === "almuerzo")!;
    expect(alm.deMenuTipo).toBe(true);
    expect(alm.items.find((i) => i.nombre.startsWith("Arroz"))!.nombre).toBe("Arroz blanco cocido");
  });
  it("lunes de descanso: sin antes ni durante y arroz integral", () => {
    const plan = planDelDia({ ...base, fecha: "2026-11-16", entrenosHoy: [] })!;
    const m = menuDelDia({ fecha: "2026-11-16", plan, menuTipo: { almuerzo }, despensa, horasLargas: 0, dia: 0 });
    expect(m.comidas.some((c) => c.momento === "pre_entreno" || c.momento === "durante")).toBe(false);
    expect(m.comidas.find((c) => c.momento === "almuerzo")!.items.find((i) => i.nombre.startsWith("Arroz"))!.nombre).toBe("Arroz integral cocido");
  });
});
