"use client";

import { useActionState } from "react";
import { guardarPeso } from "./actions";

export default function FormPeso({ inicial }: { inicial: string }) {
  const [state, action, pending] = useActionState(guardarPeso, { error: null, ok: false });
  return (
    <form action={action} className="flex flex-col gap-2.5">
      <label htmlFor="kg" className="etiqueta">Pesaje de hoy · en ayunas</label>
      <div className="flex gap-2">
        <input id="kg" name="kg" inputMode="decimal" defaultValue={inicial} required className="min-w-0 flex-1 rounded-[10px] border border-borde bg-superficie px-3 py-2 font-display text-[26px] text-texto" />
        <button type="submit" disabled={pending} className="rounded-[10px] bg-marca px-5 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-60">
          {pending ? "..." : "GUARDAR"}
        </button>
      </div>
      {state.error && <p className="text-sm text-mal">{state.error}</p>}
      {state.ok && <p className="text-sm text-bien">Guardado. El plan del día ya usa este peso.</p>}
    </form>
  );
}
