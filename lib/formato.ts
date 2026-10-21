// Números con el formato que usamos en Ecuador: punto para miles, coma para decimales.
export function miles(n: number): string {
  return Math.round(n).toLocaleString("de-DE");
}

export function kg(n: number): string {
  return n.toLocaleString("es-EC", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function duracion(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
