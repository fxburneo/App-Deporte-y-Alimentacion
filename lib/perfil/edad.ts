// Edad cumplida a una fecha dada. La app la recalcula sola cada día a
// partir de la fecha de nacimiento, para que las fórmulas de gasto
// calórico siempre usen la edad correcta.
export function edadEnAnios(nacimiento: string, hoy: Date = new Date()): number {
  const [anio, mes, dia] = nacimiento.split("-").map(Number);
  let edad = hoy.getFullYear() - anio;
  const yaCumplio =
    hoy.getMonth() + 1 > mes || (hoy.getMonth() + 1 === mes && hoy.getDate() >= dia);
  if (!yaCumplio) edad -= 1;
  return edad;
}
