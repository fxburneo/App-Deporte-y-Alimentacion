// Cumplimiento de un periodo con los datos ya leídos (función pura, con
// pruebas): objetivo de cada día con el mismo motor que Hoy, lo comido, y las
// sesiones del coach contra lo hecho.
import {
  cumplimientoAlimentacion,
  cumplimientoEntreno,
  DATOS_COMIDAS_DESDE,
  puntajeAlimentacion,
  sesionesDelCoach,
  type PuntajeDia,
  type SesionCoach,
} from "@/lib/cumplimiento";
import { sumarDias } from "@/lib/fecha";
import { planDelDia } from "./planDia";
import type { CarreraFila, ComidaFila, EntrenoFila, PerfilFila, PesoFila } from "./tipos";

export interface DiaCumplimiento {
  fecha: string;
  entreno: number | null; // null: sin plan del coach ese día
  alimentacion: PuntajeDia | null; // null: hoy, futuro o antes de los datos
  enObjetivoKcal: boolean;
}

export interface ResumenPeriodo {
  entreno: number | null;
  alimentacion: number | null;
  sesiones: SesionCoach[];
  dias: DiaCumplimiento[];
  componentes: { kcal: number; proteina: number; carbo: number } | null;
  diasKcalOk: number;
  diasMedidos: number;
  diasProteinaCorta: number;
}

export function resumenPeriodo(args: {
  desde: string;
  hasta: string;
  hoy: string;
  perfil: PerfilFila;
  pesos: PesoFila[];
  entrenos: EntrenoFila[];
  comidas: ComidaFila[];
  carreras: CarreraFila[];
}): ResumenPeriodo {
  const { desde, hasta, hoy } = args;
  const sesiones = sesionesDelCoach(args.entrenos, desde, hasta, hoy);
  const dias: DiaCumplimiento[] = [];
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) {
    const deHoy = sesiones.filter((s) => s.fecha === f);
    let alimentacion: PuntajeDia | null = null;
    let enObjetivoKcal = false;
    // Hoy no cuenta en alimentación: el día todavía no termina.
    if (f >= DATOS_COMIDAS_DESDE && f < hoy) {
      const plan = planDelDia({
        fecha: f,
        perfil: args.perfil,
        pesos: args.pesos,
        entrenosHoy: args.entrenos.filter((e) => e.fecha === f),
        entrenosManana: args.entrenos.filter((e) => e.fecha === sumarDias(f, 1)),
        comidas: args.comidas.filter((c) => c.fecha === f),
        carreras: args.carreras,
      });
      if (plan) {
        const comidasDia = args.comidas.filter((c) => c.fecha === f);
        const t = plan.totalConsumido;
        const kcal = comidasDia.reduce((a, c) => a + Number(c.kcal), 0) || Math.round(t.carboG * 4 + t.proteinaG * 4 + t.grasaG * 9);
        alimentacion = puntajeAlimentacion(
          { kcal: plan.objetivo.kcal, proteina: plan.objetivo.proteinaG, carbo: plan.objetivo.carboG },
          comidasDia.length ? { kcal, proteina: t.proteinaG, carbo: t.carboG } : null,
        );
        enObjetivoKcal = alimentacion.kcal === 100;
      }
    }
    dias.push({ fecha: f, entreno: cumplimientoEntreno(deHoy), alimentacion, enObjetivoKcal });
  }
  const medidos = dias.map((d) => d.alimentacion).filter((a): a is PuntajeDia => a != null);
  const prom = (k: "kcal" | "proteina" | "carbo") => Math.round(medidos.reduce((a, d) => a + d[k], 0) / medidos.length);
  return {
    entreno: cumplimientoEntreno(sesiones),
    alimentacion: cumplimientoAlimentacion(medidos),
    sesiones,
    dias,
    componentes: medidos.length ? { kcal: prom("kcal"), proteina: prom("proteina"), carbo: prom("carbo") } : null,
    diasKcalOk: dias.filter((d) => d.enObjetivoKcal).length,
    diasMedidos: medidos.length,
    diasProteinaCorta: medidos.filter((d) => d.proteina < 90).length,
  };
}
