"use client";

// Formulario de carrera (maqueta 4b.2): nombre, fecha, deporte, distancia,
// horas estimadas y prioridad. Abajo explica qué tipo de carga corresponde.
import Link from "next/link";
import { useActionState, useState } from "react";
import { tipoCarga, type DeporteCarrera, type Prioridad } from "@/lib/nutricion/carrera";
import { guardarCarrera } from "./actions";

export interface CarreraInicial {
  id?: number;
  nombre: string;
  fecha: string;
  deporte: DeporteCarrera;
  distancia_km: number | null;
  desnivel_m: number | null;
  horas_min: number;
  horas_max: number;
  prioridad: Prioridad;
}

const TEXTO_CARGA = {
  ninguna: "Menos de 3 h: no necesita carga especial, solo un buen desayuno.",
  corta: "3 a 5 h: 1 día de carga de carbohidratos.",
  larga: "5 a 12 h: 2 días de carga de carbohidratos.",
  ultra: "Más de 12 h: 2 días de carga y plan por horas con comida real.",
};

const campo = "rounded-[10px] border border-borde bg-superficie px-3 py-2.5 font-semibold text-texto";

export default function FormCarrera({ inicial }: { inicial: CarreraInicial }) {
  const [state, formAction, pending] = useActionState(guardarCarrera, { error: null });
  const [deporte, setDeporte] = useState<DeporteCarrera>(inicial.deporte);
  const [prioridad, setPrioridad] = useState<Prioridad>(inicial.prioridad);
  const [hMin, setHMin] = useState(inicial.horas_min);
  const [hMax, setHMax] = useState(inicial.horas_max);
  const medio = (hMin + hMax) / 2;
  const paso = (v: number, d: number) => Math.min(72, Math.max(0.5, Math.round((v + d) * 2) / 2));
  const editando = inicial.id != null;

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      <header className="flex items-center justify-between">
        <Link href="/carreras" className="min-w-[70px] py-2.5 font-semibold text-tenue">Cancelar</Link>
        <h1 className="font-display text-2xl font-bold tracking-[0.04em]">{editando ? "EDITAR CARRERA" : "NUEVA CARRERA"}</h1>
        <span className="min-w-[70px]" />
      </header>
      {editando && <input type="hidden" name="id" value={inicial.id} />}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-suave">Nombre</span>
        <input name="nombre" defaultValue={inicial.nombre} maxLength={80} required className={campo} placeholder="Ej.: Petzl 50K" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-suave">Fecha</span>
        <input type="date" name="fecha" defaultValue={inicial.fecha} required className={campo} />
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="pb-1.5 text-xs font-semibold text-suave">Deporte</legend>
        <input type="hidden" name="deporte" value={deporte} />
        <Segmento opciones={[["trail", "Trail"], ["ciclismo", "Ciclismo"], ["aventura", "Aventura"]]} valor={deporte} cambiar={(v) => setDeporte(v as DeporteCarrera)} />
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-suave">Distancia (km)</span>
          <input name="distancia_km" inputMode="decimal" defaultValue={inicial.distancia_km ?? ""} className={campo} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-suave">Desnivel (m+)</span>
          <input name="desnivel_m" inputMode="numeric" defaultValue={inicial.desnivel_m ?? ""} className={campo} placeholder="opcional" />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-1.5 text-xs font-semibold text-suave">¿Cuántas horas estimas?</legend>
        <input type="hidden" name="horas_min" value={hMin} />
        <input type="hidden" name="horas_max" value={hMax} />
        <div className="flex items-center justify-between">
          <span className="text-tenue">Entre</span>
          <Stepper valor={hMin} nombre="mínimo" menos={() => setHMin(paso(hMin, -0.5))} mas={() => { const v = paso(hMin, 0.5); setHMin(v); if (v > hMax) setHMax(v); }} />
          <span className="text-tenue">y</span>
          <Stepper valor={hMax} nombre="máximo" menos={() => { const v = paso(hMax, -0.5); setHMax(v); if (v < hMin) setHMin(v); }} mas={() => setHMax(paso(hMax, 0.5))} />
        </div>
        <span className="text-xs text-tenue">{TEXTO_CARGA[tipoCarga(medio)]} Se usa el punto medio ({String(medio).replace(".", ",")} h).</span>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="pb-1.5 text-xs font-semibold text-suave">Prioridad</legend>
        <input type="hidden" name="prioridad" value={prioridad} />
        <Segmento opciones={[["A", "A · objetivo"], ["B", "B · preparación"]]} valor={prioridad} cambiar={(v) => setPrioridad(v as Prioridad)} />
      </fieldset>

      <section className="border-l-[3px] border-carbo py-0.5 pl-3">
        <span className="etiqueta text-carbo!">{prioridad === "A" ? "Qué cambia con una carrera A" : "Carrera B"}</span>
        <p className="text-sm text-suave">
          {prioridad === "A"
            ? "Test de sudoración antes de los fondos largos, sin déficit las últimas 3 semanas y carga de carbohidratos antes de la carrera."
            : "Sigue el déficit normal; solo cambia la carga de carbohidratos antes de la carrera."}
        </p>
      </section>

      {state.error && <p role="alert" className="text-sm text-mal">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-60">
        {pending ? "GUARDANDO…" : "GUARDAR CARRERA"}
      </button>
    </form>
  );
}

function Segmento({ opciones, valor, cambiar }: { opciones: [string, string][]; valor: string; cambiar: (v: string) => void }) {
  return (
    <div className="grid overflow-hidden rounded-[10px] border border-borde" style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}>
      {opciones.map(([v, t], i) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === valor}
          onClick={() => cambiar(v)}
          className={`px-1.5 py-2.5 ${i > 0 ? "border-l border-borde" : ""} ${v === valor ? "bg-texto font-bold text-fondo" : "bg-superficie font-semibold text-suave"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Stepper({ valor, nombre, menos, mas }: { valor: number; nombre: string; menos: () => void; mas: () => void }) {
  const b = "flex h-9 w-9 items-center justify-center rounded-full border border-borde bg-superficie text-lg";
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`Menos horas (${nombre})`} onClick={menos} className={b}>−</button>
      <span className="min-w-12 text-center font-display text-lg font-semibold">{String(valor).replace(".", ",")} h</span>
      <button type="button" aria-label={`Más horas (${nombre})`} onClick={mas} className={b}>+</button>
    </div>
  );
}
