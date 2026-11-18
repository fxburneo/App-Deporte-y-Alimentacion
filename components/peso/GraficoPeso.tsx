// Gráfico de peso de 6 semanas (Pesarme y Yo). Compacto: sin ejes, para la
// tarjeta de Yo.
import { fechaLarga, sumarDias } from "@/lib/fecha";

// Gráfico de 6 semanas: puntos = pesajes, línea = promedio móvil de 7 días,
// franja verde = objetivo. Escala fija para que todo quepa.
export default function GraficoPeso({ pesos, hoy, objMin, objMax, compacto = false }: { pesos: { fecha: string; kg: number }[]; hoy: string; objMin: number; objMax: number; compacto?: boolean }) {
  const desde = sumarDias(hoy, -42);
  const datos = pesos.filter((p) => p.fecha >= desde).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (datos.length < 2) return null;
  const W = 350, H = compacto ? 130 : 190, X0 = compacto ? 4 : 30, X1 = 345, Y0 = 12, Y1 = compacto ? 118 : 160;
  const valores = [...datos.map((p) => p.kg), objMin, objMax];
  const lo = Math.floor(Math.min(...valores)) - 0.5;
  const hi = Math.ceil(Math.max(...valores)) + 0.5;
  const dia = (f: string) => (new Date(f + "T00:00:00Z").getTime() - new Date(desde + "T00:00:00Z").getTime()) / 86400000;
  const x = (f: string) => X0 + (dia(f) / 42) * (X1 - X0);
  const y = (v: number) => Y0 + ((hi - v) / (hi - lo)) * (Y1 - Y0);
  const media = datos.map((p) => {
    const ventana = datos.filter((q) => dia(q.fecha) <= dia(p.fecha) && dia(q.fecha) > dia(p.fecha) - 7);
    return { f: p.fecha, v: ventana.reduce((s, q) => s + q.kg, 0) / ventana.length };
  });
  const marcas = [hi - 0.5, (hi + lo) / 2, lo + 0.5].map((v) => Math.round(v));
  return (
    <div className="flex flex-col gap-2">
      <svg role="img" aria-label="Peso de las últimas 6 semanas con la franja del objetivo" viewBox={`0 0 ${W} ${H}`} className="w-full">
        <rect x={X0} y={y(objMax)} width={X1 - X0} height={Math.max(2, y(objMin) - y(objMax))} fill="#1b2a22" />
        <text x={X1 - 6} y={y(objMax) + 14} fontSize="11" fill="#3ddc84" fontWeight="600" textAnchor="end">objetivo {objMin}–{objMax}</text>
        {!compacto && marcas.map((m) => (
          <g key={m}>
            <line x1={X0} x2={X1} y1={y(m)} y2={y(m)} stroke="#22282e" />
            <text x={0} y={y(m) + 4} fontSize="11" fill="#9aa4ad">{m}</text>
          </g>
        ))}
        {datos.map((p) => <circle key={p.fecha + p.kg} cx={x(p.fecha)} cy={y(p.kg)} r="3" fill="#4a535b" />)}
        <polyline points={media.map((m) => `${x(m.f)},${y(m.v)}`).join(" ")} fill="none" stroke="#f2f4f5" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={x(media[media.length - 1].f)} cy={y(media[media.length - 1].v)} r="5" fill="#ff6a1a" />
        {!compacto && <text x={X0} y={H - 6} fontSize="11" fill="#9aa4ad">{fechaLarga(desde).split(" ").slice(1).join(" ")}</text>}
        {!compacto && <text x={X1} y={H - 6} fontSize="11" fill="#9aa4ad" textAnchor="end">hoy</text>}
      </svg>
    </div>
  );
}
