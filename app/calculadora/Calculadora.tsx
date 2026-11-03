"use client";

// Calculadora del plato: eliges qué hay y te dice los gramos de cada alimento.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { totales } from "@/lib/comidas/alimentos";
import { NOMBRE_COMIDA } from "@/lib/datos/tipos";
import { aAlimento, calcularPlato, type AlimentoDespensa } from "@/lib/despensa/calculos";
import { kcalDe, type Macros } from "@/lib/nutricion/ajuste";
import { COMIDAS, type Comida } from "@/lib/nutricion/motor";
import { guardarComida } from "../registrar/actions";

const PAPEL = { proteina: "cubre la proteína", carbo: "cubre el carbohidrato", grasa: "completa la grasa", mixto: "va en su porción", libre: "libre: casi no suma" };
const COLOR = { proteina: "text-proteina", carbo: "text-carbo", grasa: "text-grasa", mixto: "text-texto", libre: "text-tenue" };
const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Calculadora(props: { objetivos: Record<Comida, Macros>; despensa: AlimentoDespensa[]; inicial: Comida }) {
  const router = useRouter();
  const [comida, setComida] = useState<Comida>(props.inicial);
  const [plato, setPlato] = useState<AlimentoDespensa[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, startGuardar] = useTransition();
  const objetivo = props.objetivos[comida];

  const resultado = useMemo(() => {
    if (plato.length === 0) return null;
    const g = calcularPlato(objetivo, plato);
    const items = plato.map((a, i) => ({ a, gramos: g[i].gramos }));
    const registrables = items.filter((x) => x.gramos > 0).map((x) => aAlimento(x.a, x.gramos));
    return { items, registrables, t: totales(registrables) };
  }, [plato, objetivo]);

  const busca = normal(q.trim());
  const opciones = busca
    ? props.despensa.filter((a) => !plato.some((p) => p.id === a.id) && normal(`${a.nombre} ${a.marca ?? ""}`).includes(busca)).slice(0, 6)
    : [];

  const registrar = () => {
    if (!resultado || resultado.registrables.length === 0) return;
    setError(null);
    startGuardar(async () => {
      const r = await guardarComida({ comida, origen: "repetida", descripcion: "Calculadora", alimentos: resultado.registrables });
      if (!r.ok) return setError(r.error);
      router.push("/comidas");
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-[18px] px-[18px] pt-[max(18px,env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="py-2.5 font-semibold text-tenue">‹ Volver</Link>
        <h1 className="font-display text-2xl font-bold tracking-[0.04em]">¿CUÁNTO ME SIRVO?</h1>
        <span className="w-[50px]" />
      </header>

      <div className="-mx-[18px] flex gap-1.5 overflow-x-auto px-[18px] pb-0.5">
        {COMIDAS.map((c) => (
          <button key={c} type="button" aria-pressed={comida === c} onClick={() => setComida(c)}
            className={`flex-none rounded-full border px-3 py-2 text-[13px] whitespace-nowrap ${comida === c ? "border-texto bg-texto font-bold text-fondo" : "border-borde text-tenue"}`}>
            {NOMBRE_COMIDA[c]}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-2 rounded-[14px] bg-superficie px-4 py-3.5">
        <span className="etiqueta">Objetivo de {NOMBRE_COMIDA[comida].toLowerCase()} · ya ajustado</span>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-[30px] font-bold">{kcalDe(objetivo)} <span className="text-base text-tenue">kcal</span></span>
          <span className="font-display text-lg font-semibold">
            <span className="text-carbo">{objetivo.carboG} C</span>{"  "}<span className="text-proteina">{objetivo.proteinaG} P</span>{"  "}<span className="text-grasa">{objetivo.grasaG} G</span>
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="agregar" className="etiqueta">¿Qué hay en el plato?</label>
        <input id="agregar" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Agregar de tu despensa: pollo, arroz, aguacate..."
          className="rounded-[10px] border border-borde bg-superficie px-3 py-2.5 text-texto placeholder:text-tenue" />
        {opciones.map((a) => (
          <button key={a.id} type="button" onClick={() => { setPlato((p) => [...p, a]); setQ(""); }}
            className="flex items-center justify-between border-b border-linea py-2 text-left last:border-0">
            <span>{a.nombre}{a.marca ? <span className="text-tenue"> · {a.marca}</span> : null}</span>
            <span className="text-xl text-marca">+</span>
          </button>
        ))}
        {busca && opciones.length === 0 && <span className="text-xs text-tenue">No está en tu despensa. Agrégalo en Comidas › Mi despensa.</span>}
      </section>

      {resultado && (
        <section className="flex flex-col">
          {resultado.items.map(({ a, gramos }) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border-b border-linea py-2.5 last:border-0">
              <span className="flex flex-col">
                <strong>{a.nombre}</strong>
                <span className="text-xs text-tenue">
                  {PAPEL[a.categoria]} ·{" "}
                  <button type="button" onClick={() => setPlato((p) => p.filter((x) => x.id !== a.id))} className="underline">quitar</button>
                </span>
              </span>
              {a.categoria === "libre" ? (
                <span className="font-display text-lg text-tenue">a gusto</span>
              ) : (
                <span className="flex flex-col items-end leading-tight">
                  <span className={`font-display text-[22px] font-bold ${COLOR[a.categoria]}`}>{gramos} g</span>
                  <span className="text-[11px] text-tenue">{aAlimento(a, gramos).medida_casera}</span>
                </span>
              )}
            </div>
          ))}
          <p className="pt-2 text-sm text-suave">
            Total: {resultado.t.kcal} kcal · {Math.round(resultado.t.carboG)} C · {Math.round(resultado.t.proteinaG)} P · {Math.round(resultado.t.grasaG)} G.
            {!plato.some((a) => a.categoria === "proteina") && " Falta un alimento con proteína para cubrirla."}
          </p>
        </section>
      )}

      {error && <p className="text-sm text-mal">{error}</p>}
      {resultado && (
        <>
          <button type="button" onClick={registrar} disabled={guardando} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-50">
            {guardando ? "GUARDANDO..." : "LO COMÍ: REGISTRAR"}
          </button>
          <Link href="/" className="rounded-xl border border-marca py-3.5 text-center font-extrabold tracking-[0.04em] text-marca">SOLO ERA PARA SABER</Link>
        </>
      )}
    </main>
  );
}
