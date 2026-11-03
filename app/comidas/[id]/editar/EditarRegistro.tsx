"use client";

// Edición de un registro: misma lista que en Registrar, con gramos y quitar.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cambiarGramos, totales, type Alimento } from "@/lib/comidas/alimentos";
import { NOMBRE_COMIDA } from "@/lib/datos/tipos";
import type { Comida } from "@/lib/nutricion/motor";
import { editarComida } from "../../../registrar/actions";

export default function EditarRegistro(props: { id: number; comida: Comida; alimentosIniciales: Alimento[] }) {
  const router = useRouter();
  const [alimentos, setAlimentos] = useState(props.alimentosIniciales);
  const [error, setError] = useState<string | null>(null);
  const [guardando, start] = useTransition();
  const t = totales(alimentos);

  const guardar = () =>
    start(async () => {
      const r = await editarComida(props.id, alimentos);
      if (!r.ok) return setError(r.error);
      router.push("/comidas");
    });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-[18px] px-[18px] pt-[max(18px,env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between">
        <Link href="/comidas" className="py-2.5 font-semibold text-tenue">Cancelar</Link>
        <h1 className="font-display text-2xl font-bold tracking-[0.04em]">EDITAR {NOMBRE_COMIDA[props.comida].toUpperCase()}</h1>
        <span className="w-[62px]" />
      </header>
      <section className="flex flex-col">
        {alimentos.map((a, i) => (
          <div key={i} className="flex items-center gap-2 border-b border-linea py-2.5 last:border-0">
            <span className="flex min-w-0 flex-1 flex-col">
              <strong>{a.nombre}</strong>
              <span className="text-xs text-tenue">{a.medida_casera} · {Math.round(a.carbo_g)} C · {Math.round(a.proteina_g)} P · {Math.round(a.grasa_g)} G</span>
            </span>
            <label className="sr-only" htmlFor={`e-${i}`}>Gramos de {a.nombre}</label>
            <input
              id={`e-${i}`}
              inputMode="numeric"
              defaultValue={Math.round(a.gramos)}
              onBlur={(e) => {
                const g = Number(e.target.value.replace(",", "."));
                setAlimentos((l) => l.map((x, j) => (j === i ? cambiarGramos(x, g) : x)));
              }}
              className="w-20 rounded-[10px] border border-borde bg-superficie px-2 py-1.5 text-center font-display text-lg text-texto"
            />
            <span className="text-sm text-tenue">g</span>
            <button type="button" onClick={() => setAlimentos((l) => l.filter((_, j) => j !== i))} className="ml-1 text-sm text-tenue underline" disabled={alimentos.length <= 1}>
              Quitar
            </button>
          </div>
        ))}
      </section>
      <p className="text-suave">
        Total: <strong>{t.kcal} kcal</strong> · {Math.round(t.carboG)} C · {Math.round(t.proteinaG)} P · {Math.round(t.grasaG)} G
      </p>
      {error && <p className="text-sm text-mal">{error}</p>}
      <button type="button" onClick={guardar} disabled={guardando} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-50">
        {guardando ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
      </button>
    </main>
  );
}
