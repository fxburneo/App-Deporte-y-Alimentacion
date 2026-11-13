// Textos de los avisos (etapa 7). Funciones puras: las usa la Edge Function y
// las prueba Vitest en lib/avisos/mensajes.test.ts. Nunca incluyen datos de
// salud más allá de lo que Francisco ve en su propia pantalla.

export interface EntrenoAviso {
  deporte: string;
  duracion_min: number;
  intensidad: string;
  estado: string;
  hora?: string | null;
  nombre?: string | null;
}
export interface Aviso {
  titulo: string;
  cuerpo: string;
  url: string;
}
export type TipoDia = "descanso" | "suave" | "moderado" | "duro" | "muy_largo";

// Mismas reglas que el motor (lib/nutricion/motor.ts): lo hecho reemplaza al plan.
export function tipoDelDia(lista: EntrenoAviso[]): TipoDia {
  const hechos = lista.filter((e) => e.estado === "hecho");
  const cuentan = (hechos.length ? hechos : lista.filter((e) => e.estado === "planificado")).filter(
    (e) => e.deporte !== "descanso" && e.deporte !== "fuerza" && e.duracion_min > 0
  );
  if (cuentan.length === 0) return "descanso";
  const total = cuentan.reduce((s, e) => s + e.duracion_min, 0);
  if (total > 180) return "muy_largo";
  if (total >= 120 || cuentan.some((e) => e.intensidad === "fuerte")) return "duro";
  if (total >= 90 || cuentan.some((e) => e.intensidad === "moderado")) return "moderado";
  return "suave";
}

export const NOMBRE_TIPO: Record<TipoDia, string> = { descanso: "descanso", suave: "suave", moderado: "medio", duro: "intenso", muy_largo: "largo" };
const DEPORTE: Record<string, string> = { rodillo: "Rodillo", ruta_mtb: "Bici", trail_correr: "Trail", fuerza: "Fuerza" };
const dur = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

export function textoEntrenos(lista: EntrenoAviso[]): string {
  const aer = lista.filter((e) => e.deporte !== "descanso" && e.duracion_min > 0 && e.deporte !== "fuerza");
  return aer.map((e) => `${DEPORTE[e.deporte] ?? e.deporte} ${dur(e.duracion_min)}${e.hora ? ` a las ${e.hora.slice(0, 5)}` : ""}`).join(" + ");
}

// Qué cambia en la comida según el tipo de día (resumen del menú tipo escalado).
const COMIDA_DIA: Record<TipoDia, string> = {
  descanso: "Menos carbohidrato: 1 pan en el desayuno y arroz integral.",
  suave: "Arroz integral y 2 panes en el desayuno.",
  moderado: "Más carbohidrato: arroz blanco y 2 panes.",
  duro: "Más carbohidrato: 1 pan con miel antes de entrenar, arroz blanco y 2 tortillas en la cena.",
  muy_largo: "Carbohidrato alto: arroz blanco y 60 g por hora durante la salida (geles y bebida).",
};

export function avisoManana(fechaManana: string, entrenos: EntrenoAviso[]): Aviso {
  const tipo = tipoDelDia(entrenos);
  const ent = textoEntrenos(entrenos);
  return {
    titulo: `Mañana: día ${NOMBRE_TIPO[tipo]}`,
    cuerpo: `${ent ? ent + ". " : "Sin entreno. "}${COMIDA_DIA[tipo]} Toca para ver el menú.`,
    url: `/menu/${fechaManana}`,
  };
}

export function avisoDormir(entrenosManana: EntrenoAviso[]): Aviso {
  const ent = textoEntrenos(entrenosManana);
  return {
    titulo: "Hora de ir apagando",
    cuerpo: `Acuéstate a las 21:30. ${ent ? `Mañana: ${ent}.` : "Mañana es día de descanso: igual duerme tus horas."}`,
    url: "/",
  };
}

export function avisoPeso(diasPesaje: number[], diaSemana: number, yaPesado: boolean): Aviso | null {
  if (!diasPesaje.includes(diaSemana) || yaPesado) return null;
  return { titulo: "Hoy toca pesaje", cuerpo: "En ayunas, después de ir al baño y antes de desayunar.", url: "/peso" };
}

export function avisoRegistrar(momentosHoy: string[]): Aviso | null {
  if (momentosHoy.includes("almuerzo")) return null;
  const nada = momentosHoy.length === 0;
  return {
    titulo: nada ? "No has registrado comidas hoy" : "¿Ya almorzaste?",
    cuerpo: nada ? "Registra lo que llevas del día para que el plan se ajuste." : "Regístralo para que la tarde y la cena se ajusten.",
    url: nada ? "/registrar" : "/registrar?comida=almuerzo",
  };
}

export interface BienestarAviso {
  sueno_seg: number | null;
  hrv_noche: number | null;
  hrv_base_bajo: number | null;
  fc_reposo: number | null;
}

// HRV bajo su rango o menos de 6 h de sueño: alerta de fatiga.
export function hayFatiga(b: BienestarAviso | null): string | null {
  if (!b) return null;
  const motivos: string[] = [];
  if (b.hrv_noche != null && b.hrv_base_bajo != null && b.hrv_noche < b.hrv_base_bajo) motivos.push(`HRV ${b.hrv_noche}, bajo tu rango`);
  if (b.sueno_seg != null && b.sueno_seg < 6 * 3600) motivos.push(`dormiste ${(b.sueno_seg / 3600).toFixed(1).replace(".", ",")} h`);
  return motivos.length ? motivos.join(" y ") : null;
}

export function avisoResumen(b: BienestarAviso | null, entrenosHoy: EntrenoAviso[]): Aviso {
  const tipo = tipoDelDia(entrenosHoy);
  const ent = textoEntrenos(entrenosHoy);
  const sueno = b?.sueno_seg != null ? `Dormiste ${(b.sueno_seg / 3600).toFixed(1).replace(".", ",")} h` : "Sin datos de sueño todavía";
  const hrv = b?.hrv_noche != null ? ` · HRV ${b.hrv_noche}` : "";
  return { titulo: `Hoy: día ${NOMBRE_TIPO[tipo]}`, cuerpo: `${sueno}${hrv}. ${ent ? ent + ". " : ""}${COMIDA_DIA[tipo]}`, url: "/" };
}

export function avisoFatiga(motivo: string): Aviso {
  return { titulo: "Ojo con la fatiga", cuerpo: `${motivo[0].toUpperCase()}${motivo.slice(1)}. Si el entreno de hoy es fuerte, conversa con tu coach o bájale la intensidad.`, url: "/" };
}
