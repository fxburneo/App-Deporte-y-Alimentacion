// Lectura y validación del formulario de carrera (pantalla 4b.2). Función
// pura para poder probarla sin servidor.
import type { DeporteCarrera, Prioridad } from "@/lib/nutricion/carrera";

export interface CarreraNueva {
  nombre: string;
  fecha: string;
  deporte: DeporteCarrera;
  distancia_km: number | null;
  desnivel_m: number | null;
  horas_min: number;
  horas_max: number;
  prioridad: Prioridad;
}

const DEPORTES: DeporteCarrera[] = ["trail", "ciclismo", "aventura"];

export function leerCarreraForm(fd: FormData, hoy: string): { ok: true; carrera: CarreraNueva } | { ok: false; error: string } {
  const nombre = String(fd.get("nombre") ?? "").trim().slice(0, 80);
  const fecha = String(fd.get("fecha") ?? "");
  const deporte = String(fd.get("deporte") ?? "trail") as DeporteCarrera;
  const prioridad = String(fd.get("prioridad") ?? "A") === "B" ? "B" : "A";
  const num = (k: string) => {
    const v = String(fd.get(k) ?? "").replace(",", ".").trim();
    return v === "" ? null : Number(v);
  };
  const distancia = num("distancia_km");
  const desnivel = num("desnivel_m");
  const hMin = num("horas_min");
  const hMax = num("horas_max");

  if (!nombre) return { ok: false, error: "Ponle un nombre a la carrera." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) return { ok: false, error: "Elige la fecha de la carrera." };
  if (fecha < hoy) return { ok: false, error: "La fecha ya pasó." };
  if (!DEPORTES.includes(deporte)) return { ok: false, error: "Elige el deporte." };
  if (hMin == null || hMax == null || !(hMin >= 0.5 && hMax <= 72 && hMin <= hMax)) return { ok: false, error: "Revisa las horas estimadas." };
  if (distancia != null && !(distancia >= 1 && distancia <= 1000)) return { ok: false, error: "Revisa la distancia." };
  if (desnivel != null && !(Number.isInteger(desnivel) && desnivel >= 0 && desnivel <= 30000)) return { ok: false, error: "Revisa el desnivel." };
  return { ok: true, carrera: { nombre, fecha, deporte, distancia_km: distancia, desnivel_m: desnivel, horas_min: hMin, horas_max: hMax, prioridad } };
}
