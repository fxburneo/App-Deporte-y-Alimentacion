// Validación del formulario de entreno manual (maqueta 2.2).
import type { Deporte, EstadoEntreno, Intensidad } from "@/lib/nutricion/motor";

export interface EntrenoEntrada {
  fecha: string;
  hora: string | null;
  estado: EstadoEntreno;
  deporte: Deporte;
  duracion_min: number;
  intensidad: Intensidad;
  kcal: number | null;
}

const DEPORTES = ["rodillo", "ruta_mtb", "trail_correr", "fuerza", "descanso"];
const INTENSIDADES = ["suave", "moderado", "fuerte"];

export function leerEntrenoForm(
  fd: FormData,
  hoy: string,
  manana: string
): { ok: true; entreno: EntrenoEntrada } | { ok: false; error: string } {
  const dia = String(fd.get("dia") ?? "hoy");
  const estado = String(fd.get("estado") ?? "planificado");
  if (estado !== "planificado" && estado !== "hecho") return { ok: false, error: "Elige si es plan o real." };
  if (estado === "hecho" && dia === "manana") return { ok: false, error: "Un entreno de mañana todavía no puede estar hecho." };
  const deporte = String(fd.get("deporte") ?? "");
  if (!DEPORTES.includes(deporte)) return { ok: false, error: "Elige un deporte." };
  const intensidad = String(fd.get("intensidad") ?? "suave");
  if (!INTENSIDADES.includes(intensidad)) return { ok: false, error: "Elige la intensidad." };
  const duracion = deporte === "descanso" ? 0 : Number(fd.get("duracion_min"));
  if (!Number.isInteger(duracion) || duracion < 0 || duracion > 900 || (deporte !== "descanso" && duracion === 0)) {
    return { ok: false, error: "La duración debe ser mayor a cero." };
  }
  const horaTxt = String(fd.get("hora") ?? "").trim();
  if (horaTxt && !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaTxt)) return { ok: false, error: "Revisa la hora (formato 05:00)." };
  const kcalTxt = String(fd.get("kcal") ?? "").trim();
  const kcal = kcalTxt ? Number(kcalTxt) : null;
  if (kcal != null && (!Number.isInteger(kcal) || kcal < 0 || kcal > 10000)) {
    return { ok: false, error: "Las calorías van como número entero, o déjalas vacías." };
  }
  return {
    ok: true,
    entreno: {
      fecha: dia === "manana" ? manana : hoy,
      hora: horaTxt || null,
      estado: estado as EstadoEntreno,
      deporte: deporte as Deporte,
      duracion_min: duracion,
      intensidad: intensidad as Intensidad,
      kcal: estado === "hecho" ? kcal : null,
    },
  };
}
