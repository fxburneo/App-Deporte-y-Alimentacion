"use client";

// Botón "Lo comí" (maqueta R1/R2): registra el plato de siempre en un toque y
// muestra un aviso con "Deshacer" por unos segundos.
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deshacerRegistro, registrarLoDeSiempre } from "@/app/registrar/actions";
import { miles } from "@/lib/formato";

export default function LoComi({ momento, nombre, fecha, compacto = false }: { momento: string; nombre: string; fecha?: string; compacto?: boolean }) {
  const router = useRouter();
  const [ocupado, start] = useTransition();
  const [hecho, setHecho] = useState<{ id: number; kcal: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hecho) return;
    const t = setTimeout(() => setHecho(null), 7000);
    return () => clearTimeout(t);
  }, [hecho]);

  const registrar = () =>
    start(async () => {
      setError(null);
      const r = await registrarLoDeSiempre(momento, fecha);
      if (!r.ok) return setError(r.error);
      setHecho({ id: r.id, kcal: r.kcal });
      router.refresh();
    });
  const deshacer = () =>
    start(async () => {
      if (!hecho) return;
      await deshacerRegistro(hecho.id);
      setHecho(null);
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        onClick={registrar}
        disabled={ocupado}
        className={`rounded-[14px] bg-marca font-extrabold text-fondo disabled:opacity-60 ${compacto ? "px-3 py-1.5 text-sm" : "flex-1 py-3.5"}`}
      >
        {ocupado ? "Guardando…" : "✓ Lo comí"}
      </button>
      {error && <p role="alert" className="text-sm text-mal">{error}</p>}
      {hecho && (
        <div role="status" className="fixed inset-x-4 bottom-[100px] z-30 mx-auto flex max-w-md items-center justify-between rounded-[14px] border border-borde bg-[#1E2328] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <span className="text-sm">
            <strong className="text-bien">✓ {nombre} registrado</strong>
            <span className="block text-tenue">{miles(hecho.kcal)} kcal · tu plato de siempre</span>
          </span>
          <button type="button" onClick={deshacer} className="font-extrabold text-marca">Deshacer</button>
        </div>
      )}
    </>
  );
}
