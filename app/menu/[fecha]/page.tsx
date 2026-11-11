// Menú de un día (maqueta 2d.2): el menú tipo con las cantidades de ese día;
// lo fijo en blanco, lo que cambia en amarillo.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerPerfil } from "@/lib/datos/dia";
import { leerMenuSemana } from "@/lib/datos/menu";
import { NOMBRE_DEPORTE, NOMBRE_MOMENTO } from "@/lib/datos/tipos";
import { fechaLarga, hoyEcuador, sumarDias } from "@/lib/fecha";
import { duracion, miles } from "@/lib/formato";
import { totalesItems } from "@/lib/menu/escalar";
import { TIPO_MENU } from "../estilo";

export default async function Page({ params }: { params: Promise<{ fecha: string }> }) {
  const fecha = (await params).fecha;
  const hoy = hoyEcuador();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < hoy || fecha > sumarDias(hoy, 13)) notFound();
  const datos = await leerMenuSemana(1, fecha);
  if (!datos) redirect("/");
  const x = datos.dias[0];
  const t = TIPO_MENU[x.plan.objetivo.tipo];
  const perfil = await leerPerfil();
  const horarios: Record<string, string> = perfil?.horarios_comida ?? {};
  const entreno = x.entrenos.filter((e) => e.deporte !== "fuerza" && e.deporte !== "descanso" && e.duracion_min > 0);
  const tipoArroz = ["duro", "muy_largo", "moderado"].includes(x.plan.objetivo.tipo) || x.plan.carrera?.modo === "carga" ? "blanco" : "integral";

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <Link href="/menu" className="min-w-[70px] py-2.5 font-semibold text-tenue">‹ Semana</Link>
          <h1 className="font-display text-2xl font-bold tracking-[0.04em]">{fecha === hoy ? "HOY" : fechaLarga(fecha).toUpperCase()}</h1>
          <span className="min-w-[70px]" />
        </header>
        <div className="-mt-2 flex items-center justify-between">
          <span className="text-suave">{entreno.length ? entreno.map((e) => `${NOMBRE_DEPORTE[e.deporte]} ${duracion(e.duracion_min)}`).join(" + ") : "Sin entreno"}</span>
          <span className="rounded-full border px-2 text-[10px] font-bold tracking-[0.08em]" style={{ color: t.color, borderColor: t.color }}>
            {x.plan.carrera?.modo === "carga" ? "CARGA" : t.nombre.toUpperCase()}
          </span>
        </div>
        <section className="flex flex-col gap-1 rounded-[14px] bg-superficie px-4 py-3.5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold">{miles(x.plan.objetivo.kcal)}</span>
            <span className="text-tenue">kcal objetivo</span>
          </div>
          <span className="font-display text-lg font-semibold">
            <span className="text-carbo">{x.plan.objetivo.carboG} C</span> <span className="text-proteina">{x.plan.objetivo.proteinaG} P</span>{" "}
            <span className="text-grasa">{x.plan.objetivo.grasaG} G</span>
          </span>
          <span className="text-xs text-tenue">
            El menú suma {miles(x.menu.total.carboG * 4 + x.menu.total.proteinaG * 4 + x.menu.total.grasaG * 9)} kcal: las cantidades van en unidades prácticas.
          </span>
        </section>

        <section className="flex flex-col">
          {x.menu.comidas.map((c, i) => {
            const m = totalesItems(c.items);
            const fijos = c.items.filter((it) => !it.varia);
            const varian = c.items.filter((it) => it.varia);
            const hora = horarios[c.momento] ?? "";
            const texto = (it: (typeof c.items)[number]) => (it.medida_casera === "a gusto" ? `${it.nombre.split(" (")[0]} a gusto` : `${it.nombre.split(" (")[0]} ${it.medida_casera}`);
            return (
              <div key={c.momento} className={`flex flex-col gap-0.5 py-3 ${i < x.menu.comidas.length - 1 ? "border-b border-linea" : ""}`}>
                <div className="flex justify-between gap-2">
                  <strong>
                    {NOMBRE_MOMENTO[c.momento]} <span className="text-[13px] font-normal text-tenue">{hora}</span>
                  </strong>
                  <span className="text-xs whitespace-nowrap text-tenue">
                    {Math.round(m.carboG)} C · {Math.round(m.proteinaG)} P · {Math.round(m.grasaG)} G
                  </span>
                </div>
                {fijos.length > 0 && <span className="text-[13px]">{fijos.map(texto).join(" · ")}</span>}
                {varian.length > 0 && <span className="text-[13px] font-bold text-carbo">{varian.map(texto).join(" · ")}</span>}
                {!c.deMenuTipo && c.momento !== "pre_entreno" && c.momento !== "durante" && <span className="text-xs text-tenue">Sugerido con tu despensa (esta comida no tiene menú tipo).</span>}
              </div>
            );
          })}
        </section>

        <section className="border-l-[3px] border-carbo py-0.5 pl-3">
          <span className="etiqueta text-carbo!">Arroz {tipoArroz}</span>
          <p className="text-sm text-suave">
            Integral en descanso y Z2: llena más con menos carbohidrato. Blanco en días intensos, largos, víspera de salida larga y carga: más carbohidrato con menos fibra. La papa sirve en cualquier día (1 taza de arroz ≈ 1½ papas).
          </p>
        </section>
      </Pantalla>
      <NavBar activa="comidas" />
    </>
  );
}
