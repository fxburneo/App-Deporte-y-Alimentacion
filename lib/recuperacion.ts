// Semáforo de recuperación (0-100): sueño, HRV contra tu rango normal y
// pulso en reposo contra tu propia semana. Cada señal se compara contigo
// mismo, no con un promedio de la población.

export interface DiaBienestar {
  fecha: string;
  sueno_seg: number | null;
  sueno_puntaje: number | null;
  hrv_noche: number | null;
  hrv_estado: string | null;
  hrv_base_bajo: number | null;
  hrv_base_alto: number | null;
  fc_reposo: number | null;
}

export type Nivel = "listo" | "cuidado" | "descansa";

export interface Recuperacion {
  puntaje: number;
  nivel: Nivel;
  sueno: number | null;
  hrv: number | null;
  fc: number | null;
  fcPromedio: number | null;
  mensaje: string;
}

const limitar = (x: number) => Math.max(0, Math.min(100, x));

export function puntajeSueno(d: DiaBienestar): number | null {
  if (d.sueno_puntaje != null) return limitar(d.sueno_puntaje);
  if (d.sueno_seg != null && d.sueno_seg > 0) return limitar((d.sueno_seg / 3600 / 7.5) * 100);
  return null;
}

// HRV dentro de tu rango normal = 100. Por debajo baja 8 puntos por cada ms
// bajo el límite. Muy por encima también se descuenta un poco (a veces es
// señal de fatiga acumulada).
export function puntajeHrv(d: DiaBienestar): number | null {
  if (d.hrv_noche == null) return null;
  if (d.hrv_base_bajo != null && d.hrv_base_alto != null) {
    if (d.hrv_noche < d.hrv_base_bajo) return limitar(100 - (d.hrv_base_bajo - d.hrv_noche) * 8);
    if (d.hrv_noche > d.hrv_base_alto + 10) return 80;
    return 100;
  }
  const porEstado: Record<string, number> = { BALANCED: 100, UNBALANCED: 65, LOW: 35, POOR: 20 };
  return d.hrv_estado ? porEstado[d.hrv_estado] ?? null : null;
}

export function puntajeFc(fc: number | null, promedio: number | null): number | null {
  if (fc == null || promedio == null) return null;
  const dif = fc - promedio;
  if (dif <= 1) return 100;
  if (dif <= 2) return 90;
  if (dif <= 4) return 70;
  if (dif <= 6) return 45;
  return 25;
}

// `dias` en cualquier orden; usa el día `fecha` y los 7 anteriores para el promedio de pulso.
export function calcularRecuperacion(dias: DiaBienestar[], fecha: string): Recuperacion | null {
  const hoy = dias.find((d) => d.fecha === fecha);
  if (!hoy) return null;
  const previos = dias
    .filter((d) => d.fecha < fecha && d.fc_reposo != null)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 7);
  const fcPromedio = previos.length >= 3 ? Math.round(previos.reduce((s, d) => s + d.fc_reposo!, 0) / previos.length) : null;

  const partes: [number | null, number][] = [
    [puntajeSueno(hoy), 0.4],
    [puntajeHrv(hoy), 0.4],
    [puntajeFc(hoy.fc_reposo, fcPromedio), 0.2],
  ];
  const validas = partes.filter(([v]) => v != null) as [number, number][];
  if (validas.length === 0) return null;
  const peso = validas.reduce((s, [, w]) => s + w, 0);
  const puntaje = Math.round(validas.reduce((s, [v, w]) => s + v * w, 0) / peso);
  const nivel: Nivel = puntaje >= 70 ? "listo" : puntaje >= 50 ? "cuidado" : "descansa";

  return {
    puntaje,
    nivel,
    sueno: partes[0][0],
    hrv: partes[1][0],
    fc: partes[2][0],
    fcPromedio,
    mensaje: mensaje(hoy, nivel, fcPromedio),
  };
}

// Una o dos frases en lenguaje simple, con la causa principal.
function mensaje(d: DiaBienestar, nivel: Nivel, fcPromedio: number | null): string {
  const horas = d.sueno_seg != null ? d.sueno_seg / 3600 : null;
  const causas: string[] = [];
  if (horas != null && horas < 6.5) causas.push(`dormiste ${horas.toFixed(1).replace(".", ",")} h`);
  if (d.hrv_noche != null && d.hrv_base_bajo != null && d.hrv_noche < d.hrv_base_bajo) causas.push("tu HRV está por debajo de tu rango normal");
  if (d.fc_reposo != null && fcPromedio != null && d.fc_reposo - fcPromedio >= 4)
    causas.push(`tu pulso en reposo está ${d.fc_reposo - fcPromedio} latidos arriba de tu semana`);

  if (nivel === "listo") {
    return causas.length
      ? `Listo para entrenar, aunque ${causas[0]}. Cumple el plan sin agregar extra.`
      : "Listo para entrenar: dormiste bien y tu cuerpo responde normal.";
  }
  if (nivel === "cuidado") {
    return `Con cuidado: ${causas.join(" y ") || "tus señales están algo bajas"}. Si el plan es intenso, baja un poco el ritmo y prioriza la comida de recuperación.`;
  }
  return `Prioriza descansar: ${causas.join(" y ") || "tus señales de recuperación están bajas"}. Conversa con tu coach antes de una sesión dura.`;
}

export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  listo: "Listo para entrenar",
  cuidado: "Con cuidado",
  descansa: "Prioriza descansar",
};
