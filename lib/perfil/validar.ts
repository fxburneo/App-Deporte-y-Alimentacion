// Validación del formulario de perfil. Pura y con pruebas: si un dato no
// tiene sentido, se avisa en palabras simples en vez de que la base de
// datos lo rechace con un mensaje técnico.
import type { Ritmo } from "@/lib/nutricion/motor";

export interface PerfilEntrada {
  fecha_nacimiento: string;
  estatura_cm: number;
  grasa_pct: number | null;
  objetivo_min_kg: number;
  objetivo_max_kg: number;
  ritmo: Ritmo;
  no_incluir: string[];
  horarios_comida: Record<string, string>;
  entreno_semana: string;
  entreno_finde: string;
  dias_pesaje: number[];
}

const num = (v: FormDataEntryValue | null) => {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const COMIDAS = ["desayuno", "media_manana", "almuerzo", "media_tarde", "cena"];

export function leerPerfilForm(
  fd: FormData,
  hoy: string
): { ok: true; perfil: PerfilEntrada; pesoKg: number | null } | { ok: false; error: string } {
  const nacimiento = String(fd.get("fecha_nacimiento") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nacimiento) || nacimiento >= hoy || nacimiento < "1920-01-01") {
    return { ok: false, error: "Revisa la fecha de nacimiento." };
  }
  const estatura = num(fd.get("estatura_cm"));
  if (estatura == null || isNaN(estatura) || estatura < 120 || estatura > 230) {
    return { ok: false, error: "La estatura va en centímetros, entre 120 y 230." };
  }
  const peso = num(fd.get("peso_kg"));
  if (peso != null && (isNaN(peso) || peso < 30 || peso > 250)) {
    return { ok: false, error: "El peso va en kilos, entre 30 y 250." };
  }
  const grasa = num(fd.get("grasa_pct"));
  if (grasa != null && (isNaN(grasa) || grasa < 3 || grasa > 60)) {
    return { ok: false, error: "El % de grasa debe estar entre 3 y 60, o déjalo vacío." };
  }
  const min = num(fd.get("objetivo_min_kg"));
  const max = num(fd.get("objetivo_max_kg"));
  if (min == null || max == null || isNaN(min) || isNaN(max) || min < 30 || max > 250 || min > max) {
    return { ok: false, error: "Revisa el peso objetivo: el mínimo no puede ser mayor que el máximo." };
  }
  const ritmo = String(fd.get("ritmo") ?? "moderado");
  if (!["moderado", "recomponer", "mantener"].includes(ritmo)) {
    return { ok: false, error: "Elige un ritmo." };
  }
  const horarios: Record<string, string> = {};
  for (const c of COMIDAS) {
    const h = String(fd.get(`hora_${c}`) ?? "");
    if (!HORA.test(h)) return { ok: false, error: "Revisa las horas de comida (formato 06:45)." };
    horarios[c] = h;
  }
  const entrenoSemana = String(fd.get("entreno_semana") ?? "");
  const entrenoFinde = String(fd.get("entreno_finde") ?? "");
  if (!HORA.test(entrenoSemana) || !HORA.test(entrenoFinde)) {
    return { ok: false, error: "Revisa las horas de entreno (formato 05:00)." };
  }
  const dias = fd
    .getAll("dias_pesaje")
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  const noIncluir = Array.from(
    new Set(fd.getAll("no_incluir").map((x) => String(x).trim()).filter((x) => x.length > 0 && x.length <= 40))
  );
  return {
    ok: true,
    pesoKg: peso,
    perfil: {
      fecha_nacimiento: nacimiento,
      estatura_cm: estatura,
      grasa_pct: grasa,
      objetivo_min_kg: min,
      objetivo_max_kg: max,
      ritmo: ritmo as Ritmo,
      no_incluir: noIncluir,
      horarios_comida: horarios,
      entreno_semana: entrenoSemana,
      entreno_finde: entrenoFinde,
      dias_pesaje: Array.from(new Set(dias)).sort(),
    },
  };
}

// Rango de peso sugerido: IMC 22 a 22,3 (un kilo de ancho), redondeado.
export function objetivoSugerido(estaturaCm: number): [number, number] {
  const m = estaturaCm / 100;
  const min = Math.round(22 * m * m);
  return [min, min + 1];
}
