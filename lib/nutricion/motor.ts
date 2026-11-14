// Motor de nutrición: calcula el objetivo del día (calorías y macros) a
// partir del perfil, el peso y los entrenos. Son funciones puras: no leen la
// base de datos, así se pueden probar con números conocidos.
//
// Principio: "comer para el trabajo que vas a hacer". La proteína es fija,
// el carbohidrato sube y baja según el tipo de día, y la grasa completa lo
// que falta dentro de un rango sano. El déficit para bajar de peso se aplica
// sobre todo en días suaves y casi nada en días duros.
import type { ModoCarrera } from "./carrera";

export type Deporte = "rodillo" | "ruta_mtb" | "trail_correr" | "fuerza" | "descanso";
export type Intensidad = "suave" | "moderado" | "fuerte";
export type EstadoEntreno = "planificado" | "hecho";
export type TipoDia = "descanso" | "suave" | "moderado" | "duro" | "muy_largo";
export type Ritmo = "moderado" | "recomponer" | "mantener";

export interface Entreno {
  deporte: Deporte;
  duracionMin: number;
  intensidad: Intensidad;
  estado: EstadoEntreno;
  kcal?: number | null;
  hora?: string | null; // "HH:MM"
}

export interface PerfilMotor {
  estaturaCm: number;
  edad: number;
  grasaPct?: number | null;
  ritmo: Ritmo;
  factorActividad: number;
  pausa: boolean;
  horaDesayuno: string; // "HH:MM"
  deficitDescanso?: number | null; // kcal de déficit en día de descanso elegido por Francisco (null = 450)
}

export interface ObjetivoDia {
  tipo: TipoDia;
  kcal: number;
  carboG: number;
  proteinaG: number;
  grasaG: number;
  reposoKcal: number;
  entrenoKcal: number;
  gastoKcal: number;
  deficitKcal: number;
  extraCenaG: number; // carbohidrato extra en la cena porque mañana es día duro
  snackPreEntreno: boolean; // entreno exigente antes del desayuno
  vispera: boolean; // mañana es fondo de más de 3 h: hoy sin déficit y carbohidrato moderado
  carrera: ModoCarrera | null; // semanas sin déficit, día de carga o día de carrera
}

// Plan de la nutricionista (planilla del 19-25 abr, adoptada el 11-nov):
// gasto = reposo + 500 kcal de actividad diaria + entreno; objetivo = gasto
// menos un déficit por tipo de día; proteína 2,3 g/kg y grasa 0,8 g/kg fijas;
// el carbohidrato es lo que queda.
export const NEAT_KCAL = 500;
const DEFICIT_PLAN: Record<TipoDia, number> = { descanso: 300, suave: 500, moderado: 400, duro: 350, muy_largo: 500 };

// El déficit de descanso se puede subir o bajar en Más: los demás días se
// mueven en la misma proporción de la planilla.
export const DEFICIT_DESCANSO_BASE = 300;
export const DEFICIT_DESCANSO_MAX = 450;
export function deficitDelTipo(tipo: TipoDia, deficitDescanso?: number | null): number {
  const base = Math.min(DEFICIT_DESCANSO_MAX, Math.max(0, deficitDescanso ?? DEFICIT_DESCANSO_BASE));
  return Math.round((DEFICIT_PLAN[tipo] * base) / DEFICIT_DESCANSO_BASE);
}

export const PROTEINA_G_KG = 2.3;
export const GRASA_G_KG = 0.8;
// Piso de seguridad: el carbohidrato no baja de 2 g/kg aunque el déficit lo pida.
const CARBO_PISO_G_KG = 2;
const FACTOR_RITMO: Record<Ritmo, number> = { moderado: 1, recomponer: 0.4, mantener: 0 };

// Equivalente metabólico (MET) por deporte e intensidad, para estimar el
// gasto cuando el reloj no da calorías.
const MET: Record<Exclude<Deporte, "descanso">, Record<Intensidad, number>> = {
  rodillo: { suave: 5.5, moderado: 7.5, fuerte: 10 },
  ruta_mtb: { suave: 6, moderado: 8, fuerte: 10.5 },
  trail_correr: { suave: 7, moderado: 9.5, fuerte: 11.5 },
  fuerza: { suave: 3.5, moderado: 5, fuerte: 6 },
};

// Gasto en reposo. Con % de grasa usa Katch-McArdle (más precisa); sin él,
// Mifflin-St Jeor para hombre.
export function metabolismoReposo(pesoKg: number, estaturaCm: number, edad: number, grasaPct?: number | null): number {
  if (grasaPct != null && grasaPct > 0) {
    const masaMagra = pesoKg * (1 - grasaPct / 100);
    return Math.round(370 + 21.6 * masaMagra);
  }
  return Math.round(10 * pesoKg + 6.25 * estaturaCm - 5 * edad + 5);
}

