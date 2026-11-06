// Plan del día de carrera (maqueta 4b.4): totales para la duración estimada,
// desayuno y comida por tramos de horas.
import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { createClient } from "@/lib/supabase/server";
import { aCarrera, type CarreraFila } from "@/lib/datos/tipos";
import { hoyEcuador } from "@/lib/fecha";
import { LIQUIDO_ML_HORA, planCarrera, SODIO_MG_HORA } from "@/lib/nutricion/carrera";
import { pesoReferencia } from "@/lib/nutricion/motor";

const coma = (n: number) => String(n).replace(".", ",");

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const supabase = await createClient();
  const [{ data }, { data: pesos }] = await Promise.all([
    supabase.from("carreras").select("*").eq("id", id).maybeSingle(),
    supabase.from("pesos").select("fecha, kg").order("fecha", { ascending: false }).limit(10),
  ]);
  if (!data) notFound();
  const c = aCarrera(data as CarreraFila);
  const peso = pesoReferencia((pesos ?? []).map((p) => ({ fecha: p.fecha, kg: Number(p.kg) })), hoyEcuador()) ?? 75;
  const p = planCarrera(c, peso);

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <Link href={`/carreras/${c.id}`} className="min-w-[70px] py-2.5 font-semibold text-tenue">‹ Camino</Link>
          <h1 className="font-display text-2xl font-bold tracking-[0.04em]">DÍA DE CARRERA</h1>
          <span className="min-w-[70px]" />
        </header>

        <section className="flex flex-col gap-2.5 rounded-[14px] bg-superficie px-4 py-3.5">
          <span className="etiqueta">Total para {coma(p.horas)} horas</span>
          <div className="grid grid-cols-3 gap-2.5">
            <Total valor={`${p.carboTotal} g`} sub={`carbohidrato · ${p.carboHora} g/h`} color="text-carbo" />
            <Total valor={`${coma(p.liquidoTotalL)} L`} sub={`líquido · ${LIQUIDO_ML_HORA} ml/h`} color="text-proteina" />
            <Total valor={`${coma(p.sodioTotalG)} g`} sub={`sodio · ${SODIO_MG_HORA} mg/h`} color="text-texto" />
          </div>
        </section>

        <section className="flex flex-col">
          <div className="flex items-baseline justify-between pb-1">
            <span className="etiqueta">Antes</span>
            <span className="text-xs text-tenue">3 h antes de la largada</span>
          </div>
          <Fila h="−3 h" que="Desayuno: panes de agua con mermelada y miel, banano, café. Poca fibra y poca grasa." g={p.desayunoG} />
          <Fila h="−30′" que="1 gel con agua" g={25} ultimo />
        </section>

        <section className="flex flex-col">
          <div className="flex items-baseline justify-between pb-1">
            <span className="etiqueta">En carrera</span>
            <span className="text-xs text-tenue">por cada hora</span>
          </div>
          {p.bloques.map((b, i) => (
            <Fila key={b.desde} h={b.desde === b.hasta ? `H${b.desde}` : `H${b.desde}–${b.hasta}`} que={b.que} g={b.carboHora} ultimo={i === p.bloques.length - 1} />
          ))}
        </section>

        <section className="border-l-[3px] border-proteina py-0.5 pl-3">
          <span className="etiqueta text-proteina!">Pendiente</span>
          <p className="text-sm text-suave">Líquido y sodio son estimados hasta el test de sudoración. El carbohidrato parte de tus 70 g/h del año pasado.</p>
        </section>
      </Pantalla>
      <NavBar activa="mas" />
    </>
  );
}

function Total({ valor, sub, color }: { valor: string; sub: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className={`font-display text-[26px] font-bold ${color}`}>{valor}</span>
      <span className="text-xs text-tenue">{sub}</span>
    </div>
  );
}

function Fila({ h, que, g, ultimo }: { h: string; que: string; g: number; ultimo?: boolean }) {
  return (
    <div className={`grid grid-cols-[52px_1fr_56px] items-center gap-2 py-2.5 ${ultimo ? "" : "border-b border-linea"}`}>
      <span className="font-display text-[17px] font-semibold text-tenue">{h}</span>
      <span className="text-[13px]">{que}</span>
      <span className="text-right font-display text-[17px] font-semibold text-carbo">{g} g</span>
    </div>
  );
}
