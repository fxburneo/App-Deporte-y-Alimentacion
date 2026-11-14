// Análisis de entrenador en lenguaje simple (etapa 6, maqueta 3b.1). Funciones
// puras con pruebas: base física, cansancio y frescura con la carga de Garmin
// (promedios de 42 y 7 días, el mismo método que TrainingPeaks), lesión,
// intensidad por zonas de pulso, semana del coach y sueño.
import { sumarDias } from "@/lib/fecha";

export interface DiaCarga {
  fecha: string;
  base: number; // "CTL": forma de largo plazo (42 días)
  cansancio: number; // "ATL": carga reciente (7 días)
  frescura: number; // base − cansancio
}

export function serieCarga(cargas: Record<string, number>, desde: string, hasta: string): DiaCarga[] {
  const out: DiaCarga[] = [];
  let ctl = 0;
  let atl = 0;
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) {
    const c = cargas[f] ?? 0;
    ctl += (c - ctl) / 42;
    atl += (c - atl) / 7;
    out.push({ fecha: f, base: ctl, cansancio: atl, frescura: ctl - atl });
  }
  return out;
}

// Hueco de 14 días o más sin entrenar (lesión, enfermedad, viaje): el más reciente.
export function ultimoHueco(cargas: Record<string, number>, desde: string, hasta: string): { desde: string; hasta: string } | null {
  let inicio: string | null = null;
  let hueco: { desde: string; hasta: string } | null = null;
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) {
    if ((cargas[f] ?? 0) > 5) {
      if (inicio && Math.round((Date.parse(f) - Date.parse(inicio)) / 86400000) >= 14) hueco = { desde: inicio, hasta: sumarDias(f, -1) };
      inicio = null;
    } else if (!inicio) inicio = f;
  }
  return hueco;
}

export function textoCansancio(base: number, cansancio: number): string {
  const r = base > 0 ? cansancio / base : 0;
  if (r > 1.5) return "alto para tu base";
  if (r > 1.1) return "normal en semana de carga";
  return "bajo: estás descansado";
}

export function textoFrescura(frescura: number): string {
  if (frescura < -30) return "muy cansado: conviene bajar la carga";
  if (frescura < -10) return "cansado, normal en semana de carga";
  if (frescura <= 5) return "equilibrado";
  return "fresco: buen momento para un día fuerte";
}

export interface EntrenoZonas {
  fecha: string;
  duracion_min: number;
  zonas_seg: number[] | null; // zonas de pulso 1 a 5, en segundos
  nombre?: string | null;
}

// Suave = zonas 1-2, media = zona 3, fuerte = zonas 4-5.
export function intensidad(entrenos: EntrenoZonas[]) {
  let s = 0, m = 0, f = 0;
  let peor: { fecha: string; zona3Min: number; totalMin: number } | null = null;
  for (const e of entrenos) {
    const z = (e.zonas_seg ?? []).map((x) => Number(x) || 0);
    const z12 = (z[0] ?? 0) + (z[1] ?? 0), z3 = z[2] ?? 0, z45 = (z[3] ?? 0) + (z[4] ?? 0);
    s += z12; m += z3; f += z45;
    const total = z12 + z3 + z45;
    // Ejemplo para el texto: el entreno largo con más tiempo en zona media.
    if (total >= 45 * 60 && (!peor || z3 / total > peor.zona3Min / peor.totalMin)) peor = { fecha: e.fecha, zona3Min: Math.round(z3 / 60), totalMin: Math.round(total / 60) };
  }
  const t = s + m + f;
  if (t === 0) return null;
  const pct = (x: number) => Math.round((x / t) * 100);
  return { suave: pct(s), media: pct(m), fuerte: 100 - pct(s) - pct(m), ejemplo: peor };
}

export interface EntrenoSemana {
  fecha: string;
  estado: "planificado" | "hecho";
  deporte: string;
  duracion_min: number;
  nombre: string | null;
  origen: string;
}
export interface DiaSemanaEntreno {
  fecha: string;
  plan: string; // lo que puso el coach
  hecho: string; // lo que hiciste
  estado: "ok" | "falta" | "hoy" | "luego" | "libre";
}

const dur = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
const DEPORTE: Record<string, string> = { rodillo: "rodillo", ruta_mtb: "bici", trail_correr: "trote", fuerza: "fuerza", descanso: "descanso" };
const limpio = (n: string | null) => (n ?? "").replace(/^[^:]+:\s*/, "");

export function semanaEntreno(lista: EntrenoSemana[], lunes: string, hoy: string): DiaSemanaEntreno[] {
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    const plan = lista.filter((e) => e.fecha === fecha && e.estado === "planificado" && e.deporte !== "descanso");
    const hechos = lista.filter((e) => e.fecha === fecha && e.estado === "hecho");
    const textoPlan = plan.map((e) => `${limpio(e.nombre) || DEPORTE[e.deporte]} ${dur(e.duracion_min)}`).join(" + ");
    const textoHecho = hechos.map((e) => (e.deporte === "fuerza" ? `fuerza ${e.duracion_min} min` : dur(e.duracion_min))).join(" + ");
    const estado: DiaSemanaEntreno["estado"] =
      hechos.length > 0 ? "ok" : fecha === hoy ? (plan.length ? "hoy" : "libre") : fecha > hoy ? (plan.length ? "luego" : "libre") : plan.length ? "falta" : "libre";
    return { fecha, plan: textoPlan, hecho: textoHecho, estado };
  });
}

export interface NocheSueno {
  fecha: string;
  sueno_seg: number | null;
  hrv_semana: number | null;
  hrv_base_bajo: number | null;
  hrv_base_alto: number | null;
}
export function resumenSueno(noches: NocheSueno[]) {
  const con = noches.filter((n) => n.sueno_seg != null);
  if (con.length === 0) return null;
  const prom = con.reduce((s, n) => s + n.sueno_seg!, 0) / con.length;
  const ultima = [...noches].reverse().find((n) => n.hrv_semana != null) ?? null;
  return {
    promedioMin: Math.round(prom / 60),
    nochesCortas: con.filter((n) => n.sueno_seg! < 7 * 3600).length,
    noches: con.length,
    hrvSemana: ultima?.hrv_semana ?? null,
    rango: ultima && ultima.hrv_base_bajo != null && ultima.hrv_base_alto != null ? [ultima.hrv_base_bajo, ultima.hrv_base_alto] as [number, number] : null,
  };
}

export const horasMin = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
