// Arma los números y el texto de datos de una semana para el informe.
import "server-only";
import { leerEntrenoAnalisis } from "@/lib/datos/entreno";
import { leerSemanaInforme } from "@/lib/datos/informe";
import { sumarDias } from "@/lib/fecha";
import { intensidad, resumenSueno, serieCarga, ultimoHueco } from "@/lib/entreno/analisis";
import { datosParaIA, numerosSemana } from "@/lib/entreno/informe";

export async function construirDatosInforme(lunes: string) {
  const domingo = sumarDias(lunes, 6);
  const [semana, analisis] = await Promise.all([leerSemanaInforme(lunes), leerEntrenoAnalisis(domingo)]);
  if (!semana) return null;
  const numeros = numerosSemana(semana.dias, semana.pesos, lunes);
  const serie = serieCarga(analisis.cargas, analisis.primera, domingo);
  const h = serie.at(-1)!;
  const hueco = ultimoHueco(analisis.cargas, analisis.primera, domingo);
  const sueno = resumenSueno(analisis.noches);
  const z = intensidad(analisis.zonas);
  const texto = datosParaIA({
    dias: semana.dias,
    numeros,
    base: h.base,
    cansancio: h.cansancio,
    frescura: h.frescura,
    intensidad: z,
    hrvRango: sueno?.rango ?? null,
    carrera: analisis.carrera ? { nombre: analisis.carrera.nombre, semanas: Math.round((Date.parse(analisis.carrera.fecha) - Date.parse(domingo)) / (7 * 86400000)) } : null,
    pausa: hueco ? `estuvo sin entrenar del ${hueco.desde} al ${hueco.hasta} por una lesión; está volviendo` : null,
  });
  return { numeros, texto };
}
