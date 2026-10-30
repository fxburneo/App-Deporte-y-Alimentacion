// Motor de nutrición: calcula el objetivo del día (calorías y macros) a
// partir del perfil, el peso y los entrenos. Son funciones puras: no leen la
// base de datos, así se pueden probar con números conocidos.
//
// Principio: "comer para el trabajo que vas a hacer". La proteína es fija,
// el carbohidrato sube y baja según el tipo de día, y la grasa completa lo
// que falta dentro de un rango sano. El déficit para bajar de peso se aplica
// sobre todo en días suaves y casi nada en días duros.

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
}

// Rango de carbohidrato (g/kg) y déficit (kcal) por tipo de día. Rangos de
// las guías del ACSM e ISSN, ajustados a la baja porque el objetivo incluye
// perder grasa (blueprint, sección 04).
export const NIVELES: Record<TipoDia, { carbo: [number, number]; deficit: number }> = {
  descanso: { carbo: [2.5, 3.5], deficit: 450 },
  suave: { carbo: [3.5, 4.5], deficit: 350 },
  moderado: { carbo: [5, 6], deficit: 250 },
  duro: { carbo: [6, 8], deficit: 75 },
  muy_largo: { carbo: [8, 10], deficit: 0 },
};

// El déficit del día sale del déficit de descanso elegido, en la misma
// proporción de la tabla: suave 78 %, moderado 56 %, duro 17 %, muy largo 0.
export const DEFICIT_DESCANSO_BASE = 450;
export const DEFICIT_DESCANSO_MAX = 750;
const PROPORCION_DEFICIT: Record<TipoDia, number> = Object.fromEntries(
  (Object.keys(NIVELES) as TipoDia[]).map((t) => [t, NIVELES[t].deficit / DEFICIT_DESCANSO_BASE])
) as Record<TipoDia, number>;

export function deficitDelTipo(tipo: TipoDia, deficitDescanso?: number | null): number {
  const base = Math.min(DEFICIT_DESCANSO_MAX, Math.max(0, deficitDescanso ?? DEFICIT_DESCANSO_BASE));
  return Math.round(base * PROPORCION_DEFICIT[tipo]);
}

// Piso de seguridad del carbohidrato (g/kg): si para cumplir el déficit el
// carbohidrato tiene que bajar del rango, baja hasta aquí y no más
// (decisión de Francisco, 30-oct: el déficit manda sobre el rango).
const CARBO_PISO: Record<TipoDia, number> = { descanso: 2, suave: 3, moderado: 4, duro: 5.5, muy_largo: 7 };
const PROTEINA_G_KG = 2.0;
const GRASA_MIN_G_KG = 0.6;
const GRASA_MAX_G_KG = 1.0;
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
  if (total >= 120 || aerobicos.some((e) => e.intensidad === "fuerte")) return "duro";
  // Una hora suave es "liviano" (ACSM 3-5 g/kg): moderado desde 90 min o con intensidad moderada.
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
}): ObjetivoDia {
  const { perfil, pesoKg } = args;
  const cuentan = entrenosQueCuentan(args.entrenosHoy);
  const tipo = tipoDia(args.entrenosHoy);
  const tipoManana = tipoDia(args.entrenosManana ?? []);

  const reposoKcal = metabolismoReposo(pesoKg, perfil.estaturaCm, perfil.edad, perfil.grasaPct);
  const entrenoKcal = cuentan.reduce((s, e) => s + kcalEntreno(e, pesoKg), 0);
  const gastoKcal = Math.round(reposoKcal * perfil.factorActividad) + entrenoKcal;
  // Víspera de un fondo de más de 3 h: hoy no hay déficit y el carbohidrato
  // sube al menos a nivel moderado, para llegar con el músculo lleno.
  const vispera = tipoManana === "muy_largo" && tipo !== "duro" && tipo !== "muy_largo";
  const deficitMeta = perfil.pausa || vispera ? 0 : deficitDelTipo(tipo, perfil.deficitDescanso) * FACTOR_RITMO[perfil.ritmo];
  const kcalMeta = gastoKcal - deficitMeta;

  const proteinaG = Math.round(PROTEINA_G_KG * pesoKg);
  const nivelCarbo = vispera && (tipo === "descanso" || tipo === "suave") ? "moderado" : tipo;
  const [carboMin, carboMax] = NIVELES[nivelCarbo].carbo.map((x) => x * pesoKg);
  const grasaMin = GRASA_MIN_G_KG * pesoKg;
  const grasaMax = GRASA_MAX_G_KG * pesoKg;

  // Mañana duro y hoy no: la cena sube un nivel (+0,5 g/kg de carbohidrato).
  const mananaExigente = tipoManana === "duro" || tipoManana === "muy_largo";
  const hoyExigente = tipo === "duro" || tipo === "muy_largo";
  const extraCenaG = mananaExigente && !hoyExigente ? Math.round(0.5 * pesoKg) : 0;

  // Carbohidrato al medio del rango; la grasa completa las calorías. Si la
  // grasa se sale de su rango, se fija en el borde y el carbohidrato se
  // ajusta sin salir del suyo.
  let carbo = (carboMin + carboMax) / 2;
  let grasa = (kcalMeta - proteinaG * 4 - carbo * 4) / 9;
  if (grasa < grasaMin) {
    grasa = grasaMin;
    // En la víspera el carbohidrato no baja del rango aunque quede un pequeño superávit.
    const piso = vispera ? carboMin : CARBO_PISO[nivelCarbo] * pesoKg;
    carbo = Math.max(piso, (kcalMeta - proteinaG * 4 - grasa * 9) / 4);
  } else if (grasa > grasaMax) {
    grasa = grasaMax;
    carbo = Math.min(carboMax, (kcalMeta - proteinaG * 4 - grasa * 9) / 4);
  }
  const carboG = Math.round(carbo) + extraCenaG;
  const grasaG = Math.round(grasa);
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
    extraCenaG,
    snackPreEntreno,
    vispera,
  };
}

export type Comida = "desayuno" | "media_manana" | "almuerzo" | "media_tarde" | "cena";
export const COMIDAS: Comida[] = ["desayuno", "media_manana", "almuerzo", "media_tarde", "cena"];

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
      proteinaG: Math.round(objetivo.proteinaG / 5),
      grasaG: Math.round(objetivo.grasaG / 5),
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
