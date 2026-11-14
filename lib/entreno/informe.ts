// Informe semanal (maqueta 3b.2): números de la semana y el resumen de datos
// que se le pasa a Claude para escribir lo que mejoró, lo que falta y los
// temas para el coach. Funciones puras con pruebas.
import { sumarDias } from "@/lib/fecha";
import type { Macros } from "@/lib/nutricion/ajuste";

export interface DiaInforme {
  fecha: string;
  tipo: string; // tipo de día del motor
  plan: string[]; // entrenos del coach
  hecho: { deporte: string; duracion_min: number; carga: number | null }[];
  objetivo: Macros & { kcal: number };
  comido: (Macros & { kcal: number }) | null; // null si no registró nada
  durante: { objetivoG: number; comidoG: number } | null;
  suenoSeg: number | null;
  hrv: number | null;
}

// Lunes de la semana a informar: la actual desde el sábado; si no, la anterior.
export function lunesInforme(hoy: string): string {
  const dia = new Date(hoy + "T12:00:00Z").getUTCDay();
  const lunesActual = sumarDias(hoy, -((dia + 6) % 7));
  return dia === 6 || dia === 0 ? lunesActual : sumarDias(lunesActual, -7);
}

export function numerosSemana(dias: DiaInforme[], pesos: { fecha: string; kg: number }[], lunes: string) {
  const conPlan = dias.filter((d) => d.plan.length > 0);
  const cumplidos = conPlan.filter((d) => d.hecho.length > 0).length;
  const conComida = dias.filter((d) => d.comido && d.comido.kcal > 300);
  const enObjetivo = conComida.filter((d) => {
    const p = d.comido!.kcal / d.objetivo.kcal;
    return p >= 0.8 && p <= 1.1;
  }).length;
  const noches = dias.filter((d) => d.suenoSeg != null);
  const domingo = sumarDias(lunes, 6);
  const semana = pesos.filter((p) => p.fecha >= lunes && p.fecha <= domingo);
  const antes = pesos.filter((p) => p.fecha < lunes && p.fecha >= sumarDias(lunes, -28));
  const prom = (l: { kg: number }[]) => (l.length ? l.reduce((s, p) => s + p.kg, 0) / l.length : null);
  const pesoSemana = prom(semana);
  const pesoAntes = prom(antes);
  return {
    entrenos: { cumplidos, planificados: conPlan.length },
    comidas: { enObjetivo, registrados: conComida.length },
    suenoMin: noches.length ? Math.round(noches.reduce((s, d) => s + d.suenoSeg!, 0) / noches.length / 60) : null,
    peso: pesoSemana != null ? { kg: Math.round(pesoSemana * 10) / 10, cambio: pesoAntes != null ? Math.round((pesoSemana - pesoAntes) * 10) / 10 : null } : null,
  };
}

// Datos de la semana en texto plano para Claude (sin nombre ni datos de contacto).
export function datosParaIA(args: {
  dias: DiaInforme[];
  numeros: ReturnType<typeof numerosSemana>;
  base: number;
  cansancio: number;
  frescura: number;
  intensidad: { suave: number; media: number; fuerte: number } | null;
  hrvRango: [number, number] | null;
  carrera: { nombre: string; semanas: number } | null;
  pausa: string | null;
}): string {
  const r = (n: number) => Math.round(n);
  const lineas = args.dias.map((d) => {
    const ent = d.hecho.length ? d.hecho.map((h) => `${h.deporte} ${h.duracion_min} min (carga ${h.carga ?? "?"})`).join(" + ") : "sin entreno";
    const plan = d.plan.length ? d.plan.join(" + ") : "libre";
    const com = d.comido
      ? `comió ${r(d.comido.kcal)} de ${r(d.objetivo.kcal)} kcal; proteína ${r(d.comido.proteinaG)}/${r(d.objetivo.proteinaG)} g; carbohidrato ${r(d.comido.carboG)}/${r(d.objetivo.carboG)} g; grasa ${r(d.comido.grasaG)}/${r(d.objetivo.grasaG)} g`
      : "no registró comidas";
    const dur = d.durante ? `; durante el entreno ${r(d.durante.comidoG)} de ${r(d.durante.objetivoG)} g de carbohidrato` : "";
    const sue = d.suenoSeg != null ? `; durmió ${(d.suenoSeg / 3600).toFixed(1)} h` : "";
    const hrv = d.hrv != null ? `; HRV ${d.hrv}` : "";
    return `- ${d.fecha} (${d.tipo}): plan del coach: ${plan}; hecho: ${ent}; ${com}${dur}${sue}${hrv}`;
  });
  const n = args.numeros;
  return [
    `Semana: entrenos cumplidos ${n.entrenos.cumplidos}/${n.entrenos.planificados}; días con comida en objetivo (80-110 %) ${n.comidas.enObjetivo}/${n.comidas.registrados}.`,
    `Peso promedio: ${n.peso ? `${n.peso.kg} kg (cambio ${n.peso.cambio ?? "sin dato previo"} kg frente a las 4 semanas anteriores)` : "sin pesajes esta semana"}.`,
    `Base física (forma de 42 días) ${r(args.base)}, cansancio (7 días) ${r(args.cansancio)}, frescura ${r(args.frescura)}.`,
    args.intensidad ? `Tiempo por zonas de pulso en 4 semanas: suave ${args.intensidad.suave} %, media ${args.intensidad.media} %, fuerte ${args.intensidad.fuerte} %.` : "",
    args.hrvRango ? `Rango normal de HRV: ${args.hrvRango[0]}-${args.hrvRango[1]}.` : "",
    args.carrera ? `Carrera objetivo: ${args.carrera.nombre} en ${args.carrera.semanas} semanas.` : "",
    args.pausa ? `Contexto: ${args.pausa}.` : "",
    "Días:",
    ...lineas,
  ]
    .filter(Boolean)
    .join("\n");
}
