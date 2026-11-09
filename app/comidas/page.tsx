// Pantalla Comidas (maqueta 2.4, vista del día): lo comido contra el
// objetivo, dónde ajustar, los últimos 7 días y los registros de hoy.
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerDatosDia, leerSemana } from "@/lib/datos/dia";
import { planDelDia } from "@/lib/datos/planDia";
import { NOMBRE_COMIDA, NOMBRE_MOMENTO } from "@/lib/datos/tipos";
import { esEditable, fechaHistorial, fechaLarga, horaEcuador, hoyEcuador, sumarDias } from "@/lib/fecha";
import { miles } from "@/lib/formato";
import { dondeAjustar, porcentajeDelObjetivo } from "@/lib/comidas/resumen";
import { kcalDe } from "@/lib/nutricion/ajuste";
import { MOMENTOS, NOMBRE_TIPO } from "@/lib/nutricion/motor";
import { borrarComida } from "../registrar/actions";
import { guardarRegistroComoPlato } from "../despensa/actions";

const NUTRIENTE = {
  carbo: { nombre: "Carbohidrato", color: "text-carbo" },
  proteina: { nombre: "Proteína", color: "text-proteina" },
  grasa: { nombre: "Grasa", color: "text-grasa" },
};
const ORIGEN = { foto: "foto", texto: "texto", repetida: "repetida" };
const DIA_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function Comidas({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  // ?fecha= muestra un día anterior: se puede corregir hasta 7 días atrás.
  const hoyEc = hoyEcuador();
  const fecha = fechaHistorial((await searchParams).fecha, hoyEc);
  const esHoy = fecha === hoyEc;
  const editable = esEditable(fecha, hoyEc);
  const q = esHoy ? "" : `?fecha=${fecha}`;
  const d = await leerDatosDia(fecha);
  if (!d.perfil) redirect("/bienvenida");
  const plan = planDelDia({ ...d, perfil: d.perfil });
  if (!plan) redirect("/peso");
  const semana = await leerSemana(d.fecha);

  const { objetivo, totalConsumido, consumido, reparto } = plan;
  const kcalComidas = Math.round(kcalDe(totalConsumido));
  const desvios = dondeAjustar(reparto, consumido);

  // Últimos 7 días: % del objetivo de cada día (solo días con registros).
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(d.fecha, i - 6)).map((f) => {
    const comidasDia = semana.comidas.filter((c) => c.fecha === f);
    const p = planDelDia({
      fecha: f,
      perfil: d.perfil!,
      pesos: d.pesos.filter((x) => x.fecha <= f),
      entrenosHoy: semana.entrenos.filter((e) => e.fecha === f),
      entrenosManana: semana.entrenos.filter((e) => e.fecha === sumarDias(f, 1)),
      comidas: comidasDia,
    });
    const pct = p && comidasDia.length ? porcentajeDelObjetivo(kcalDe(p.totalConsumido), p.objetivo.kcal) : null;
    return { f, pct, hoy: f === hoyEc, elegido: f === d.fecha };
  });

  const registros = [...d.comidas].sort((a, b) => MOMENTOS.indexOf(a.comida) - MOMENTOS.indexOf(b.comida) || a.creado_en.localeCompare(b.creado_en));

  return (
    <>
      <Pantalla>
        <header className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="flex items-center gap-2 text-[13px] text-tenue">
              <Link href={`/comidas?fecha=${sumarDias(fecha, -1)}`} aria-label="Día anterior" className="px-1 text-base font-bold text-texto">‹</Link>
              <span className={esHoy ? "" : "font-bold text-carbo"}>{esHoy ? "Hoy" : fechaLarga(d.fecha)} · {NOMBRE_TIPO[objetivo.tipo].toLowerCase()}</span>
              {!esHoy && (
                <Link href={sumarDias(fecha, 1) >= hoyEc ? "/comidas" : `/comidas?fecha=${sumarDias(fecha, 1)}`} aria-label="Día siguiente" className="px-1 text-base font-bold text-texto">›</Link>
              )}
            </span>
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-[0.04em]">COMIDAS</h1>
          </div>
          {editable && <Link href={`/registrar${q}`} className="pb-1 font-bold text-marca">+ Registrar</Link>}
        </header>
        {!esHoy && (
          <p className="-mt-2 text-sm text-suave">
            {editable ? "Día anterior: puedes registrar, corregir o borrar comidas." : "Solo lectura: se puede corregir hasta 7 días atrás."}{" "}
            <Link href="/comidas" className="font-bold text-marca">Volver a hoy</Link>
          </p>
        )}

        <nav className="grid grid-cols-2 gap-2.5">
          <Link href="/despensa" className="rounded-[12px] border border-borde px-3 py-2.5 text-center font-semibold">Mi despensa ›</Link>
          <Link href="/calculadora" className="rounded-[12px] border border-borde px-3 py-2.5 text-center font-semibold">¿Cuánto me sirvo? ›</Link>
        </nav>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[52px] font-bold leading-none">{miles(kcalComidas)}</span>
            <span className="font-display text-[22px] text-tenue">/ {miles(objetivo.kcal)} kcal</span>
          </div>
          <Barra nombre="Carbohidratos" real={totalConsumido.carboG} obj={objetivo.carboG} color="bg-carbo" />
          <Barra nombre="Proteína" real={totalConsumido.proteinaG} obj={objetivo.proteinaG} color="bg-proteina" />
          <Barra nombre="Grasa" real={totalConsumido.grasaG} obj={objetivo.grasaG} color="bg-grasa" />
        </section>

        {esHoy && desvios.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <span className="etiqueta">Dónde ajustar</span>
            {desvios.map((x) => (
              <div key={x.nutriente} className="flex gap-3.5 rounded-[14px] bg-superficie px-4 py-3">
                <span className={`w-[58px] flex-none font-display text-xl font-bold ${NUTRIENTE[x.nutriente].color}`}>
                  {x.diferenciaG > 0 ? "+" : "−"}{Math.abs(x.diferenciaG)} g
                </span>
                <span className="flex flex-col">
                  <strong>{NUTRIENTE[x.nutriente].nombre} {x.diferenciaG > 0 ? "de más" : "corta"}</strong>
                  <span className="text-sm text-tenue">
                    Sobre todo en {NOMBRE_COMIDA[x.comida].toLowerCase()} ({x.diferenciaComidaG > 0 ? "+" : ""}{x.diferenciaComidaG} g).{" "}
                    {x.diferenciaG > 0 ? "Lo que queda del día ya viene ajustado en Hoy." : "Súmalo en la siguiente comida."}
                  </span>
                </span>
              </div>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className="etiqueta">Últimos 7 días</span>
            <span className="text-xs text-tenue">% del objetivo</span>
          </div>
          <div className="grid h-[120px] grid-cols-7 items-end gap-2">
            {dias.map((x) => (
              <Link key={x.f} href={x.hoy ? "/comidas" : `/comidas?fecha=${x.f}`} aria-label={`Ver ${fechaLarga(x.f)}`} className="flex h-full flex-col items-center justify-end gap-1 text-texto no-underline">
                <span className="text-[11px] text-tenue">{x.pct != null ? `${x.pct}` : ""}</span>
                <div
                  className={`w-full rounded-t-[4px] ${x.pct == null ? "bg-linea" : x.pct > 110 || x.pct < 80 ? "bg-carbo" : "bg-bien"} ${x.hoy ? "opacity-100" : "opacity-80"}`}
                  style={{ height: `${x.pct == null ? 4 : Math.max(6, Math.min(100, x.pct) * 0.8)}px` }}
                />
                <span className={`text-[11px] ${x.elegido ? "font-bold text-texto underline" : "text-tenue"}`}>{x.hoy ? "Hoy" : DIA_CORTO[new Date(x.f + "T12:00:00Z").getUTCDay()]}</span>
              </Link>
            ))}
          </div>
          <span className="text-xs text-tenue">Verde: entre 80 y 110 % del objetivo. Toca un día para ver o corregir sus comidas.</span>
        </section>

        <section className="flex flex-col">
          <span className="etiqueta pb-1.5">{esHoy ? "Registros de hoy" : `Registros del ${fechaLarga(d.fecha).toLowerCase()}`}</span>
          {registros.length === 0 ? (
            <p className="text-sm text-tenue">
              {esHoy ? "Todavía no registras nada hoy." : "No hay registros ese día."}{" "}
              {editable && <Link href={`/registrar${q}`} className="font-bold text-texto">Registrar comida ›</Link>}
            </p>
          ) : (
            registros.map((r) => (
              <details key={r.id} className="border-b border-linea py-3 last:border-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <strong>{NOMBRE_MOMENTO[r.comida]} <span className="text-sm font-normal text-tenue">· {ORIGEN[r.origen]} · {horaEcuador(r.creado_en)}</span></strong>
                    <span className="text-xs text-tenue">{r.alimentos.map((a) => a.nombre).join(", ")}</span>
                  </span>
                  <span className="font-display text-xl font-semibold">{miles(r.kcal)}</span>
                </summary>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {r.alimentos.map((a, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>{a.nombre} <span className="text-tenue">· {Math.round(a.gramos)} g · {a.medida_casera}</span></span>
                      <span className="whitespace-nowrap font-display">
                        <span className="text-carbo">{Math.round(a.carbo_g)}</span> <span className="text-proteina">{Math.round(a.proteina_g)}</span>{" "}
                        <span className="text-grasa">{Math.round(a.grasa_g)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <form action={guardarRegistroComoPlato} className="flex items-center gap-1.5">
                    <input type="hidden" name="comida_id" value={r.id} />
                    <label htmlFor={`pl-${r.id}`} className="sr-only">Nombre del plato</label>
                    <input id={`pl-${r.id}`} name="nombre" defaultValue={`${NOMBRE_MOMENTO[r.comida]} habitual`} className="w-36 rounded-[8px] border border-borde bg-superficie px-2 py-1 text-texto" />
                    <button type="submit" className="font-bold text-marca">Guardar como plato</button>
                  </form>
                  {editable && (
                  <span className="flex gap-3">
                    <Link href={`/comidas/${r.id}/editar`} className="font-bold text-texto underline">Editar</Link>
                    <form action={borrarComida}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="text-tenue underline">Borrar</button>
                    </form>
                  </span>
                  )}
                </div>
              </details>
            ))
          )}
        </section>
      </Pantalla>
      <NavBar activa="comidas" />
    </>
  );
}

function Barra({ nombre, real, obj, color }: { nombre: string; real: number; obj: number; color: string }) {
  const pct = obj > 0 ? Math.min(100, (real / obj) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-tenue">{nombre}</span>
        <span className="font-display text-base font-semibold">
          {Math.round(real)} <span className="text-tenue">/ {obj} g</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-sm bg-linea">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
