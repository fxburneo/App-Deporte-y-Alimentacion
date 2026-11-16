"use client";

// Botón + de la barra inferior (maqueta R4): menú rápido. Primero lo que toca
// ahora (tu plato de siempre en un toque); después foto, escribir, despensa,
// fuera de horario, peso y entreno a mano.
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarLoDeSiempre, siguienteLoDeSiempre } from "@/app/registrar/actions";
import { NOMBRE_MOMENTO } from "@/lib/datos/tipos";
import type { Momento } from "@/lib/nutricion/motor";
import { miles } from "@/lib/formato";

const ICONO = {
  foto: <path d="M4 8h3l2-3h6l2 3h3v11H4zM8.5 13a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0" />,
  texto: <path d="M5 7h14M5 12h14M5 17h9" />,
  despensa: <path d="M5 4h14v16H5zM5 9h14M5 14h14" />,
  extra: <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" />,
  peso: <path d="M5 20h14l-2-12H7zM9 8a3 3 0 0 1 6 0" />,
  entreno: <path d="M3 12h4l3-8 4 16 3-8h4" />,
};

export default function BotonMas() {
  const [abierto, setAbierto] = useState(false);
  const [siguiente, setSiguiente] = useState<{ momento: string; texto: string; kcal: number } | null | undefined>(undefined);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, start] = useTransition();
  const router = useRouter();

  const abrir = () => {
    setAbierto(true);
    setMensaje(null);
    setSiguiente(undefined);
    siguienteLoDeSiempre().then(setSiguiente).catch(() => setSiguiente(null));
  };
  const cerrar = () => setAbierto(false);
  const loComi = () =>
    start(async () => {
      if (!siguiente) return;
      const r = await registrarLoDeSiempre(siguiente.momento);
      if (!r.ok) return setMensaje(r.error);
      cerrar();
      router.push("/");
      router.refresh();
    });

  const reg = (modo: string) => `/registrar?modo=${modo}${siguiente ? `&comida=${siguiente.momento}` : ""}`;

  return (
    <>
      <button type="button" onClick={abrir} aria-label="Registrar" className="-mt-2 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-marca text-fondo shadow-[0_6px_18px_rgba(255,106,26,0.35)]">
        <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {abierto && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Registrar">
          <button type="button" aria-label="Cerrar" onClick={cerrar} className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-md flex-col gap-3 rounded-t-3xl bg-[#1E2328] px-[18px] pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
            <span className="mx-auto h-[5px] w-11 rounded-full bg-borde" />
            <h2 className="font-display text-[26px] font-bold">Registrar</h2>
            {siguiente === undefined ? (
              <div className="h-[72px] animate-pulse rounded-2xl bg-superficie" />
            ) : siguiente ? (
              <button type="button" onClick={loComi} disabled={ocupado} className="flex items-center gap-3 rounded-2xl border border-marca bg-marca/15 p-3.5 text-left disabled:opacity-60">
                <span className="w-7 text-center text-2xl text-marca">✓</span>
                <span className="flex flex-col">
                  <strong>{ocupado ? "Guardando…" : `${NOMBRE_MOMENTO[siguiente.momento as Momento]} · lo de siempre`}</strong>
                  <span className="text-[13px] text-tenue">{siguiente.texto} · {miles(siguiente.kcal)} kcal</span>
                </span>
              </button>
            ) : null}
            {mensaje && <p role="alert" className="text-sm text-mal">{mensaje}</p>}
            <div className="grid grid-cols-2 gap-2.5">
              <Opcion cerrar={cerrar} href={reg("foto")} icono="foto" titulo="Foto" sub="la IA la lee" />
              <Opcion cerrar={cerrar} href={reg("texto")} icono="texto" titulo="Escribir" sub="“pollo con arroz”" />
              <Opcion cerrar={cerrar} href={reg("repetir")} icono="despensa" titulo="Mi despensa" sub="por unidades" />
              <Opcion cerrar={cerrar} href="/registrar?comida=extra" icono="extra" titulo="Fuera de horario" sub="un extra" />
            </div>
            <span className="text-[13px] font-bold tracking-[0.1em] text-tenue">OTROS</span>
            <div className="grid grid-cols-2 gap-2.5">
              <Opcion cerrar={cerrar} href="/peso" icono="peso" titulo="Peso" sub="pesarme" />
              <Opcion cerrar={cerrar} href="/entreno/nuevo?dia=hoy&estado=hecho" icono="entreno" titulo="Entreno a mano" sub="si no llegó de Garmin" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Opcion({ href, icono, titulo, sub, cerrar }: { href: string; icono: keyof typeof ICONO; titulo: string; sub: string; cerrar: () => void }) {
  return (
    <Link href={href} onClick={cerrar} className="flex items-center gap-3 rounded-2xl bg-superficie p-3.5 text-texto no-underline">
      <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF6A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">{ICONO[icono]}</svg>
      <span className="flex flex-col">
        <strong>{titulo}</strong>
        <span className="text-[13px] text-tenue">{sub}</span>
      </span>
    </Link>
  );
}