// Calorías del entreno por encima del reposo. Con potencia (rodillo) el dato
// del reloj es confiable; con solo pulso Garmin sobreestima, se descuenta 15 %.
export function kcalEntreno(e: Entreno, pesoKg: number): number {
  if (e.deporte === "descanso" || e.duracionMin <= 0) return 0;
  if (e.kcal != null && e.kcal > 0) {
    return Math.round(e.deporte === "rodillo" ? e.kcal : e.kcal * 0.85);
  }
  const met = MET[e.deporte][e.intensidad];
  return Math.round((met - 1) * pesoKg * (e.duracionMin / 60));
}

// Lo hecho reemplaza a lo planificado: si ya hay entrenos hechos ese día,
// el plan deja de contar.
export function entrenosQueCuentan(lista: Entreno[]): Entreno[] {
  const hechos = lista.filter((e) => e.estado === "hecho");
  return hechos.length > 0 ? hechos : lista.filter((e) => e.estado === "planificado");
}

export function tipoDia(lista: Entreno[]): TipoDia {
  const aerobicos = entrenosQueCuentan(lista).filter(
    (e) => e.deporte !== "descanso" && e.deporte !== "fuerza" && e.duracionMin > 0
  );
  if (aerobicos.length === 0) return "descanso";
  const total = aerobicos.reduce((s, e) => s + e.duracionMin, 0);
  if (total > 180) return "muy_largo";
  // Planilla de la nutricionista: "intenso" es la sesión fuerte; una salida de
  // 90 min a 3 h sin intensidad fuerte es "salida media" (moderado, −400).
  if (aerobicos.some((e) => e.intensidad === "fuerte")) return "duro";
  if (total >= 90 || aerobicos.some((e) => e.intensidad === "moderado")) return "moderado";
  return "suave";
}

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function objetivoDelDia(args: {
  perfil: PerfilMotor;
  pesoKg: number;
  entrenosHoy: Entreno[];
  entrenosManana?: Entreno[];
  carrera?: { modo: ModoCarrera; cargaGKg: number } | null;
}): ObjetivoDia {
  const { perfil, pesoKg } = args;
  const cuentan = entrenosQueCuentan(args.entrenosHoy);
  const tipo = tipoDia(args.entrenosHoy);

  const reposoKcal = metabolismoReposo(pesoKg, perfil.estaturaCm, perfil.edad, perfil.grasaPct);
  const entrenoKcal = cuentan.reduce((s, e) => s + kcalEntreno(e, pesoKg), 0);
  const gastoKcal = reposoKcal + NEAT_KCAL + entrenoKcal;
  const modoCarrera = args.carrera?.modo ?? null;
  const deficitMeta = perfil.pausa || modoCarrera ? 0 : deficitDelTipo(tipo, perfil.deficitDescanso) * FACTOR_RITMO[perfil.ritmo];
  const kcalMeta = gastoKcal - deficitMeta;

  // Día de carga de carbohidratos antes de una carrera: el carbohidrato se fija
  // en g/kg (7,5 a 9), la proteína baja a 1,6 g/kg y la grasa a 0,7 g/kg para
  // dejar espacio. Sin déficit: es normal un superávit esos días.
  if (modoCarrera === "carga" && args.carrera) {
    const carboG = Math.round(args.carrera.cargaGKg * pesoKg);
    const prot = Math.round(1.6 * pesoKg);
    const grasaG = Math.round(0.7 * pesoKg);
    const kcal = Math.round((prot * 4 + carboG * 4 + grasaG * 9) / 10) * 10;
    return {
      tipo,
      kcal,
      carboG,
      proteinaG: prot,
      grasaG,
      reposoKcal,
      entrenoKcal,
      gastoKcal,
      deficitKcal: Math.max(0, gastoKcal - kcal),
      extraCenaG: 0,
      snackPreEntreno: false,
      vispera: false,
      carrera: "carga",
    };
  }

  // Proteína y grasa fijas; el carbohidrato completa las calorías.
  const proteinaG = Math.round(PROTEINA_G_KG * pesoKg);
  const grasaG = Math.round(GRASA_G_KG * pesoKg);
  const carboG = Math.round(Math.max(CARBO_PISO_G_KG * pesoKg, (kcalMeta - proteinaG * 4 - grasaG * 9) / 4));
  const kcal = Math.round((proteinaG * 4 + carboG * 4 + grasaG * 9) / 10) * 10;

  const snackPreEntreno = cuentan.some(
    (e) =>
      e.hora != null &&
      aMinutos(e.hora) < aMinutos(perfil.horaDesayuno) &&
      e.deporte !== "descanso" &&
      (e.intensidad !== "suave" || e.duracionMin > 75)
  );

  return {
    tipo,
    kcal,
    carboG,
    proteinaG,
    grasaG,
    reposoKcal,
    entrenoKcal,
    gastoKcal,
    deficitKcal: Math.max(0, gastoKcal - kcal),
    extraCenaG: 0, // la planilla no usa cena extra ni víspera
    snackPreEntreno,
    vispera: false,
    carrera: modoCarrera,
  };
}

