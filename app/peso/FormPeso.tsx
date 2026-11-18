"use client";

// Peso del día con − y + de a 100 g (maqueta R8). Empieza en el último peso;
// tocando el número se puede escribir.
import { useActionState, useState } from "react";
import { kg } from "@/lib/formato";
import { guardarPeso } from "./actions";

const circulo = "flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full border border-borde text-[26px] text-texto";

export default function FormPeso({ inicial, yaGuardado }: { inicial: number; yaGuardado: boolean }) {
  const [state, action, pending] = useActionState(guardarPeso, { error: null, ok: false });
  const [valor, setValor] = useState(Math.round(inicial * 10) / 10);
  const [escribiendo, setEscribiendo] = useState(false);
  const paso = (d: number) => setValor((v) => Math.round((v + d) * 10) / 10);

  return (
    <form action={action} className="flex flex-col items-center gap-3 rounded-[20px] bg-superficie px-4 py-5">
      <span className="text-[13px] font-bold tracking-[0.1em] text-tenue">HOY · EN AYUNAS</span>
      <input type="hidden" name="kg" value={String(valor)} />
      <div className="flex items-center gap-[18px]">
        <button type="button" aria-label="Menos 100 gramos" onClick={() => paso(-0.1)} className={circulo}>−</button>
        {escribiendo ? (
          <input
            autoFocus
            aria-label="Peso en kilos"
            inputMode="decimal"
            defaultValue={kg(valor)}
            onBlur={(e) => {
              const n = Number(e.target.value.replace(",", "."));
              if (Number.isFinite(n) && n >= 30 && n <= 250) setValor(Math.round(n * 10) / 10);
              setEscribiendo(false);
            }}
            className="w-[150px] rounded-[10px] border border-borde bg-fondo text-center font-display text-[52px] font-bold leading-none text-texto"
          />
        ) : (
          <button type="button" aria-label="Escribir el peso" onClick={() => setEscribiendo(true)} className="font-display text-[64px] font-bold leading-none text-texto">
            {kg(valor)}<span className="text-[22px] text-tenue"> kg</span>
          </button>
        )}
        <button type="button" aria-label="Más 100 gramos" onClick={() => paso(0.1)} className={circulo}>+</button>
      </div>
      <span className="text-center text-[13px] text-tenue">
        {yaGuardado ? "Ya tienes el peso de hoy: si lo cambias, se reemplaza." : "Empieza en tu último peso: ajusta de a 100 g o toca el número para escribirlo."}
      </span>
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-60">
        {pending ? "GUARDANDO…" : "GUARDAR PESO"}
      </button>
      {state.error && <p role="alert" className="text-sm text-mal">{state.error}</p>}
      {state.ok && <p className="text-sm text-bien">Guardado. El plan del día ya usa este peso.</p>}
    </form>
  );
}
