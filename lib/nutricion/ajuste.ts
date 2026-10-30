// Ajuste del resto del día cuando lo que comiste no calza con el objetivo
// (blueprint, paso 6 · recálculo). Funciones puras, probadas en ajuste.test.ts.
//
// Reglas acordadas con Francisco:
// - Solo cuentan las comidas registradas. Se ajustan las que vienen después
//   de la última registrada; las anteriores sin registro se ignoran.
// - La proteína nunca baja. Si faltó, se suma en la siguiente comida (hasta
//   25 g) y el resto en las que siguen.
// - Compensación moderada: como máximo 30 % de las calorías que quedan. Lo
//   que no se compensa se acepta y no pasa a mañana.
// - Lo que se compensa sale 60 % del carbohidrato y 40 % de la grasa, repartido
//   según el tamaño de cada comida.
// - Si mañana es día duro, la cena no pierde carbohidrato (solo grasa).
// - Diferencias menores a 60 kcal no mueven nada.
import { COMIDAS, type Comida } from "./motor";

export interface Macros {
  carboG: number;
  proteinaG: number;
  grasaG: number;
}

export const kcalDe = (m: Macros) => Math.round(m.carboG * 4 + m.proteinaG * 4 + m.grasaG * 9);

const UMBRAL_KCAL = 60;
const TOPE_COMPENSACION = 0.3;
const PROTEINA_MAX_SIGUIENTE = 25;
const GRASA_MIN_COMIDA = 3;

export interface AjusteDia {
  objetivos: Record<Comida, Macros>; // objetivo vigente de cada comida (las pendientes, ajustadas)
  cambios: Partial<Record<Comida, Macros>>; // diferencia contra el objetivo original, solo pendientes con cambio
  diferenciaKcal: number; // + te pasaste, − te faltó (solo comidas registradas)
  compensadoKcal: number; // lo que se mueve en las comidas pendientes
  proteinaFaltaG: number;
  pendientes: Comida[];
  siguiente: Comida | null;
}

export function ajustarResto(args: {
  objetivos: Record<Comida, Macros>;
  consumido: Partial<Record<Comida, Macros>>;
  mananaExigente: boolean;
}): AjusteDia {
  const { objetivos, consumido } = args;
  const registradas = COMIDAS.filter((c) => consumido[c] != null);
  const ultima = registradas.length ? Math.max(...registradas.map((c) => COMIDAS.indexOf(c))) : -1;
  const pendientes = COMIDAS.slice(ultima + 1);

  let diferenciaKcal = 0;
  let proteinaFaltaG = 0;
  for (const c of registradas) {
    diferenciaKcal += kcalDe(consumido[c]!) - kcalDe(objetivos[c]);
    proteinaFaltaG += objetivos[c].proteinaG - consumido[c]!.proteinaG;
  }
  proteinaFaltaG = Math.max(0, Math.round(proteinaFaltaG));

  const nuevos = Object.fromEntries(COMIDAS.map((c) => [c, { ...objetivos[c] }])) as Record<Comida, Macros>;
  const base = {
    objetivos: nuevos,
    cambios: {},
    diferenciaKcal,
    compensadoKcal: 0,
    proteinaFaltaG,
    pendientes,
    siguiente: pendientes[0] ?? null,
  };
  if (pendientes.length === 0) return base;

  // 1. Proteína que faltó: primero a la siguiente comida, el resto repartido.
  let proteinaPorPoner = proteinaFaltaG;
  for (const c of pendientes) {
    if (proteinaPorPoner <= 0) break;
    const poner = c === pendientes[0] ? Math.min(PROTEINA_MAX_SIGUIENTE, proteinaPorPoner) : proteinaPorPoner;
    nuevos[c].proteinaG += poner;
    proteinaPorPoner -= poner;
  }
  // La proteína añadida suma calorías: se cuenta dentro de lo que hay que compensar.
  const exceso = diferenciaKcal + 4 * proteinaFaltaG;

  // 2. Compensar calorías en carbohidrato y grasa, con tope del 30 %.
  const kcalPendientes = pendientes.reduce((s, c) => s + kcalDe(objetivos[c]), 0);
  const tope = TOPE_COMPENSACION * kcalPendientes;
  const compensar = Math.abs(exceso) < UMBRAL_KCAL ? 0 : Math.sign(exceso) * Math.min(Math.abs(exceso), tope);

  let compensado = 0;
  if (compensar !== 0) {
    for (const c of pendientes) {
      const parte = compensar * (kcalDe(objetivos[c]) / kcalPendientes);
      const cenaProtegida = c === "cena" && args.mananaExigente && compensar > 0;
      const kcalCarbo = cenaProtegida ? 0 : parte * 0.6;
      const kcalGrasa = cenaProtegida ? parte : parte * 0.4;
      const carbo = Math.max(0, Math.round(nuevos[c].carboG - kcalCarbo / 4));
      const grasa = Math.max(Math.min(GRASA_MIN_COMIDA, nuevos[c].grasaG), Math.round(nuevos[c].grasaG - kcalGrasa / 9));
      compensado += (nuevos[c].carboG - carbo) * 4 + (nuevos[c].grasaG - grasa) * 9;
      nuevos[c].carboG = carbo;
      nuevos[c].grasaG = grasa;
    }
  }

  const cambios: Partial<Record<Comida, Macros>> = {};
  for (const c of pendientes) {
    const d = {
      carboG: nuevos[c].carboG - objetivos[c].carboG,
      proteinaG: nuevos[c].proteinaG - objetivos[c].proteinaG,
      grasaG: nuevos[c].grasaG - objetivos[c].grasaG,
    };
    if (d.carboG !== 0 || d.proteinaG !== 0 || d.grasaG !== 0) cambios[c] = d;
  }
  return { ...base, cambios, compensadoKcal: Math.round(compensado) };
}

export function sumarMacros(lista: Macros[]): Macros {
  return lista.reduce(
    (s, m) => ({ carboG: s.carboG + m.carboG, proteinaG: s.proteinaG + m.proteinaG, grasaG: s.grasaG + m.grasaG }),
    { carboG: 0, proteinaG: 0, grasaG: 0 }
  );
}
