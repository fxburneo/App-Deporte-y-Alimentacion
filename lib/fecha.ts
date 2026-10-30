// Fechas en hora de Ecuador. Vercel corre en hora UTC: a las 20:00 de
// Quito en el servidor ya es "mañana". Por eso todo "hoy" se calcula aquí.
const ZONA = "America/Guayaquil";

export function hoyEcuador(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(ahora);
}

export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

// Día de la semana: 0 domingo ... 6 sábado.
export function diaSemana(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function fechaLarga(fecha: string): string {
  const [, m, d] = fecha.split("-").map(Number);
  return `${DIAS[diaSemana(fecha)]} ${d} ${MESES[m - 1]}`;
}

// "06:35" en hora de Ecuador, para mostrar cuándo se sincronizó.
export function horaEcuador(iso: string): string {
  return new Intl.DateTimeFormat("es-EC", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

// Horas completas entre un instante y ahora.
export function horasDesde(iso: string, ahora: Date = new Date()): number {
  return Math.floor((ahora.getTime() - new Date(iso).getTime()) / 3600000);
}

// Fecha pedida para el historial de Hoy: válida solo si es anterior a hoy y
// dentro del último año; si no, hoy.
export function fechaHistorial(pedida: string | undefined, hoy: string): string {
  if (!pedida || !/^\d{4}-\d{2}-\d{2}$/.test(pedida)) return hoy;
  return pedida < hoy && pedida >= sumarDias(hoy, -365) ? pedida : hoy;
}
