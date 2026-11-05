// Plan del día: objetivo, reparto por comida y ajuste según lo que ya se
// registró. Lo usan Hoy, Registrar y Comidas para que todas muestren lo mismo.
import { ajustarResto, kcalDe, sumarMacros, type AjusteDia, type Macros } from "@/lib/nutricion/ajuste";
import {
  COMIDAS,
  SNACK_PRE_G,
  objetivoDelDia,
  pesoReferencia,
  repartirComidas,
  tipoDia,
  type Comida,
  type ObjetivoDia,
} from "@/lib/nutricion/motor";
import { aEntreno, aPerfilMotor, type ComidaFila, type EntrenoFila, type PerfilFila, type PesoFila } from "./tipos";

export interface PlanDia {
  pesoKg: number;
  objetivo: ObjetivoDia;
  reparto: Record<Comida, Macros>;
  temprano: boolean;
  mananaExigente: boolean;
  consumido: Partial<Record<Comida, Macros>>;
  objetivoPre: Macros | null; // snack antes de entrenar (sale del desayuno)
  consumoPre: Macros | null;
  consumoExtra: Macros | null; // extras fuera de horario
  totalConsumido: Macros;
  ajuste: AjusteDia;
}

export const macrosDeFila = (f: Pick<ComidaFila, "carbo_g" | "proteina_g" | "grasa_g">): Macros => ({
  carboG: Number(f.carbo_g),
  proteinaG: Number(f.proteina_g),
  grasaG: Number(f.grasa_g),
});

export function planDelDia(args: {
  fecha: string;
  perfil: PerfilFila;
  pesos: PesoFila[];
  entrenosHoy: EntrenoFila[];
  entrenosManana: EntrenoFila[];
  comidas: ComidaFila[];
}): PlanDia | null {
  // Solo pesajes hasta ese día (en el historial no cuentan los posteriores).
  const pesoKg = pesoReferencia(args.pesos.filter((p) => p.fecha <= args.fecha), args.fecha);
  if (pesoKg == null) return null;
  const perfil = aPerfilMotor(args.perfil);
  const hoy = args.entrenosHoy.map(aEntreno);
  const manana = args.entrenosManana.map(aEntreno);
  const objetivo = objetivoDelDia({ perfil, pesoKg, entrenosHoy: hoy, entrenosManana: manana });
  const temprano = hoy.some((e) => e.hora != null && e.hora < perfil.horaDesayuno && e.deporte !== "descanso");
  const reparto = repartirComidas(objetivo, temprano);
  // Entreno exigente antes del desayuno: el snack previo sale del desayuno.
  const objetivoPre: Macros | null = objetivo.snackPreEntreno ? { carboG: SNACK_PRE_G, proteinaG: 0, grasaG: 0 } : null;
  if (objetivoPre) reparto.desayuno = { ...reparto.desayuno, carboG: Math.max(0, reparto.desayuno.carboG - SNACK_PRE_G) };
  const tm = tipoDia(manana);
  const mananaExigente = tm === "duro" || tm === "muy_largo";

  const consumido: Partial<Record<Comida, Macros>> = {};
  for (const c of COMIDAS) {
    const filas = args.comidas.filter((f) => f.fecha === args.fecha && f.comida === c);
    if (filas.length) consumido[c] = sumarMacros(filas.map(macrosDeFila));
  }
  const delMomento = (m: "pre_entreno" | "extra") => {
    const filas = args.comidas.filter((f) => f.fecha === args.fecha && f.comida === m);
    return filas.length ? sumarMacros(filas.map(macrosDeFila)) : null;
  };
  const consumoPre = delMomento("pre_entreno");
  const consumoExtra = delMomento("extra");
  const extraKcal = (consumoPre ? kcalDe(consumoPre) - (objetivoPre ? kcalDe(objetivoPre) : 0) : 0) + (consumoExtra ? kcalDe(consumoExtra) : 0);
  const totalConsumido = sumarMacros([...Object.values(consumido), ...(consumoPre ? [consumoPre] : []), ...(consumoExtra ? [consumoExtra] : [])]);
  const ajuste = ajustarResto({ objetivos: reparto, consumido, mananaExigente, extraKcal });
  return { pesoKg, objetivo, reparto, temprano, mananaExigente, consumido, objetivoPre, consumoPre, consumoExtra, totalConsumido, ajuste };
}
