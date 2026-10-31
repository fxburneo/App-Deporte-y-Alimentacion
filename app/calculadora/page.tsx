// Calculadora "¿Cuánto me sirvo?" (maqueta 2b.4): con el objetivo vigente de
// cada comida y los alimentos de la despensa, calcula los gramos del plato.
import { redirect } from "next/navigation";
import { leerDatosDia } from "@/lib/datos/dia";
import { leerDespensa } from "@/lib/datos/despensa";
import { planDelDia } from "@/lib/datos/planDia";
import { horaEcuador } from "@/lib/fecha";
import { comidaQueToca } from "@/lib/comidas/queToca";
import type { Comida } from "@/lib/nutricion/motor";
import Calculadora from "./Calculadora";

export default async function Page() {
  const d = await leerDatosDia();
  if (!d.perfil) redirect("/bienvenida");
  const plan = planDelDia({ ...d, perfil: d.perfil });
  if (!plan) redirect("/peso");
  const { alimentos } = await leerDespensa();
  const inicial = comidaQueToca(d.perfil.horarios_comida, horaEcuador(new Date().toISOString()), new Set(Object.keys(plan.consumido) as Comida[]));
  return <Calculadora objetivos={plan.ajuste.objetivos} despensa={alimentos} inicial={inicial} />;
}
