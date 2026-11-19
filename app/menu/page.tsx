// Plan (maqueta R3, antes "Menú de la semana"): accesos a compras, platos,
// despensa y calculadora, y la semana con lo que cambia cada día según el
// plan de TrainingPeaks (en amarillo). Toca un día para ver su menú.
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
  const dias = (await searchParams).dias === "14" ? 14 : 7; // ?dias=14 sigue funcionando desde Compras
  const hoy = hoyEcuador();
  const datos = await leerMenuSemana(dias, hoy);
  if (!datos) redirect("/");
  const sinMenuTipo = datos.dias[0]?.menu.comidas.every((c) => !c.deMenuTipo);

  return (
    <>
      <Pantalla>
        <header className="flex items-end justify-between">
          <h1 className="font-display text-[30px] font-bold leading-none tracking-[0.03em]">PLAN</h1>
          <span className="text-sm text-tenue">{fechaCorta(hoy)} – {fechaCorta(sumarDias(hoy, dias - 1))}</span>
        </header>
        <div className="grid grid-cols-2 gap-2.5">
          <Acceso href="/menu/compras" titulo="Lista de compras" sub="7 o 14 días" destacado icono={<path d="M3 4h2l2.5 11h11L21 7H6.2M9 20h.01M18 20h.01" />} />
          <Acceso href="/despensa?tab=platos" titulo="Mis platos" sub="tu plato de siempre" icono={<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /></>} />
          <Acceso href="/despensa" titulo="Despensa" sub="tus alimentos" icono={<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 12h16M10 8h4M10 16h4" /></>} />
          <Acceso href="/calculadora" titulo="¿Cuánto me sirvo?" sub="calculadora" icono={<path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z" />} />
        </div>
        <div className="-mb-2 flex items-baseline justify-between">
          <span className="etiqueta">Esta semana</span>
          <span className="text-xs text-tenue">toca un día para ver el menú</span>
        </div>
        {sinMenuTipo && (
          <p className="-mb-2 text-xs text-tenue">Todavía no tienes menú tipo: se muestran sugerencias con tu despensa. Guarda tus platos habituales en Mis platos.</p>
        )}

        <section className="flex flex-col gap-2">
          {datos.dias.map((x) => {
            const t = TIPO_MENU[x.plan.objetivo.tipo];
            const entreno = x.entrenos.filter((e) => e.deporte !== "fuerza" && e.deporte !== "descanso" && e.duracion_min > 0);
            const cambios = x.menu.comidas
              .map((c) => ({ c, v: c.items.filter((i) => i.varia) }))
              .filter(({ v }) => v.length > 0)
              .map(({ c, v }) => `${NOMBRE_MOMENTO[c.momento]}: ${v.map((i) => `${i.medida_casera} ${i.nombre.split(" (")[0].replace(/ cocid[oa]$/i, "").toLowerCase()}`).join(", ")}`);
            return (
              <Link key={x.fecha} href={`/menu/${x.fecha}`} className={`flex flex-col gap-1 rounded-[14px] border p-3 text-texto no-underline ${x.fecha === hoy ? "border-marca bg-superficie" : "border-linea"}`}>
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
                <span className="line-clamp-2 text-sm text-carbo">{cambios.join(" · ")}</span>
                <span className="text-xs text-tenue">
                  {miles(x.plan.objetivo.kcal)} kcal · {x.plan.objetivo.carboG} g C
                </span>
              </Link>
            );
          })}
        </section>

        <span className="text-xs text-tenue">Si el coach cambia un entreno, el menú del día se recalcula solo. TrainingPeaks comparte unas 2 semanas: más allá, los días salen como descanso.</span>
      </Pantalla>
      <NavBar activa="plan" />
    </>
  );
}

function Acceso({ href, titulo, sub, icono, destacado }: { href: string; titulo: string; sub: string; icono: React.ReactNode; destacado?: boolean }) {
  return (
    <Link href={href} className={`flex flex-col gap-1.5 rounded-[14px] p-3 text-texto no-underline ${destacado ? "border border-marca/50 bg-superficie" : "bg-superficie"}`}>
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={destacado ? "text-marca" : "text-tenue"}>
        {icono}
      </svg>
      <strong className="text-[15px]">{titulo}</strong>
      <span className="text-[13px] text-tenue">{sub}</span>
    </Link>
  );
}
