// Menú de la semana (maqueta 2d.1): el menú tipo con las cantidades de cada
// día según el plan de TrainingPeaks. En amarillo lo que cambia ese día.
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerMenuSemana } from "@/lib/datos/menu";
import { NOMBRE_DEPORTE, NOMBRE_MOMENTO } from "@/lib/datos/tipos";
import { fechaCorta, fechaLarga, hoyEcuador, sumarDias } from "@/lib/fecha";
import { duracion, miles } from "@/lib/formato";
import { TIPO_MENU } from "./estilo";

export default async function Page({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const dias = (await searchParams).dias === "14" ? 14 : 7;
  const hoy = hoyEcuador();
  const datos = await leerMenuSemana(dias, hoy);
  if (!datos) redirect("/");
  const sinMenuTipo = datos.dias[0]?.menu.comidas.every((c) => !c.deMenuTipo);

  return (
    <>
      <Pantalla>
        <header className="flex flex-col">
          <span className="text-[13px] text-tenue">
            {fechaLarga(hoy)} → {fechaCorta(sumarDias(hoy, dias - 1))} · plan de TrainingPeaks
          </span>
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-[0.04em]">MENÚ DE LA SEMANA</h1>
        </header>
        <div role="tablist" className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-borde">
          {[7, 14].map((n) => (
            <Link key={n} href={n === 7 ? "/menu" : "/menu?dias=14"} role="tab" aria-selected={dias === n} className={`py-2.5 text-center no-underline ${dias === n ? "bg-texto font-bold text-fondo" : "bg-superficie font-semibold text-suave"}`}>
              {n} días
            </Link>
          ))}
        </div>
        <p className="-mt-2 text-xs text-tenue">
          {sinMenuTipo
            ? "Todavía no tienes menú tipo: se muestran sugerencias con tu despensa. Guarda tus platos habituales en Mi despensa › Platos."
            : "Tu menú tipo es fijo. Cada día cambia solo lo que está en amarillo."}
        </p>

        <section className="flex flex-col">
          {datos.dias.map((x) => {
            const t = TIPO_MENU[x.plan.objetivo.tipo];
            const entreno = x.entrenos.filter((e) => e.deporte !== "fuerza" && e.deporte !== "descanso" && e.duracion_min > 0);
            const cambios = x.menu.comidas
              .map((c) => ({ c, v: c.items.filter((i) => i.varia) }))
              .filter(({ v }) => v.length > 0)
              .map(({ c, v }) => `${NOMBRE_MOMENTO[c.momento]}: ${v.map((i) => `${i.medida_casera} ${i.nombre.split(" (")[0].replace(/ cocid[oa]$/i, "").toLowerCase()}`).join(", ")}`);
            return (
              <Link key={x.fecha} href={`/menu/${x.fecha}`} className="flex flex-col gap-1 border-b border-linea py-3 text-texto no-underline last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <strong>
                    {x.fecha === hoy ? "Hoy" : fechaLarga(x.fecha)}{" "}
                    <span className="text-[13px] font-normal text-tenue">
                      · {entreno.length ? entreno.map((e) => `${NOMBRE_DEPORTE[e.deporte].toLowerCase()} ${duracion(e.duracion_min)}`).join(" + ") : "descanso"}
                    </span>
                  </strong>
                  <span className="rounded-full border px-2 text-[10px] font-bold tracking-[0.08em] whitespace-nowrap" style={{ color: t.color, borderColor: t.color }}>
                    {x.plan.carrera?.modo === "carga" ? "CARGA" : t.nombre.toUpperCase()}
                  </span>
                </div>
                <span className="text-[13px] text-carbo">{cambios.join(" · ")}</span>
                <span className="text-xs text-tenue">
                  {miles(x.plan.objetivo.kcal)} kcal · {x.plan.objetivo.carboG} g C
                </span>
              </Link>
            );
          })}
        </section>

        <Link href={dias === 14 ? "/menu/compras?dias=14" : "/menu/compras"} className="rounded-xl bg-marca py-4 text-center font-extrabold tracking-[0.04em] text-fondo no-underline">
          LISTA DE COMPRAS
        </Link>
        <span className="text-xs text-tenue">Si el coach cambia un entreno, el menú del día se recalcula solo. TrainingPeaks comparte unas 2 semanas: más allá, los días salen como descanso.</span>
      </Pantalla>
      <NavBar activa="comidas" />
    </>
  );
}
