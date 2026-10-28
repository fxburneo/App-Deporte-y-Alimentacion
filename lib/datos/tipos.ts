// Filas tal como vienen de Supabase y su conversión a los tipos del motor.
import type { Comida, Deporte, Entreno, EstadoEntreno, Intensidad, PerfilMotor, Ritmo } from "@/lib/nutricion/motor";
import { edadEnAnios } from "@/lib/perfil/edad";

export interface PerfilFila {
  user_id: string;
  nombre: string;
  fecha_nacimiento: string;
  estatura_cm: number;
  grasa_pct: number | null;
  objetivo_min_kg: number;
  objetivo_max_kg: number;
  ritmo: Ritmo;
  ciudad: string;
  altitud_m: number;
  no_incluir: string[];
  horarios_comida: Record<Comida, string>;
  entreno_semana: string;
  entreno_finde: string;
  dias_pesaje: number[];
  factor_actividad: number;
  pausa: boolean;
  pausa_desde: string | null;
  garmin_llave_vence?: string | null;
}

export interface SincronizacionFila {
  inicio: string;
  fin: string | null;
  ok: boolean | null;
  registros: number | null;
  detalle: string | null;
}

export interface EntrenoFila {
  id: number;
  fecha: string;
  hora: string | null;
  estado: EstadoEntreno;
  deporte: Deporte;
  duracion_min: number;
  intensidad: Intensidad;
  kcal: number | null;
  origen: string;
  nombre?: string | null;
  carga?: number | null;
}

export interface AlimentoRegistrado {
  nombre: string;
  detalle: string;
  gramos: number;
  medida_casera: string;
  carbo_g: number;
  proteina_g: number;
  grasa_g: number;
}

export interface ComidaFila {
  id: number;
  fecha: string;
  comida: Comida;
  origen: "foto" | "texto" | "repetida";
  descripcion: string | null;
  alimentos: AlimentoRegistrado[];
  carbo_g: number;
  proteina_g: number;
  grasa_g: number;
  kcal: number;
  creado_en: string;
}

export interface PesoFila {
  id: number;
  fecha: string;
  kg: number;
  origen: "manual" | "garmin";
}

export function aPerfilMotor(p: PerfilFila, hoy: Date = new Date()): PerfilMotor {
  return {
    estaturaCm: Number(p.estatura_cm),
    edad: edadEnAnios(p.fecha_nacimiento, hoy),
    grasaPct: p.grasa_pct == null ? null : Number(p.grasa_pct),
    ritmo: p.ritmo,
    factorActividad: Number(p.factor_actividad),
    pausa: p.pausa,
    horaDesayuno: p.horarios_comida.desayuno,
  };
}

export function aEntreno(e: EntrenoFila): Entreno {
  return {
    deporte: e.deporte,
    duracionMin: e.duracion_min,
    intensidad: e.intensidad,
    estado: e.estado,
    kcal: e.kcal,
    hora: e.hora ? e.hora.slice(0, 5) : null,
  };
}

export const NOMBRE_DEPORTE: Record<Deporte, string> = {
  rodillo: "Rodillo",
  ruta_mtb: "Ruta / MTB",
  trail_correr: "Trail / correr",
  fuerza: "Fuerza",
  descanso: "Descanso",
};

export const NOMBRE_COMIDA: Record<Comida, string> = {
  desayuno: "Desayuno",
  media_manana: "Media mañana",
  almuerzo: "Almuerzo",
  media_tarde: "Media tarde",
  cena: "Cena",
};
