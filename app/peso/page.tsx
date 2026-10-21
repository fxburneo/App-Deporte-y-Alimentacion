// Peso (maqueta 4.2): promedio de la semana, tendencia de 6 semanas con la
// franja objetivo, pesajes y el formulario del día.
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import Link from "next/link";
import { leerDatosDia } from "@/lib/datos/dia";
import { fechaLarga, sumarDias } from "@/lib/fecha";
import { kg } from "@/lib/formato";
import { pesoReferencia } from "@/lib/nutricion/motor";
import { proyeccionPeso } from "@/lib/nutricion/peso";
import FormPeso from "./FormPeso";

export default async function Page() {
  const d = await leerDatosDia();
  if (!d.perfil) redirect("/bienvenida");
  const promedio = pesoReferencia(d.pesos, d.fecha);
  const anterior = pesoReferencia(d.pesos.filter((p) => p.fecha <= sumarDias(d.fecha, -7)), sumarDias(d.fecha, -7));
  const objMin = Number(d.perfil.objetivo_min_kg);
  const objMax = Number(d.perfil.objetivo_max_kg);
  const proy = proyeccionPeso(d.pesos, objMax, d.fecha);
  const deHoy = d.pesos.find((p) => p.fecha === d.fecha);

  return (
    <>
      <Pantalla>
        <header className="flex flex-col gap-1">
          <Link href="/mas" className="py-1.5 text-[13px] font-semibold text-tenue">‹ Más</Link>
          <h1 className="font-display text-[34px] font-bold uppercase leading-none tracking-[0.02em]">Peso</h1>
        </header>

        <section className="flex flex-col gap-1">
          <span className="etiqueta">Promedio de la semana</span>
          {promedio == null ? (
            <p className="text-suave">Todavía no hay pesajes.</p>
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[72px] font-bold leading-[0.95]">{kg(promedio)}</span>
              <span className="font-display text-2xl text-tenue">kg</span>
              {anterior != null && (
                <span className={`ml-auto font-display text-2xl font-bold ${promedio <= anterior ? "text-bien" : "text-carbo"}`}>
                  {promedio - anterior > 0 ? "+" : "−"}{kg(Math.abs(promedio - anterior))}
                </span>
              )}
            </div>
          )}
          <span className="text-suave">
            Objetivo {kg(objMin)}–{kg(objMax)} kg.{" "}
            {proy?.fechaObjetivo
              ? `A este ritmo (${kg(Math.abs(proy.kgPorSemana))} kg/semana) llegas cerca del ${fechaLarga(proy.fechaObjetivo).toLowerCase()}.`
              : "Con 2 semanas de pesajes te digo cuándo llegas."}
          </span>
        </section>

        <Grafico pesos={d.pesos} hoy={d.fecha} objMin={objMin} objMax={objMax} />

        <FormPeso inicial={deHoy ? kg(deHoy.kg) : ""} />

        <section className="flex flex-col">
          <span className="etiqueta pb-1">Pesajes</span>
          {d.pesos.slice(0, 8).map((p) => (
            <div key={p.id} className="flex justify-between border-b border-linea py-2.5 last:border-0">
              <span>{fechaLarga(p.fecha)} <span className="text-tenue">· {p.origen === "garmin" ? "Garmin" : "app"}</span></span>
              <span className="font-display text-lg">{kg(p.kg)} kg</span>
            </div>
          ))}
        </section>
      </Pantalla>
      <NavBar activa="mas" />
    </>
  );
}

// Gráfico de 6 semanas: puntos = pesajes, línea = promedio móvil de 7 días,
// franja verde = objetivo. Escala fija para que todo quepa.
function Grafico({ pesos, hoy, objMin, objMax }: { pesos: { fecha: string; kg: number }[]; hoy: string; objMin: number; objMax: number }) {
  const desde = sumarDias(hoy, -42);
  const datos = pesos.filter((p) => p.fecha >= desde).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (datos.length < 2) return null;
  const W = 350, H = 190, X0 = 30, X1 = 345, Y0 = 16, Y1 = 160;
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
    <section className="flex flex-col gap-2">
      <span className="etiqueta">Últimas 6 semanas</span>
      <svg role="img" aria-label="Peso de las últimas 6 semanas con la franja del objetivo" viewBox={`0 0 ${W} ${H}`} className="w-full">
        <rect x={X0} y={y(objMax)} width={X1 - X0} height={Math.max(2, y(objMin) - y(objMax))} fill="#1b2a22" />
        <text x={X0 + 8} y={y(objMax) + 14} fontSize="11" fill="#3ddc84" fontWeight="600">Objetivo</text>
        {marcas.map((m) => (
          <g key={m}>
            <line x1={X0} x2={X1} y1={y(m)} y2={y(m)} stroke="#22282e" />
            <text x={0} y={y(m) + 4} fontSize="11" fill="#9aa4ad">{m}</text>
          </g>
        ))}
        {datos.map((p) => <circle key={p.fecha + p.kg} cx={x(p.fecha)} cy={y(p.kg)} r="3" fill="#4a535b" />)}
        <polyline points={media.map((m) => `${x(m.f)},${y(m.v)}`).join(" ")} fill="none" stroke="#f2f4f5" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={x(media[media.length - 1].f)} cy={y(media[media.length - 1].v)} r="5" fill="#ff6a1a" />
        <text x={X0} y={H - 6} fontSize="11" fill="#9aa4ad">{fechaLarga(desde).split(" ").slice(1).join(" ")}</text>
        <text x={X1} y={H - 6} fontSize="11" fill="#9aa4ad" textAnchor="end">hoy</text>
      </svg>
      <span className="text-xs text-tenue">Puntos: cada pesaje. Línea: promedio. El lunes suele salir más alto por el fondo del sábado.</span>
    </section>
  );
}
