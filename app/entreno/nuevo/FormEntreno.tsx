"use client";

// Formulario de entreno manual (maqueta 2.2). Abajo, "Así queda el día"
// recalcula el objetivo con el motor mientras eliges deporte, duración e
// intensidad, sumando lo que ya estaba cargado ese día.
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  NOMBRE_TIPO,
  objetivoDelDia,
  type Deporte,
  type Entreno,
  type EstadoEntreno,
  type Intensidad,
  type PerfilMotor,
} from "@/lib/nutricion/motor";
import { duracion as fmtDuracion, miles } from "@/lib/formato";
import { guardarEntreno } from "../actions";

type Dia = "hoy" | "manana";

const DEPORTES: { valor: Deporte; nombre: string; icono: React.ReactNode }[] = [
  {
    valor: "rodillo",
    nombre: "Rodillo",
    icono: <path d="M6 16l4-7h5l3 7M10 9l-1-3h-2M2.5 16a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0M14.5 16a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0" />,
  },
  { valor: "ruta_mtb", nombre: "Ruta / MTB", icono: <path d="M3 19l6-10 4 6 3-4 5 8z" /> },
  {
    valor: "trail_correr",
    nombre: "Trail / correr",
    icono: <path d="M12 4.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0M8 21l3-6 3 2v4M6 11l3-3 4 1 2 4 3 1" />,
  },
  { valor: "fuerza", nombre: "Fuerza", icono: <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" /> },
  { valor: "descanso", nombre: "Descanso", icono: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /> },
];
const INTENSIDADES: { valor: Intensidad; nombre: string; detalle: string }[] = [
  { valor: "suave", nombre: "Suave", detalle: "puedes conversar" },
  { valor: "moderado", nombre: "Moderado", detalle: "intervalos, tempo" },
  { valor: "fuerte", nombre: "Fuerte", detalle: "series al límite" },
];

export default function FormEntreno(props: {
  perfil: PerfilMotor;
  pesoKg: number;
  existentes: Record<Dia, Entreno[]>;
  siguientes: Record<Dia, Entreno[]>;
  horaHabitual: Record<Dia, string>;
  diaInicial: Dia;
  estadoInicial: EstadoEntreno;
}) {
  const [state, formAction, pending] = useActionState(guardarEntreno, { error: null });
  const [estado, setEstado] = useState<EstadoEntreno>(props.estadoInicial);
  const [dia, setDia] = useState<Dia>(props.diaInicial);
  const [hora, setHora] = useState(props.horaHabitual[props.diaInicial]);
  const [deporte, setDeporte] = useState<Deporte>("rodillo");
  const [minutos, setMinutos] = useState(75);
  const [intensidad, setIntensidad] = useState<Intensidad>("moderado");
  const [kcal, setKcal] = useState("");

  const elegirDia = (d: Dia) => {
    setDia(d);
    setHora(props.horaHabitual[d]);
    if (d === "manana") setEstado("planificado");
  };

  const objetivo = useMemo(() => {
    const nuevo: Entreno = {
      deporte,
      duracionMin: deporte === "descanso" ? 0 : minutos,
      intensidad,
      estado,
      hora: hora || null,
      kcal: estado === "hecho" && kcal ? Number(kcal) : null,
    };
    return objetivoDelDia({
      perfil: props.perfil,
      pesoKg: props.pesoKg,
      entrenosHoy: [...props.existentes[dia], nuevo],
      entrenosManana: props.siguientes[dia],
    });
  }, [deporte, minutos, intensidad, estado, hora, kcal, dia, props]);

  const boton = (activo: boolean) =>
    activo ? "bg-texto font-bold text-fondo" : "bg-superficie text-suave";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-[18px] pt-[max(18px,env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="py-2.5 font-semibold text-tenue">Cancelar</Link>
        <h1 className="font-display text-2xl font-bold tracking-[0.04em]">CARGAR ENTRENO</h1>
        <span className="w-[62px]" />
      </header>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="estado" value={estado} />
        <input type="hidden" name="dia" value={dia} />
        <input type="hidden" name="deporte" value={deporte} />
        <input type="hidden" name="duracion_min" value={deporte === "descanso" ? 0 : minutos} />
        <input type="hidden" name="intensidad" value={intensidad} />

        <div role="tablist" className="grid grid-cols-2 border-b border-linea">
          {(["planificado", "hecho"] as const).map((e) => (
            <button
              key={e}
              type="button"
              role="tab"
              aria-selected={estado === e}
              disabled={e === "hecho" && dia === "manana"}
              onClick={() => setEstado(e)}
              className={`border-b-2 p-2.5 disabled:opacity-40 ${estado === e ? "border-marca font-bold text-texto" : "border-transparent text-tenue"}`}
            >
              {e === "planificado" ? "Lo que voy a hacer" : "Lo que hice"}
            </button>
          ))}
        </div>

        <section className="flex gap-2.5">
          <div className="grid flex-1 grid-cols-2 overflow-hidden rounded-[10px] border border-borde">
            {(["hoy", "manana"] as const).map((d) => (
              <button key={d} type="button" aria-pressed={dia === d} onClick={() => elegirDia(d)} className={`p-2.5 ${boton(dia === d)}`}>
                {d === "hoy" ? "Hoy" : "Mañana"}
              </button>
            ))}
          </div>
          <label htmlFor="hora" className="sr-only">Hora</label>
          <input id="hora" name="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="w-[104px] rounded-[10px] border border-borde bg-superficie text-center font-display text-xl text-texto" />
        </section>

        <section className="flex flex-col gap-2.5">
          <span className="etiqueta">Deporte</span>
          <div className="grid grid-cols-3 gap-2">
            {DEPORTES.map((x) => (
              <button
                key={x.valor}
                type="button"
                aria-pressed={deporte === x.valor}
                onClick={() => setDeporte(x.valor)}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-3 ${deporte === x.valor ? "border-2 border-marca bg-[#1f1712] font-bold text-texto" : "border border-borde bg-superficie text-suave"}`}
              >
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {x.icono}
                </svg>
                {x.nombre}
              </button>
            ))}
          </div>
        </section>

        {deporte !== "descanso" && (
          <>
            <section className="flex flex-col gap-2.5">
              <span className="etiqueta">Duración</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Menos 15 minutos" onClick={() => setMinutos((m) => Math.max(15, m - 15))} className="h-12 w-12 rounded-full border border-borde bg-superficie text-2xl">−</button>
                <span className="flex-1 text-center font-display text-[52px] font-bold leading-none">
                  {fmtDuracion(minutos)} <span className="text-xl text-tenue">h</span>
                </span>
                <button type="button" aria-label="Más 15 minutos" onClick={() => setMinutos((m) => Math.min(900, m + 15))} className="h-12 w-12 rounded-full border border-borde bg-superficie text-2xl">+</button>
              </div>
            </section>

            <section className="flex flex-col gap-2.5">
              <span className="etiqueta">Intensidad</span>
              <div className="grid grid-cols-3 overflow-hidden rounded-[10px] border border-borde">
                {INTENSIDADES.map((x, i) => (
                  <button
                    key={x.valor}
                    type="button"
                    aria-pressed={intensidad === x.valor}
                    onClick={() => setIntensidad(x.valor)}
                    className={`flex flex-col items-center px-1 py-2.5 ${i > 0 ? "border-l border-borde" : ""} ${boton(intensidad === x.valor)}`}
                  >
                    {x.nombre}
                    <span className="text-[11px] font-medium opacity-80">{x.detalle}</span>
                  </button>
                ))}
              </div>
            </section>

            {estado === "hecho" && (
              <section className="flex flex-col gap-1.5">
                <label htmlFor="kcal" className="etiqueta">Calorías del reloj · opcional</label>
                <input id="kcal" name="kcal" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value.replace(/\D/g, ""))} className="rounded-[10px] border border-borde bg-superficie px-3 py-2.5 font-display text-xl text-texto" />
                <span className="text-xs text-tenue">En rodillo con potencia es muy preciso. Si lo dejas vacío, la app lo estima.</span>
              </section>
            )}
          </>
        )}

        <section className="flex flex-col gap-2.5 rounded-[14px] bg-superficie px-4 py-3.5">
          <div className="flex items-baseline justify-between">
            <span className="etiqueta">Así queda {dia === "hoy" ? "hoy" : "mañana"}</span>
            <span className="text-xs font-bold uppercase text-carbo">{NOMBRE_TIPO[objetivo.tipo]}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[40px] font-bold leading-none">{miles(objetivo.kcal)}</span>
            <span className="font-display text-lg text-tenue">kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-2 font-display text-xl font-semibold">
            <span className="text-carbo">{objetivo.carboG} g <span className="font-sans text-[11px] font-medium text-tenue">CARBO</span></span>
            <span className="text-proteina">{objetivo.proteinaG} g <span className="font-sans text-[11px] font-medium text-tenue">PROT</span></span>
            <span className="text-grasa">{objetivo.grasaG} g <span className="font-sans text-[11px] font-medium text-tenue">GRASA</span></span>
          </div>
          {objetivo.snackPreEntreno && (
            <span className="text-[13px] text-suave">Entreno exigente antes del desayuno: snack de 25 g de carbohidrato al levantarte.</span>
          )}
        </section>

        {state.error && <p className="text-sm text-mal">{state.error}</p>}

        <button type="submit" disabled={pending} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-60">
          {pending ? "GUARDANDO..." : "GUARDAR ENTRENO"}
        </button>
        <span className="-mt-2.5 text-center text-xs text-tenue">
          Desde la etapa 2 los entrenos llegan solos de Garmin y TrainingPeaks. Esto queda para entrenos sin reloj.
        </span>
      </form>
    </main>
  );
}
