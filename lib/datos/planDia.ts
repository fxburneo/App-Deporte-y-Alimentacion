// Plan del día: objetivo, reparto por comida y ajuste según lo que ya se
// registró. Lo usan Hoy, Registrar y Comidas para que todas muestren lo mismo.
import { ajustarResto, kcalFueraDeComidas, sumarMacros, type AjusteDia, type Macros } from "@/lib/nutricion/ajuste";
import {
  carboDurante,
  COMIDAS,
  SNACK_PRE_G,
  SNACK_PRE_LARGO,
  objetivoDelDia,
  pesoReferencia,
  repartirComidas,
  tipoDia,
  type Comida,
  type ObjetivoDia,
} from "@/lib/nutricion/motor";
import { carreraDelDia, entrenoDeCarrera, type CarreraDelDia } from "@/lib/nutricion/carrera";
import { sumarDias } from "@/lib/fecha";
import { aCarrera, aEntreno, aPerfilMotor, type CarreraFila, type ComidaFila, type EntrenoFila, type PerfilFila, type PesoFila } from "./tipos";

export interface PlanDia {
  pesoKg: number;
  objetivo: ObjetivoDia;
  reparto: Record<Comida, Macros>;
  temprano: boolean;
  mananaExigente: boolean;
  consumido: Partial<Record<Comida, Macros>>;
  objetivoPre: Macros | null; // snack antes de entrenar (sale del desayuno)
  consumoPre: Macros | null;
  objetivoDurante: Macros | null; // geles, bebida y barras en entrenos de 90 min o más
  consumoDurante: Macros | null;
  consumoExtra: Macros | null; // extras fuera de horario
  totalConsumido: Macros;
  ajuste: AjusteDia;
  carrera: CarreraDelDia | null;
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
  carreras?: CarreraFila[];
}): PlanDia | null {
  // Solo pesajes hasta ese día (en el historial no cuentan los posteriores).
  const pesoKg = pesoReferencia(args.pesos.filter((p) => p.fecha <= args.fecha), args.fecha);
  if (pesoKg == null) return null;
  const perfil = aPerfilMotor(args.perfil);
  // Carreras: si TrainingPeaks no trae la carrera como entreno, se agrega como
  // plan del día (así el motor sabe que es muy largo y prepara la víspera).
  const carreras = (args.carreras ?? []).map(aCarrera);
  const conCarrera = (lista: EntrenoFila[], fecha: string) => {
    const c = carreras.find((x) => x.fecha === fecha);
    const base = lista.map(aEntreno);
    return c && base.length === 0 ? [entrenoDeCarrera(c)] : base;
  };
  const hoy = conCarrera(args.entrenosHoy, args.fecha);
  const manana = conCarrera(args.entrenosManana, sumarDias(args.fecha, 1));
  const carrera = carreraDelDia(args.fecha, carreras);
  const objetivo = objetivoDelDia({
    perfil,
    pesoKg,
    entrenosHoy: hoy,
    entrenosManana: manana,
    carrera: carrera ? { modo: carrera.modo, cargaGKg: carrera.cargaGKg } : null,
  });
  const temprano = hoy.some((e) => e.hora != null && e.hora < perfil.horaDesayuno && e.deporte !== "descanso");
  const reparto = repartirComidas(objetivo, temprano);
  // Durante el entreno: ese carbohidrato sale del total del día; las comidas
  // se reparten lo que queda, en la misma proporción.
  const gDurante = Math.min(carboDurante(hoy), Math.round(objetivo.carboG * 0.5));
  if (gDurante > 0) {
    const totalC = COMIDAS.reduce((s, c) => s + reparto[c].carboG, 0);
    for (const c of COMIDAS) reparto[c] = { ...reparto[c], carboG: Math.round((reparto[c].carboG * (totalC - gDurante)) / totalC) };
  }
  // Snack antes de entrenar: sale del desayuno cuando hay entreno exigente
  // temprano o cuando Francisco lo registró (el entreno suele llegar de Garmin
  // después de comerlo, así que no se puede esperar a verlo).
  const comioPre = args.comidas.some((f) => f.fecha === args.fecha && f.comida === "pre_entreno");
  // Salida de 2 h o más antes del desayuno: snack grande (con algo de proteína y grasa).
  const salidaLarga = hoy.some((e) => e.hora != null && e.hora < perfil.horaDesayuno && e.deporte !== "descanso" && e.deporte !== "fuerza" && e.duracionMin >= 120);
  const objetivoPre: Macros | null =
    objetivo.snackPreEntreno || comioPre ? (salidaLarga ? { ...SNACK_PRE_LARGO } : { carboG: SNACK_PRE_G, proteinaG: 0, grasaG: 0 }) : null;
  if (objetivoPre) {
    // Si el snack es más que el carbohidrato del desayuno, lo que falta sale de
    // las demás comidas en proporción (así el total del día no cambia).
    const falta = Math.max(0, objetivoPre.carboG - reparto.desayuno.carboG);
    reparto.desayuno = {
      carboG: Math.max(0, reparto.desayuno.carboG - objetivoPre.carboG),
      proteinaG: Math.max(0, reparto.desayuno.proteinaG - objetivoPre.proteinaG),
      grasaG: Math.max(0, reparto.desayuno.grasaG - objetivoPre.grasaG),
    };
    const otras = COMIDAS.filter((c) => c !== "desayuno");
    const totalOtras = otras.reduce((s, c) => s + reparto[c].carboG, 0);
    if (falta > 0 && totalOtras > 0)
      for (const c of otras) reparto[c] = { ...reparto[c], carboG: Math.max(0, Math.round(reparto[c].carboG - (falta * reparto[c].carboG) / totalOtras)) };
  }
  const tm = tipoDia(manana);
  const mananaExigente = tm === "duro" || tm === "muy_largo";

  const consumido: Partial<Record<Comida, Macros>> = {};
  for (const c of COMIDAS) {
    const filas = args.comidas.filter((f) => f.fecha === args.fecha && f.comida === c);
    if (filas.length) consumido[c] = sumarMacros(filas.map(macrosDeFila));
  }
  const delMomento = (m: "pre_entreno" | "durante" | "extra") => {
    const filas = args.comidas.filter((f) => f.fecha === args.fecha && f.comida === m);
    return filas.length ? sumarMacros(filas.map(macrosDeFila)) : null;
  };
  const consumoPre = delMomento("pre_entreno");
  const consumoExtra = delMomento("extra");
  const consumoDurante = delMomento("durante");
  const objetivoDurante: Macros | null = gDurante > 0 ? { carboG: gDurante, proteinaG: 0, grasaG: 0 } : null;
  const extraKcal = kcalFueraDeComidas({ objetivoPre, consumoPre, objetivoDurante, consumoDurante, consumoExtra });
  const totalConsumido = sumarMacros([
    ...Object.values(consumido),
    ...[consumoPre, consumoDurante, consumoExtra].filter((m): m is Macros => m != null),
  ]);
  const ajuste = ajustarResto({ objetivos: reparto, consumido, mananaExigente, extraKcal });
  return { pesoKg, objetivo, reparto, temprano, mananaExigente, consumido, objetivoPre, consumoPre, objetivoDurante, consumoDurante, consumoExtra, totalConsumido, ajuste, carrera };
}
