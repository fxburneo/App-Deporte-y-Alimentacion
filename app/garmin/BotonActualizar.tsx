"use client";

import { useState, useTransition } from "react";
import { actualizarGarmin } from "./actions";

export default function BotonActualizar({ texto = "Actualizar" }: { texto?: string }) {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await actualizarGarmin();
            setMensaje({ ok: r.ok, texto: r.mensaje });
          })
        }
        className="text-[13px] font-bold text-marca disabled:opacity-60"
      >
        {pendiente ? "Actualizando..." : texto}
      </button>
      {mensaje && <span className={`text-xs ${mensaje.ok ? "text-bien" : "text-mal"}`}>{mensaje.texto}</span>}
    </span>
  );
}
