// Medidor de semicírculo de los indicadores de cumplimiento (maquetas R7 y
// R9): el color sigue el semáforo (verde ≥ 85, amarillo 70-84, rojo < 70).
import { semaforo } from "@/lib/cumplimiento";

export const COLOR_SEMAFORO = { verde: "text-bien", amarillo: "text-carbo", rojo: "text-mal" } as const;
export const colorDe = (p: number | null) => (p == null ? "text-tenue" : COLOR_SEMAFORO[semaforo(p)]);

const LARGO = Math.PI * 52;

export default function Medidor({ nombre, valor, sub }: { nombre: string; valor: number | null; sub: string }) {
  const arco = "M8 60 A52 52 0 0 1 112 60";
  return (
    <div className={`flex flex-1 flex-col items-center gap-1 rounded-[18px] bg-superficie px-2.5 pt-3.5 pb-3 ${colorDe(valor)}`}>
      <span className="text-xs font-extrabold tracking-[0.1em] text-tenue">{nombre}</span>
      <div className="relative h-[66px] w-[120px]">
        <svg width="120" height="66" viewBox="0 0 120 66" aria-hidden="true">
          <path d={arco} fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="11" strokeLinecap="round" />
          {valor != null && valor > 0 && (
            <path d={arco} fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${((LARGO * valor) / 100).toFixed(1)} ${LARGO.toFixed(1)}`} />
          )}
        </svg>
        <span className="absolute inset-x-0 bottom-0 text-center font-display text-[30px] font-bold leading-none">{valor == null ? "—" : `${valor}%`}</span>
      </div>
      <span className="text-center text-[13px] text-suave">{sub}</span>
    </div>
  );
}

// Frase corta bajo cada medidor.
export function subEntreno(sesiones: { puntaje: number }[]) {
  if (sesiones.length === 0) return "sin sesiones del coach todavía";
  const hechas = sesiones.filter((s) => s.puntaje > 0).length;
  return `${hechas} de ${sesiones.length} ${sesiones.length === 1 ? "sesión" : "sesiones"}`;
}
export function subAlimentacion(r: { diasMedidos: number; diasProteinaCorta: number; componentes: { kcal: number; proteina: number; carbo: number } | null }) {
  if (!r.componentes || r.diasMedidos === 0) return "se mide desde mañana";
  const c = r.componentes;
  const peor = Math.min(c.kcal, c.proteina, c.carbo);
  if (peor >= 85) return "vas en objetivo";
  if (peor === c.proteina && r.diasProteinaCorta > 0) return `proteína corta ${r.diasProteinaCorta} ${r.diasProteinaCorta === 1 ? "día" : "días"}`;
  if (peor === c.kcal) return "calorías fuera del rango";
  return "carbohidrato fuera del rango";
}
