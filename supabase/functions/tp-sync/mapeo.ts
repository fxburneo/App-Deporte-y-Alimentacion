// Traducción del calendario iCal de TrainingPeaks a entrenos planificados.
// Funciones puras (sin Deno ni red): las usa la Edge Function y las prueba
// Vitest en lib/trainingpeaks/mapeo.test.ts.
//
// Formato real del enlace "Workouts" (6-nov-2026): eventos de día completo
// (DTSTART;VALUE=DATE), SUMMARY "Tipo: Título" y DESCRIPTION con
// "Workout type: Bike\nPlanned Time: 1:15\nDistance Planned: 8.11 km".
// No trae hora, potencia ni TSS.

export type Deporte = "rodillo" | "ruta_mtb" | "trail_correr" | "fuerza" | "descanso";
export type Intensidad = "suave" | "moderado" | "fuerte";

export interface EventoIcal {
  uid: string;
  fecha: string; // "AAAA-MM-DD"
  resumen: string;
  descripcion: string;
}

export interface Horarios {
  semana: string; // "HH:MM", hora habitual de entreno lunes a viernes
  finde: string;
}

// Separa el texto en eventos. Las líneas largas del iCal vienen "plegadas"
// (continúan en la siguiente con un espacio al inicio) y el texto trae
// escapes (\n, \, y \;).
export function leerEventos(ical: string): EventoIcal[] {
  const texto = ical.replace(/\r?\n[ \t]/g, "");
  const bloques = texto.split("BEGIN:VEVENT").slice(1).map((b) => b.split("END:VEVENT")[0]);
  const eventos: EventoIcal[] = [];
  for (const b of bloques) {
    const campos: Record<string, string> = {};
    for (const linea of b.split(/\r?\n/)) {
      const m = /^([A-Z-]+)(?:;[^:]*)?:(.*)$/.exec(linea);
      if (m) campos[m[1]] = m[2];
    }
    const d = /^(\d{4})(\d{2})(\d{2})/.exec(campos.DTSTART ?? "");
    if (!campos.UID || !d) continue;
    eventos.push({
      uid: campos.UID.trim(),
      fecha: `${d[1]}-${d[2]}-${d[3]}`,
      resumen: desescapar(campos.SUMMARY ?? ""),
      descripcion: desescapar(campos.DESCRIPTION ?? ""),
    });
  }
  return eventos;
}

const desescapar = (s: string) => s.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim();

// "Planned Time: 1:15" o "1:15:00" → minutos.
export function duracionPlanificada(descripcion: string): number {
  const m = /Planned Time:\s*(\d+):(\d{2})(?::(\d{2}))?/i.exec(descripcion);
  if (!m) return 0;
  return Math.min(900, Number(m[1]) * 60 + Number(m[2]) + Math.round(Number(m[3] ?? 0) / 60));
}

export function tipoTP(evento: EventoIcal): string {
  const m = /Workout type:\s*([^\n]+)/i.exec(evento.descripcion);
  if (m) return m[1].trim();
  const r = /^([^:]+):/.exec(evento.resumen);
  return r ? r[1].trim() : "";
}

const titulo = (e: EventoIcal) => e.resumen.replace(/^[^:]+:\s*/, "");
const esFinde = (fecha: string) => [0, 6].includes(new Date(fecha + "T12:00:00Z").getUTCDay());

// Deporte de la app. Bici: entre semana es rodillo (sale a las 05:00 en casa);
// fin de semana, ruta o MTB, salvo que el texto diga rodillo, ERG o Zwift.
// Caminata (trekking con mochila) cuenta como trail suave. Natación y otros
// tipos no entran a la nutrición: devuelve null.
export function deporteTP(evento: EventoIcal): Deporte | null {
  const tipo = tipoTP(evento).toLowerCase();
  const texto = (evento.resumen + " " + evento.descripcion).toLowerCase();
  if (tipo === "day off") return "descanso";
  if (tipo === "strength") return "fuerza";
  if (tipo === "run" || tipo === "walk") return "trail_correr";
  if (tipo === "mtb") return "ruta_mtb";
  if (tipo === "bike") {
    if (/rodillo|\berg\b|zwift|indoor/.test(texto)) return "rodillo";
    return esFinde(evento.fecha) ? "ruta_mtb" : "rodillo";
  }
  return null;
}

// Intensidad por el título del coach. Las pruebas de FTP, umbral, VO2 y tempo
// son fuertes; intervalos, series, piques y cuestas son moderados (en
// esfuerzos cortos el gasto total es menor que en un umbral sostenido).
// Sin pistas, suave. La descripción solo cuenta si nombra zonas altas.
export function intensidadTP(evento: EventoIcal): Intensidad {
  const t = titulo(evento).toLowerCase();
  if (/ftp|evaluaci|test|umbral|threshold|vo2|tempo|carrera|race|competencia|\bz[45]\b/.test(t)) return "fuerte";
  if (/intervalo|series|sprint|pique|fartlek|cuesta|\bz3\b/.test(t)) return "moderado";
  if (/\bz[45]\b|vo2|umbral/i.test(evento.descripcion)) return "fuerte";
  return "suave";
}

// Fila para la tabla entrenos. La hora no viene en el iCal: se usa la hora
// habitual de entreno del perfil (entre semana o fin de semana), para que el
// plan sepa si toca snack antes de entrenar. Descanso y fuerza van sin hora.
export function eventoAEntreno(evento: EventoIcal, userId: string, horarios: Horarios) {
  const deporte = deporteTP(evento);
  if (!deporte) return null;
  const aerobico = deporte !== "descanso" && deporte !== "fuerza";
  return {
    user_id: userId,
    tp_uid: evento.uid,
    fecha: evento.fecha,
    hora: aerobico ? (esFinde(evento.fecha) ? horarios.finde : horarios.semana) : null,
    estado: "planificado" as const,
    deporte,
    duracion_min: deporte === "descanso" ? 0 : duracionPlanificada(evento.descripcion),
    intensidad: aerobico ? intensidadTP(evento) : ("suave" as const),
    origen: "trainingpeaks" as const,
    nombre: evento.resumen.slice(0, 200),
    nota: evento.descripcion.slice(0, 2000) || null,
  };
}
