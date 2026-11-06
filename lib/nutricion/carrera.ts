// Carreras: fases hacia la carrera, días de carga de carbohidratos y plan del
// día de carrera. Funciones puras (sin base de datos), con pruebas.
//
// La duración estimada decide el tipo de carga (blueprint y CONTEXTO, 30-oct):
// - menos de 3 h: sin carga especial.
// - 3 a 5 h ("corta"): 1 día a 7-8 g/kg.
// - 5 a 12 h ("larga"): 2 días a 8-10 g/kg.
// - más de 12 h ("ultra"): 2 días a 7-8 g/kg y plan horario por calorías.
// Carrera A (objetivo): además, 3 semanas sin déficit, test de sudoración y
// ensayo de la alimentación en los fondos largos.
import { sumarDias } from "@/lib/fecha";
import type { Deporte } from "./motor";

export type DeporteCarrera = "trail" | "ciclismo" | "aventura";
export type Prioridad = "A" | "B";
export type TipoCarga = "ninguna" | "corta" | "larga" | "ultra";

export interface Carrera {
  id?: number;
  nombre: string;
  fecha: string; // "AAAA-MM-DD"
  deporte: DeporteCarrera;
  horasMin: number;
  horasMax: number;
  prioridad: Prioridad;
}

export const NOMBRE_DEPORTE_CARRERA: Record<DeporteCarrera, string> = { trail: "Trail", ciclismo: "Ciclismo", aventura: "Aventura" };

export const horasEstimadas = (c: Pick<Carrera, "horasMin" | "horasMax">) => (c.horasMin + c.horasMax) / 2;

export function tipoCarga(horas: number): TipoCarga {
  if (horas < 3) return "ninguna";
  if (horas <= 5) return "corta";
  if (horas <= 12) return "larga";
  return "ultra";
}

// Gramos de carbohidrato por kilo en los días de carga.
const CARGA_G_KG: Record<TipoCarga, number> = { ninguna: 0, corta: 7.5, larga: 9, ultra: 7.5 };
// Carbohidrato por hora en carrera. 70 g/h es lo que Francisco ya tolera.
const CARBO_HORA: Record<TipoCarga, number> = { ninguna: 40, corta: 60, larga: 70, ultra: 60 };
export const LIQUIDO_ML_HORA = 600; // hasta tener el test de sudoración
export const SODIO_MG_HORA = 700; // punto medio del rango 500-1.000 mg/h

const SEMANA = 7;

export interface Fases {
  tipo: TipoCarga;
  sinDeficitDesde: string | null; // carrera A: 3 semanas antes
  sudoracionHasta: string | null; // carrera A: test antes de los fondos largos
  ensayoDesde: string | null; // carrera A: comer como en carrera en los fondos
  carga: string[]; // días de carga
}

export function fasesCarrera(c: Carrera): Fases {
  const tipo = tipoCarga(horasEstimadas(c));
  const dias = tipo === "ninguna" ? 0 : tipo === "corta" ? 1 : 2;
  const carga = Array.from({ length: dias }, (_, i) => sumarDias(c.fecha, i - dias));
  const esA = c.prioridad === "A" && tipo !== "ninguna";
  return {
    tipo,
    sinDeficitDesde: esA ? sumarDias(c.fecha, -3 * SEMANA) : null,
    sudoracionHasta: esA ? sumarDias(c.fecha, -12 * SEMANA) : null,
    ensayoDesde: esA ? sumarDias(c.fecha, -8 * SEMANA) : null,
    carga,
  };
}

export type ModoCarrera = "sin_deficit" | "carga" | "carrera";

export interface CarreraDelDia {
  carrera: Carrera;
  modo: ModoCarrera;
  diasFaltan: number;
  cargaGKg: number;
  diaCarga: number; // 1 o 2 en días de carga (0 si no)
  diasCarga: number;
}

const diasEntre = (a: string, b: string) => Math.round((new Date(b + "T12:00:00Z").getTime() - new Date(a + "T12:00:00Z").getTime()) / 86400000);

// Qué significa la fecha para la nutrición, mirando la carrera más cercana
// que todavía no pasó. La carga manda sobre "sin déficit".
export function carreraDelDia(fecha: string, carreras: Carrera[]): CarreraDelDia | null {
  const proximas = carreras.filter((c) => c.fecha >= fecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
  for (const c of proximas) {
    const f = fasesCarrera(c);
    const base = { carrera: c, diasFaltan: diasEntre(fecha, c.fecha), cargaGKg: CARGA_G_KG[f.tipo], diaCarga: 0, diasCarga: f.carga.length };
    if (c.fecha === fecha) return { ...base, modo: "carrera" };
    const i = f.carga.indexOf(fecha);
    if (i >= 0) return { ...base, modo: "carga", diaCarga: i + 1 };
    if (f.sinDeficitDesde && fecha >= f.sinDeficitDesde) return { ...base, modo: "sin_deficit" };
  }
  return null;
}

// La carrera como entreno del día, si TrainingPeaks no la trae: así el motor
// sabe que es un día muy largo y la víspera se prepara.
export function entrenoDeCarrera(c: Carrera): { deporte: Deporte; duracionMin: number; intensidad: "moderado"; estado: "planificado"; hora: null } {
  return {
    deporte: c.deporte === "ciclismo" ? "ruta_mtb" : "trail_correr",
    duracionMin: Math.round(horasEstimadas(c) * 60),
    intensidad: "moderado",
    estado: "planificado",
    hora: null,
  };
}

export interface BloquePlan {
  desde: number; // hora de carrera, desde 1
  hasta: number;
  carboHora: number;
  que: string;
}

export interface PlanCarrera {
  horas: number;
  tipo: TipoCarga;
  carboHora: number;
  carboTotal: number;
  liquidoTotalL: number;
  sodioTotalG: number;
  desayunoG: number;
  bloques: BloquePlan[];
}

// Plan del día de carrera: desayuno 3 h antes (1,5 g/kg) y comida por horas.
// Los primeros tramos con bebida y geles; desde la hora 3, sólidos; al final,
// lo que mejor se tolere, con cafeína.
export function planCarrera(c: Carrera, pesoKg: number): PlanCarrera {
  const horas = horasEstimadas(c);
  const tipo = tipoCarga(horas);
  const carboHora = CARBO_HORA[tipo];
  const h = Math.ceil(horas);
  const bloques: BloquePlan[] = [];
  bloques.push({ desde: 1, hasta: Math.min(2, h), carboHora, que: "Bebida isotónica 500 ml + 1 gel + ½ barra" });
  if (h > 2) {
    const finSolidos = h > 6 ? Math.max(3, h - 3) : h;
    bloques.push({ desde: 3, hasta: finSolidos, carboHora, que: "Sólidos: papa con sal o sánduche de mermelada + bebida + gel" });
    if (finSolidos < h) bloques.push({ desde: finSolidos + 1, hasta: h, carboHora, que: "Lo que mejor toleres: gel, bebida, gomitas. Cafeína al empezar este tramo" });
  }
  return {
    horas,
    tipo,
    carboHora,
    carboTotal: Math.round(carboHora * horas),
    liquidoTotalL: Math.round((LIQUIDO_ML_HORA * horas) / 100) / 10,
    sodioTotalG: Math.round((SODIO_MG_HORA * horas) / 100) / 10,
    desayunoG: Math.round((1.5 * pesoKg) / 5) * 5,
    bloques,
  };
}
