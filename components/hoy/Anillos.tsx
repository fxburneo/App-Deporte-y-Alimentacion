// Anillos de progreso del día (maqueta R1): carbohidrato, proteína y grasa
// comidos contra el objetivo, con lo que queda de calorías al centro.
import { miles } from "@/lib/formato";

const Anillo = ({ r, pct, color }: { r: number; pct: number; color: string }) => {
  const L = 2 * Math.PI * r;
  return (
    <>
      <circle cx={85} cy={85} r={r} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={11} />
      <circle cx={85} cy={85} r={r} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" strokeDasharray={`${L * Math.min(1, pct)} ${L}`} transform="rotate(-90 85 85)" />
    </>
  );
};

export interface MacroAnillo {
  real: number;
  obj: number;
}

export default function Anillos({ carbo, proteina, grasa, quedanKcal }: { carbo: MacroAnillo; proteina: MacroAnillo; grasa: MacroAnillo; quedanKcal: number }) {
  const pct = (m: MacroAnillo) => (m.obj > 0 ? m.real / m.obj : 0);
  const pasado = quedanKcal < 0;
  return (
    <section className="flex items-center gap-4" aria-label="Progreso del día">
      <div className="relative h-[170px] w-[170px] flex-none">
        <svg aria-hidden="true" width={170} height={170} viewBox="0 0 170 170">
          <Anillo r={78} pct={pct(carbo)} color="#FFB020" />
          <Anillo r={63} pct={pct(proteina)} color="#4C9DFF" />
          <Anillo r={48} pct={pct(grasa)} color="#B98CFF" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display text-[30px] font-bold leading-none ${pasado ? "text-carbo" : ""}`}>{miles(Math.abs(quedanKcal))}</span>
          <span className="text-xs text-tenue">{pasado ? "kcal de más" : "kcal te quedan"}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {(
          [
            ["Carbohidrato", carbo, "bg-carbo"],
            ["Proteína", proteina, "bg-proteina"],
            ["Grasa", grasa, "bg-grasa"],
          ] as const
        ).map(([n, m, c]) => (
          <div key={n} className="flex flex-col">
            <span className="text-[13px] text-tenue">
              <span className={`mr-1.5 inline-block h-[9px] w-[9px] rounded-full ${c}`} />
              {n}
            </span>
            <span className="font-display text-xl font-bold">
              {Math.round(m.real)} / {Math.round(m.obj)} g
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
