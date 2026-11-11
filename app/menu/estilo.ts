// Etiquetas de tipo de día para el menú semanal (maqueta 2d).
import type { TipoDia } from "@/lib/nutricion/motor";

export const TIPO_MENU: Record<TipoDia, { nombre: string; color: string }> = {
  descanso: { nombre: "Descanso", color: "#9AA4AD" },
  suave: { nombre: "Z2", color: "#4C9DFF" },
  moderado: { nombre: "Medio", color: "#FFB020" },
  duro: { nombre: "Intenso", color: "#FF6A1A" },
  muy_largo: { nombre: "Largo", color: "#FF5A5F" },
};
