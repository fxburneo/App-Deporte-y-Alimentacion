"use client";

// "Tu día en números" (maqueta R3): de dónde sale el gasto, lo comido, lo que
// queda y el déficit, y los macros con su porqué. Se abre con el botón (i).
import { useState } from "react";
import { miles } from "@/lib/formato";

export interface NumerosDia {
  tipo: string;
  reposo: number;
  vidaDiaria: number;
  entreno: number;
  objetivo: number;
  comido: number;
  proteina: { real: number; obj: number; porKg: string };
  grasa: { real: number; obj: number; porKg: string };
  carbo: { real: number; obj: number };
  pesoKg: string;
}

export default function DetalleDia({ n }: { n: NumerosDia }) {
  const [abierto, setAbierto] = useState(false);
  const gasto = n.reposo + n.vidaDiaria + n.entreno;
  const deficit = Math.max(0, gasto - n.objetivo);
  const pc = (x: number) => `${Math.max(0, Math.min(100, (x / gasto) * 100)).toFixed(1)}%`;
  const comidoVis = Math.min(n.comido, n.objetivo);
  const queda = n.objetivo - n.comido;
  const segmentos: [string, number, string][] = [
    ["Reposo", n.reposo, "#5B6672"],
    ["Vida diaria", n.vidaDiaria, "#8592A0"],
    ["Entreno", n.entreno, "#FF6A1A"],
  ];
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} aria-label="Tu día en números" className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-borde font-bold text-tenue">
        i
      </button>
      {abierto && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Tu día en números">
          <button type="button" aria-label="Cerrar" onClick={() => setAbierto(false)} className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90vh] max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl bg-[#1E2328] px-[18px] pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
            <span className="mx-auto h-[5px] w-11 rounded-full bg-borde" />
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[26px] font-bold">Tu día en números</h2>
              <span className="rounded-full border border-marca px-2 text-[11px] font-extrabold uppercase text-marca">{n.tipo}</span>
            </div>
            <section className="flex flex-col gap-2">
              <div className="flex justify-between text-[13px]"><span className="font-bold tracking-[0.1em] text-tenue">LO QUE GASTAS</span><span className="text-tenue">{miles(gasto)} kcal</span></div>
              <div className="flex h-[30px] gap-0.5 overflow-hidden rounded-[9px]">
                {segmentos.filter(([, v]) => v > 0).map(([nombre, v, c]) => (
                  <span key={nombre} style={{ width: pc(v), background: c }} className="flex items-center justify-center text-[11px] font-extrabold text-fondo">
                    {v / gasto > 0.15 ? miles(v) : ""}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] text-suave">
                {segmentos.map(([nombre, v, c]) => (
                  <span key={nombre}><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />{nombre} <strong>{miles(v)}</strong></span>
                ))}
              </div>
            </section>
            <section className="flex flex-col gap-2">
              <div className="flex justify-between text-[13px]"><span className="font-bold tracking-[0.1em] text-tenue">LO QUE COMES</span><span className="text-tenue">objetivo {miles(n.objetivo)}</span></div>
              <div className="relative h-[30px] overflow-hidden rounded-[9px] bg-superficie">
                <div className="absolute inset-y-0 left-0 flex items-center bg-bien pl-2.5 text-xs font-extrabold text-fondo" style={{ width: pc(comidoVis) }}>
                  {n.comido / gasto > 0.25 ? `${miles(n.comido)} comido` : ""}
                </div>
                {queda > 0 && (
                  <div className="absolute inset-y-0 flex items-center justify-center text-xs font-bold text-bien" style={{ left: pc(comidoVis), width: pc(queda), background: "repeating-linear-gradient(45deg,#3ddc8433,#3ddc8433 6px,transparent 6px,transparent 12px)" }}>
                    {queda / gasto > 0.2 ? `te quedan ${miles(queda)}` : ""}
                  </div>
                )}
                {deficit > 0 && (
                  <div className="absolute inset-y-0 right-0 flex items-center justify-center bg-mal/20 text-xs font-extrabold text-mal" style={{ left: pc(n.objetivo) }}>
                    −{miles(deficit)}
                  </div>
                )}
              </div>
              <span className="text-[13px] text-suave">
                {deficit > 0 ? `El rojo es tu déficit: lo que dejas de comer para bajar de peso (${miles(deficit)} kcal hoy).` : "Hoy comes lo que gastas: sin déficit."}
                {queda < 0 ? ` Vas ${miles(-queda)} kcal por encima del objetivo.` : ""}
              </span>
            </section>
            <div className="grid grid-cols-3 gap-2">
              <Macro nombre="Proteína" m={n.proteina} sub={`fija: ${n.proteina.porKg}`} color="#4C9DFF" />
              <Macro nombre="Grasa" m={n.grasa} sub={`fija: ${n.grasa.porKg}`} color="#B98CFF" />
              <Macro nombre="Carbo" m={n.carbo} sub="sube y baja con el entreno" color="#FFB020" />
            </div>
            <p className="text-[13px] text-tenue">Plan de tu nutricionista. Peso de referencia {n.pesoKg} kg (promedio de la semana).</p>
            <button type="button" onClick={() => setAbierto(false)} className="rounded-[14px] bg-marca py-3.5 font-extrabold text-fondo">Listo</button>
          </div>
        </div>
      )}
    </>
  );
}

function Macro({ nombre, m, sub, color }: { nombre: string; m: { real: number; obj: number }; sub: string; color: string }) {
  const pct = m.obj > 0 ? Math.min(100, (m.real / m.obj) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] bg-superficie p-3" style={{ borderTop: `3px solid ${color}` }}>
      <span className="text-xs font-extrabold tracking-[0.08em] uppercase" style={{ color }}>{nombre}</span>
      <span className="font-display text-[28px] font-bold leading-none">{Math.round(m.obj)}<span className="text-[15px] text-tenue"> g</span></span>
      <div className="h-1.5 rounded-full" style={{ background: `${color}33` }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs leading-tight text-tenue">{sub}</span>
    </div>
  );
}
