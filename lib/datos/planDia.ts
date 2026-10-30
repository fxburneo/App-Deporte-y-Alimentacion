// Plan del día: objetivo, reparto por comida y ajuste según lo que ya se
// registró. Lo usan Hoy, Registrar y Comidas para que todas muestren lo mismo.
import { ajustarResto, sumarMacros, type AjusteDia, type Macros } from "@/lib/nutricion/ajuste";
import {
  COMIDAS,
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
  const tm = tipoDia(manana);
  const mananaExigente = tm === "duro" || tm === "muy_largo";

  const consumido: Partial<Record<Comida, Macros>> = {};
  for (const c of COMIDAS) {
    const filas = args.comidas.filter((f) => f.fecha === args.fecha && f.comida === c);
    if (filas.length) consumido[c] = sumarMacros(filas.map(macrosDeFila));
  }
  const totalConsumido = sumarMacros(Object.values(consumido));
  const ajuste = ajustarResto({ objetivos: reparto, consumido, mananaExigente });
  return { pesoKg, objetivo, reparto, temprano, mananaExigente, consumido, totalConsumido, ajuste };
}
