"use client";

// Editar un registro (maqueta 2c.2): cambiar la comida a la que pertenece,
// ajustar cantidades, quitar y agregar alimentos (con la IA o desde la
// despensa) y borrar el registro.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cambiarGramos, totales, type Alimento } from "@/lib/comidas/alimentos";
import { aAlimento, type AlimentoDespensa } from "@/lib/despensa/calculos";
import { NOMBRE_MOMENTO } from "@/lib/datos/tipos";
import { miles } from "@/lib/formato";
import { MOMENTOS, type Momento } from "@/lib/nutricion/motor";
import { analizar, borrarComida, editarComida } from "../../../registrar/actions";

const CORTO: Partial<Record<Momento, string>> = { pre_entreno: "Antes", durante: "Durante" };

// Paso de los botones − y +: una unidad de la despensa, o un cuarto de la
// cantidad original (mínimo 5 g) para lo que leyó la IA.
const pasoInicial = (a: Alimento) => Math.max(5, Math.round(a.gramos / 4 / 5) * 5);

interface Fila {
  a: Alimento;
  fuente: AlimentoDespensa | null;
  paso: number;
}

export default function EditarRegistro(props: {
  id: number;
  comida: Momento;
  alimentosIniciales: Alimento[];
  volver?: string;
  fechaTexto?: string;
  despensa?: AlimentoDespensa[];
}) {
  const router = useRouter();
  const volver = props.volver ?? "/comidas";
  const [momento, setMomento] = useState<Momento>(props.comida);
  const [filas, setFilas] = useState<Fila[]>(props.alimentosIniciales.map((a) => ({ a, fuente: null, paso: pasoInicial(a) })));
  const [editando, setEditando] = useState<number | null>(null);
  const [modo, setModo] = useState<"texto" | "despensa">("texto");
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, start] = useTransition();
  const alimentos = filas.map((f) => f.a);
  const t = totales(alimentos);

  const cambiar = (i: number, signo: 1 | -1) =>
    setFilas((l) =>
      l.map((f, j) => {
        if (j !== i) return f;
        const g = Math.max(f.paso / 2, f.a.gramos + signo * f.paso);
        return { ...f, a: f.fuente ? aAlimento(f.fuente, g) : cambiarGramos(f.a, g) };
      })
    );
  const fijarGramos = (i: number, g: number) =>
    setFilas((l) => l.map((f, j) => (j === i && g > 0 ? { ...f, a: f.fuente ? aAlimento(f.fuente, g) : cambiarGramos(f.a, g) } : f)));
  const quitar = (i: number) => setFilas((l) => l.filter((_, j) => j !== i));

  const agregarConIA = () => {
    if (texto.trim().length < 3) return;
    setError(null);
    const fd = new FormData();
    fd.set("texto", texto);
    start(async () => {
      const r = await analizar(fd);
      if (!r.ok) return setError(r.error);
      setFilas((l) => [...l, ...r.analisis.alimentos.map((a) => ({ a, fuente: null, paso: pasoInicial(a) }))]);
      setAviso(r.analisis.preguntas.length ? `La IA supuso lo más común. Si no es así, ajusta: ${r.analisis.preguntas.map((p) => p.texto).join(" ")}` : null);
      setTexto("");
    });
  };
  const agregarDespensa = (d: AlimentoDespensa) => {
    const paso = d.unidad_g ?? d.porcion_g;
    setFilas((l) => [...l, { a: aAlimento(d, paso), fuente: d, paso }]);
    setQ("");
  };
  const encontrados =
    q.trim().length >= 2
      ? (props.despensa ?? []).filter((d) => `${d.nombre} ${d.marca ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6)
      : [];

  const guardar = () =>
    start(async () => {
      const r = await editarComida(props.id, alimentos, momento);
      if (!r.ok) return setError(r.error);
      router.push(volver);
    });
  const borrar = () =>
    start(async () => {
      const fd = new FormData();
      fd.set("id", String(props.id));
      await borrarComida(fd);
      router.push(volver);
    });

  const boton = "flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border border-borde bg-superficie";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-[18px] px-[18px] pt-[max(18px,env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between">
        <Link href={volver} className="min-w-[70px] py-2.5 font-semibold text-tenue">Cancelar</Link>
        <div className="flex flex-col items-center">
          <h1 className="font-display text-2xl font-bold tracking-[0.04em]">EDITAR</h1>
          {props.fechaTexto && <span className="text-xs font-bold text-carbo">{props.fechaTexto}</span>}
        </div>
        <span className="min-w-[70px]" />
      </header>

      <section className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-suave">Es de</span>
        <div className="flex flex-wrap gap-1.5">
          {MOMENTOS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={m === momento}
              onClick={() => setMomento(m)}
              className={`rounded-full border px-2.5 py-1.5 text-xs whitespace-nowrap ${m === momento ? "border-texto bg-texto font-bold text-fondo" : "border-borde text-tenue"}`}
            >
              {CORTO[m] ?? NOMBRE_MOMENTO[m]}
            </button>
          ))}
        </div>
        <span className="text-xs text-tenue">Cámbiala si la guardaste en otra comida (por ejemplo, la recuperación como media mañana).</span>
      </section>

      <section className="flex flex-col">
        <div className="flex items-baseline justify-between pb-1">
          <span className="etiqueta">Alimentos</span>
          <span className="text-xs text-tenue">toca el nombre para escribir los gramos</span>
        </div>
        {filas.map((f, i) => (
          <div key={i} className="border-b border-linea py-2.5 last:border-0">
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={() => setEditando(editando === i ? null : i)} className="flex min-w-0 flex-1 flex-col text-left">
                <strong className="truncate">{f.a.nombre}</strong>
                <span className="font-display text-[13px] font-semibold">
                  <span className="text-carbo">{Math.round(f.a.carbo_g)} C</span> <span className="text-proteina">{Math.round(f.a.proteina_g)} P</span>{" "}
                  <span className="text-grasa">{Math.round(f.a.grasa_g)} G</span>
                </span>
              </button>
              <button type="button" aria-label={`Menos ${f.a.nombre}`} onClick={() => cambiar(i, -1)} className={boton}>−</button>
              <span className="min-w-16 text-center font-display text-base font-semibold">{f.fuente ? f.a.medida_casera : `${Math.round(f.a.gramos)} g`}</span>
              <button type="button" aria-label={`Más ${f.a.nombre}`} onClick={() => cambiar(i, 1)} className={boton}>+</button>
              <button type="button" aria-label={`Quitar ${f.a.nombre}`} onClick={() => quitar(i)} disabled={filas.length <= 1} className="pl-1 text-lg text-tenue disabled:opacity-30">×</button>
            </div>
            {editando === i && (
              <div className="mt-2 flex items-center gap-2">
                <label htmlFor={`g-${i}`} className="text-sm text-tenue">Gramos</label>
                <input
                  id={`g-${i}`}
                  inputMode="numeric"
                  defaultValue={Math.round(f.a.gramos)}
                  onBlur={(e) => fijarGramos(i, Number(e.target.value.replace(",", ".")))}
                  className="w-24 rounded-[10px] border border-borde bg-superficie px-3 py-1.5 font-display text-lg text-texto"
                />
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2.5 rounded-[14px] bg-superficie px-4 py-3.5">
        <span className="etiqueta">+ Agregar alimento</span>
        <div role="tablist" className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-borde">
          {(["texto", "despensa"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => setModo(m)} className={`py-2 ${modo === m ? "bg-texto font-bold text-fondo" : "bg-fondo font-semibold text-suave"}`}>
              {m === "texto" ? "Escribir" : "Mi despensa"}
            </button>
          ))}
        </div>
        {modo === "texto" ? (
          <div className="flex gap-2">
            <label htmlFor="agregar" className="sr-only">Qué agregar</label>
            <input id="agregar" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej.: 1 pan de hamburguesa" className="min-w-0 flex-1 rounded-[10px] border border-borde bg-fondo px-3 py-2 text-texto" />
            <button type="button" onClick={agregarConIA} disabled={ocupado || texto.trim().length < 3} className="rounded-[10px] bg-marca px-3.5 font-extrabold text-fondo disabled:opacity-50">
              {ocupado ? "…" : "Agregar"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="buscar" className="sr-only">Buscar en mi despensa</label>
            <input id="buscar" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en mi despensa" className="rounded-[10px] border border-borde bg-fondo px-3 py-2 text-texto" />
            {encontrados.map((d) => (
              <button key={d.id} type="button" onClick={() => agregarDespensa(d)} className="flex justify-between gap-2 border-b border-linea py-1.5 text-left last:border-0">
                <span>{d.nombre}{d.marca ? <span className="text-tenue"> · {d.marca}</span> : null}</span>
                <span className="text-sm font-bold text-marca">+ {d.unidad_nombre ?? d.porcion_nombre}</span>
              </button>
            ))}
          </div>
        )}
        <span className="text-xs text-tenue">{modo === "texto" ? "La IA calcula solo lo nuevo; lo demás no cambia." : "Se agrega 1 unidad o 1 porción; después ajustas con − y +."}</span>
        {aviso && <span className="text-xs text-carbo">{aviso}</span>}
      </section>

      <div className="flex items-baseline justify-between">
        <span className="text-tenue">Total</span>
        <span className="font-display text-[22px] font-bold">
          {miles(t.kcal)} kcal <span className="text-sm font-semibold text-tenue">· {Math.round(t.carboG)} C · {Math.round(t.proteinaG)} P · {Math.round(t.grasaG)} G</span>
        </span>
      </div>
      {error && <p role="alert" className="text-sm text-mal">{error}</p>}
      <button type="button" onClick={guardar} disabled={ocupado} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-50">
        {ocupado ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
      </button>
      <button type="button" onClick={borrar} disabled={ocupado} className="py-1 text-sm text-tenue underline">Borrar este registro</button>
    </main>
  );
}
