// Franja con los últimos 8 días (7 atrás + hoy), maqueta 2c.1: elegir el día
// con un toque en Hoy y en Comidas. Más atrás de 7 días queda la flecha.
import Link from "next/link";
import { DIAS_EDITABLES, sumarDias } from "@/lib/fecha";

const DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function diasFranja(hoy: string): string[] {
  return Array.from({ length: DIAS_EDITABLES + 1 }, (_, i) => sumarDias(hoy, i - DIAS_EDITABLES));
}

export default function FranjaDias({ fecha, hoy, ruta }: { fecha: string; hoy: string; ruta: "/" | "/comidas" }) {
  const dias = diasFranja(hoy);
  const enlace = (f: string) => (f === hoy ? ruta : `${ruta}?fecha=${f}`);
  return (
    <nav aria-label="Elegir día" className="flex items-stretch gap-1">
      {fecha < dias[0] && (
        <Link href={enlace(sumarDias(fecha, 1))} aria-label="Día siguiente" className="flex w-6 items-center justify-center text-lg text-tenue">›</Link>
      )}
      <Link href={enlace(sumarDias(dias[0], -1))} aria-label="Días anteriores" className="flex w-5 flex-none items-center justify-center text-lg text-tenue">‹</Link>
      {dias.map((f) => {
        const activo = f === fecha;
        return (
          <Link
            key={f}
            href={enlace(f)}
            aria-current={activo ? "date" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center rounded-[10px] border py-1.5 no-underline ${activo ? "border-texto bg-texto text-fondo" : "border-borde text-suave"}`}
          >
            <span className="text-[11px] font-bold">{f === hoy ? "Hoy" : DIA[new Date(f + "T12:00:00Z").getUTCDay()]}</span>
            <span className="font-display text-[17px] font-bold leading-tight">{Number(f.slice(8))}</span>
          </Link>
        );
      })}
    </nav>
  );
}
