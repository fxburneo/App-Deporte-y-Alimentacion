// Tendencia del peso: recta de mejor ajuste sobre los pesajes de las
// últimas 4 semanas. Un pesaje suelto varía ±1 kg por agua y glucógeno;
// la tendencia es lo que importa.
import { sumarDias } from "@/lib/fecha";

const DIA_MS = 86400000;
const t = (fecha: string) => new Date(fecha + "T00:00:00Z").getTime() / DIA_MS;

export interface Proyeccion {
  kgPorSemana: number;
  fechaObjetivo: string | null; // cuándo llegaría al tope del rango objetivo
}

export function proyeccionPeso(
  pesajes: { fecha: string; kg: number }[],
  objetivoMaxKg: number,
  hoy: string
): Proyeccion | null {
  const desde = t(sumarDias(hoy, -28));
  const datos = pesajes.filter((p) => t(p.fecha) >= desde);
  if (datos.length < 4) return null;
  const xs = datos.map((p) => t(p.fecha));
  if (Math.max(...xs) - Math.min(...xs) < 10) return null;

  const n = datos.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = datos.reduce((a, p) => a + p.kg, 0) / n;
  let num = 0;
  let den = 0;
  datos.forEach((p, i) => {
    num += (xs[i] - mx) * (p.kg - my);
    den += (xs[i] - mx) ** 2;
  });
  const pendiente = num / den; // kg por día
  const kgPorSemana = Math.round(pendiente * 7 * 100) / 100;

  const pesoHoy = my + pendiente * (t(hoy) - mx);
  let fechaObjetivo: string | null = null;
  if (pesoHoy <= objetivoMaxKg) fechaObjetivo = hoy;
  else if (pendiente < -0.005) fechaObjetivo = sumarDias(hoy, Math.ceil((objetivoMaxKg - pesoHoy) / pendiente));
  return { kgPorSemana, fechaObjetivo };
}
