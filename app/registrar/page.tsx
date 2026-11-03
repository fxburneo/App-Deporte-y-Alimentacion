// Pantalla Registrar comida (maqueta 2.3). El servidor arma el plan del día
// y las comidas recientes para "Repetir"; el formulario hace el resto.
import { redirect } from "next/navigation";
import { leerDatosDia } from "@/lib/datos/dia";
import { planDelDia } from "@/lib/datos/planDia";
import type { ComidaFila } from "@/lib/datos/tipos";
import { horaEcuador, sumarDias } from "@/lib/fecha";
import { comidaQueToca } from "@/lib/comidas/queToca";
import { COMIDAS, type Comida } from "@/lib/nutricion/motor";
import { createClient } from "@/lib/supabase/server";
import { leerDespensa } from "@/lib/datos/despensa";
import FormRegistrar, { type Reciente } from "./FormRegistrar";

export default async function Page({ searchParams }: { searchParams: Promise<{ comida?: string }> }) {
  const d = await leerDatosDia();
  if (!d.perfil) redirect("/bienvenida");
  const plan = planDelDia({ ...d, perfil: d.perfil });
  if (!plan) redirect("/peso");

  const sp = await searchParams;
  const pedida = COMIDAS.find((c) => c === sp.comida);
  const inicial = pedida ?? comidaQueToca(d.perfil.horarios_comida, horaEcuador(new Date().toISOString()), new Set(Object.keys(plan.consumido) as Comida[]));

  const supabase = await createClient();
  const { data } = await supabase
    .from("comidas")
    .select("*")
    .gte("fecha", sumarDias(d.fecha, -30))
    .order("creado_en", { ascending: false })
    .limit(150);
  // Hasta 5 registros distintos por comida: Repetir muestra solo los de la comida elegida.
  const vistos = new Set<string>();
  const porComida = new Map<Comida, number>();
  const recientes: Reciente[] = [];
  for (const f of (data ?? []) as ComidaFila[]) {
    const clave = f.comida + "|" + f.alimentos.map((a) => `${a.nombre}:${a.gramos}`).join("|");
    if (vistos.has(clave) || (porComida.get(f.comida) ?? 0) >= 5) continue;
    vistos.add(clave);
    porComida.set(f.comida, (porComida.get(f.comida) ?? 0) + 1);
    recientes.push({ comida: f.comida, fecha: f.fecha, alimentos: f.alimentos, kcal: f.kcal });
  }

  const { alimentos: despensa, platos } = await leerDespensa();

  return (
    <FormRegistrar
      despensa={despensa}
      platos={platos}
      inicial={inicial}
      horarios={d.perfil.horarios_comida}
      reparto={plan.reparto}
      consumido={plan.consumido}
      mananaExigente={plan.mananaExigente}
      temprano={plan.temprano}
      recientes={recientes}
    />
  );
}
