"use client";

// Casillas de la lista de compras. Lo marcado se guarda en este celular
// (localStorage): es una ayuda para ir al súper, no un dato del plan.
import { useEffect, useState } from "react";
import type { Grupo, ItemCompra } from "@/lib/menu/compras";

export default function ListaCompras({ items, clave }: { items: ItemCompra[]; clave: string }) {
  const [hechos, setHechos] = useState<string[]>([]);
  useEffect(() => {
    try {
      const v = localStorage.getItem(clave);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una vez al abrir
      if (v) setHechos(JSON.parse(v));
    } catch {}
  }, [clave]);
  const cambiar = (k: string) =>
    setHechos((h) => {
      const n = h.includes(k) ? h.filter((x) => x !== k) : [...h, k];
      try {
        localStorage.setItem(clave, JSON.stringify(n));
      } catch {}
      return n;
    });
  const grupos = [...new Set(items.map((i) => i.grupo))] as Grupo[];
  return (
    <>
      {grupos.map((g) => (
        <section key={g} className="flex flex-col">
          <span className="etiqueta pb-1">{g}</span>
          {items
            .filter((i) => i.grupo === g)
            .map((i) => {
              const ok = hechos.includes(i.clave);
              return (
                <button key={i.clave} type="button" role="checkbox" aria-checked={ok} onClick={() => cambiar(i.clave)} className="flex items-center gap-2.5 border-b border-linea py-2.5 text-left last:border-0">
                  <span className={`h-5 w-5 flex-none rounded-md border-2 ${ok ? "border-bien bg-bien" : "border-borde"}`} />
                  <span className={`flex flex-1 flex-col ${ok ? "text-tenue line-through" : ""}`}>
                    <span>{i.nombre}</span>
                    {i.detalle && <span className="text-xs text-tenue">{i.detalle}</span>}
                  </span>
                  <span className={`font-display text-base font-semibold ${ok ? "text-tenue line-through" : ""}`}>{i.cantidad}</span>
                </button>
              );
            })}
        </section>
      ))}
    </>
  );
}