export type Comida = "desayuno" | "media_manana" | "almuerzo" | "media_tarde" | "cena";
export const COMIDAS: Comida[] = ["desayuno", "media_manana", "almuerzo", "media_tarde", "cena"];

// Momentos que se pueden registrar además de las 5 comidas: el snack antes de
// entrenar (su objetivo sale del desayuno) y los extras fuera de horario (sin
// objetivo: se compensan en las comidas que faltan).
export type Momento = Comida | "pre_entreno" | "durante" | "extra";
export const MOMENTOS: Momento[] = ["pre_entreno", "durante", ...COMIDAS, "extra"];
export const SNACK_PRE_G = 25;
// Antes de una salida de 2 h o más temprano (planilla, "pre entreno 2"): sale del desayuno.
export const SNACK_PRE_LARGO = { carboG: 84, proteinaG: 23, grasaG: 15 };

// Comida durante el entreno (geles, bebida, barras): en entrenos aeróbicos de
// 90 min o más, 60 g de carbohidrato por hora (decisión de Francisco, 7-nov).
// Sale del total del día: las comidas se reparten lo que queda.
export const DURANTE_MIN = 90;
export const DURANTE_G_HORA = 60;
export function carboDurante(entrenos: Entreno[]): number {
  const largos = entrenosQueCuentan(entrenos).filter(
    (e) => e.deporte !== "descanso" && e.deporte !== "fuerza" && e.duracionMin >= DURANTE_MIN
  );
  return Math.round(largos.reduce((s, e) => s + (DURANTE_G_HORA * e.duracionMin) / 60, 0));
}

// Reparto de la planilla de la nutricionista (día alto en carbohidrato):
// proteína 38 · 15 · 75 · 8 · 55 g y grasa 16 · 11 · 9 · 10 · 6 g, en proporción.
const PROTEINA_COMIDA: Record<Comida, number> = { desayuno: 38 / 191, media_manana: 15 / 191, almuerzo: 75 / 191, media_tarde: 8 / 191, cena: 55 / 191 };
const GRASA_COMIDA: Record<Comida, number> = { desayuno: 16 / 52, media_manana: 11 / 52, almuerzo: 9 / 52, media_tarde: 10 / 52, cena: 6 / 52 };

// Reparto del objetivo entre las 5 comidas. Si se entrena antes del
// desayuno, el desayuno es la comida de recuperación y lleva más carbohidrato.
export function repartirComidas(
  objetivo: ObjetivoDia,
  entrenoTemprano: boolean
): Record<Comida, { carboG: number; proteinaG: number; grasaG: number }> {
  const pesos: Record<Comida, number> = entrenoTemprano
    ? { desayuno: 0.3, media_manana: 0.15, almuerzo: 0.25, media_tarde: 0.1, cena: 0.2 }
    : { desayuno: 0.2, media_manana: 0.15, almuerzo: 0.3, media_tarde: 0.15, cena: 0.2 };
  const base = objetivo.carboG - objetivo.extraCenaG;
  const r = {} as Record<Comida, { carboG: number; proteinaG: number; grasaG: number }>;
  for (const c of COMIDAS) {
    r[c] = {
      carboG: Math.round(base * pesos[c]) + (c === "cena" ? objetivo.extraCenaG : 0),
      proteinaG: Math.round(objetivo.proteinaG * PROTEINA_COMIDA[c]),
      grasaG: Math.round(objetivo.grasaG * GRASA_COMIDA[c]),
    };
  }
  return r;
}

// Peso de referencia: promedio de los pesajes de los últimos 7 días; si no
// hay, el último registrado.
export function pesoReferencia(pesajes: { fecha: string; kg: number }[], hoy: string): number | null {
  if (pesajes.length === 0) return null;
  const limite = new Date(hoy + "T00:00:00Z").getTime() - 6 * 86400000;
  const recientes = pesajes.filter((p) => new Date(p.fecha + "T00:00:00Z").getTime() >= limite);
  const usar = recientes.length > 0 ? recientes : [[...pesajes].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]];
  const prom = usar.reduce((s, p) => s + p.kg, 0) / usar.length;
  return Math.round(prom * 10) / 10;
}

export const NOMBRE_TIPO: Record<TipoDia, string> = {
  descanso: "Día de descanso",
  suave: "Día suave",
  moderado: "Día moderado",
  duro: "Día duro",
  muy_largo: "Día muy largo",
};
