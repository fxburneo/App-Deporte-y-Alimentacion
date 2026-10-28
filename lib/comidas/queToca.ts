// Qué comida toca registrar según la hora: la última cuya hora ya llegó (o
// llega en menos de 1 h) y todavía no tiene registro; si no hay, la primera
// sin registro.
import { COMIDAS, type Comida } from "@/lib/nutricion/motor";

const aMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

export function comidaQueToca(horarios: Record<Comida, string>, ahora: string, registradas: Set<Comida>): Comida {
  const pendientes = COMIDAS.filter((c) => !registradas.has(c));
  const llegadas = pendientes.filter((c) => aMin(horarios[c]) <= aMin(ahora) + 60);
  return llegadas.at(-1) ?? pendientes[0] ?? "cena";
}
