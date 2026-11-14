"use client";

// Botones del informe: generar con Claude y compartir con el coach.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generarInforme } from "./actions";

export function Generar({ lunes, regenerar = false }: { lunes: string; regenerar?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [ocupado, start] = useTransition();
  const router = useRouter();
  const ir = () =>
    start(async () => {
      setError(null);
      const r = await generarInforme(lunes);
      if (!r.ok) return setError(r.error ?? "No se pudo generar.");
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-1.5">
      {regenerar ? (
        <button type="button" onClick={ir} disabled={ocupado} className="text-sm text-tenue underline">
          {ocupado ? "Escribiendo…" : "Volver a escribir el informe"}
        </button>
      ) : (
        <button type="button" onClick={ir} disabled={ocupado} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-60">
          {ocupado ? "CLAUDE ESTÁ ESCRIBIENDO…" : "ESCRIBIR EL INFORME"}
        </button>
      )}
      {error && <p role="alert" className="text-sm text-mal">{error}</p>}
    </div>
  );
}

export function Compartir({ texto }: { texto: string }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const compartir = async () => {
    try {
      if (navigator.share) await navigator.share({ text: texto });
      else {
        await navigator.clipboard.writeText(texto);
        setAviso("Copiado: pégalo en WhatsApp o en un correo.");
      }
    } catch {
      /* el usuario cerró la hoja de compartir */
    }
  };
  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={compartir} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo">
        COMPARTIR CON EL COACH
      </button>
      {aviso && <p className="text-center text-sm text-suave">{aviso}</p>}
    </div>
  );
}
