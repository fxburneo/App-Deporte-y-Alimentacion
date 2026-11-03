"use client";

// Lista de Mi despensa con buscador y pestañas Alimentos / Platos.
import Link from "next/link";
import { useState } from "react";
import { totales } from "@/lib/comidas/alimentos";
import { NOMBRE_COMIDA } from "@/lib/datos/tipos";
import type { PlatoFila } from "@/lib/datos/despensa";
import type { AlimentoDespensa } from "@/lib/despensa/calculos";
import { miles } from "@/lib/formato";
import { COMIDAS } from "@/lib/nutricion/motor";
import { asignarMenuTipo, borrarAlimento, borrarPlato } from "./actions";

const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function ListaDespensa(props: { alimentos: AlimentoDespensa[]; platos: PlatoFila[]; tabInicial: "alimentos" | "platos" }) {
  const [tab, setTab] = useState(props.tabInicial);
  const [q, setQ] = useState("");
  const coincide = (t: string) => normal(t).includes(normal(q.trim()));
  const conMarca = props.alimentos.filter((a) => a.tipo === "marca" && coincide(`${a.nombre} ${a.marca ?? ""}`));
  const genericos = props.alimentos.filter((a) => a.tipo === "generico" && coincide(a.nombre));
  const platos = props.platos.filter((p) => coincide(`${p.nombre} ${p.alimentos.map((a) => a.nombre).join(" ")}`));

  const porcion = (a: AlimentoDespensa) => {
    const f = a.porcion_g / 100;
    return { c: Math.round(a.carbo_100 * f), p: Math.round(a.proteina_100 * f), g: Math.round(a.grasa_100 * f) };
  };
  const fila = (a: AlimentoDespensa) => {
    const m = porcion(a);
    return (
      <details key={a.id} className="border-b border-linea py-2.5 last:border-0">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <strong>{a.nombre}</strong>
            <span className="text-xs text-tenue">{a.marca ? `${a.marca} · ` : ""}{a.porcion_nombre}</span>
          </span>
          <span className="flex flex-col items-end leading-tight">
            <span className="font-display text-lg font-semibold">{miles(m.c * 4 + m.p * 4 + m.g * 9)}</span>
            <span className="text-[11px] whitespace-nowrap text-tenue">{m.c} C · {m.p} P · {m.g} G</span>
          </span>
        </summary>
        <div className="mt-2 flex items-center justify-between text-xs text-tenue">
          <span>Por 100 g: {a.carbo_100} C · {a.proteina_100} P · {a.grasa_100} G · cuenta como {a.categoria}</span>
          <form action={borrarAlimento}>
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" className="underline">Borrar</button>
          </form>
        </div>
      </details>
    );
  };

  return (
    <>
      <header className="flex items-center justify-between">
        <Link href="/comidas" className="min-w-[70px] py-2.5 font-semibold text-tenue">‹ Comidas</Link>
        <h1 className="font-display text-2xl font-bold tracking-[0.04em]">MI DESPENSA</h1>
        <Link href="/despensa/nuevo" className="min-w-[70px] text-right font-bold text-marca">+ Agregar</Link>
      </header>

      <div role="tablist" className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-borde">
        {(["alimentos", "platos"] as const).map((t, i) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`p-2.5 ${i > 0 ? "border-l border-borde" : ""} ${tab === t ? "bg-texto font-bold text-fondo" : "bg-superficie font-semibold text-suave"}`}
          >
            {t === "alimentos" ? `Alimentos (${props.alimentos.length})` : `Platos (${props.platos.length})`}
          </button>
        ))}
      </div>

      <label htmlFor="buscar" className="sr-only">Buscar</label>
      <input
        id="buscar"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={tab === "alimentos" ? "Buscar alimento o marca" : "Buscar plato"}
        className="rounded-[10px] border border-borde bg-superficie px-3 py-2.5 text-texto placeholder:text-tenue"
      />

      {tab === "alimentos" ? (
        <>
          <section className="flex flex-col">
            <span className="etiqueta pb-1">Con marca · de la etiqueta</span>
            {conMarca.length ? conMarca.map(fila) : <p className="text-sm text-tenue">Todavía no hay. Agrega uno con la foto de su etiqueta.</p>}
          </section>
          <section className="flex flex-col">
            <span className="etiqueta pb-1">Genéricos · tablas de nutrición</span>
            {genericos.map(fila)}
          </section>
        </>
      ) : (
        <section className="flex flex-col">
          {platos.length === 0 && (
            <p className="text-sm text-tenue">Todavía no hay platos. En Comidas, abre un registro y toca «Guardar como plato».</p>
          )}
          {platos.map((p) => {
            const t = totales(p.alimentos);
            return (
              <div key={p.id} className="flex flex-col gap-2 border-b border-linea py-3 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <strong>
                      {p.nombre}
                      {p.menu_tipo && <span className="ml-2 text-[11px] font-bold uppercase text-marca">menú tipo · {NOMBRE_COMIDA[p.menu_tipo]}</span>}
                    </strong>
                    <span className="text-xs text-tenue">{p.alimentos.map((a) => `${a.nombre} ${Math.round(a.gramos)} g`).join(" · ")}</span>
                  </span>
                  <span className="flex flex-col items-end leading-tight">
                    <span className="font-display text-lg font-semibold">{miles(t.kcal)}</span>
                    <span className="text-[11px] whitespace-nowrap text-tenue">{Math.round(t.carboG)} C · {Math.round(t.proteinaG)} P · {Math.round(t.grasaG)} G</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <form action={asignarMenuTipo} className="flex flex-1 items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <label htmlFor={`mt-${p.id}`} className="text-xs text-tenue">Menú tipo de</label>
                    <select
                      id={`mt-${p.id}`}
                      name="comida"
                      defaultValue={p.menu_tipo ?? ""}
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      className="rounded-[8px] border border-borde bg-superficie px-2 py-1.5 text-texto"
                    >
                      <option value="">ninguna</option>
                      {COMIDAS.map((c) => (
                        <option key={c} value={c}>{NOMBRE_COMIDA[c]}</option>
                      ))}
                    </select>
                  </form>
                  <form action={borrarPlato}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="text-xs text-tenue underline">Borrar</button>
                  </form>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
