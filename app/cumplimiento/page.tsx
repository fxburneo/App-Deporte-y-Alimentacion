// Cumplimiento (maquetas R9 y R10): entreno y alimentación por semana, mes o
// año, con el detalle día por día (o mes a mes), las sesiones del coach y los
// componentes de la alimentación.
import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import Medidor, { colorDe, subAlimentacion, subEntreno } from "@/components/cumplimiento/Medidor";
import { cumplimientoAlimentacion, cumplimientoEntreno, moverPeriodo, rangoPeriodo, type Periodo, type PuntajeDia } from "@/lib/cumplimiento";
import { leerCumplimiento } from "@/lib/datos/cumplimiento";
import { fechaCorta, hoyEcuador } from "@/lib/fecha";
import { duracion } from "@/lib/formato";

const NOMBRES: [Periodo, string][] = [["semana", "Semana"], ["mes", "Mes"], ["anio", "Año"]];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["D", "L", "M", "M", "J", "V", "S"];
const valido = (f?: string) => (f && /^\d{4}-\d{2}-\d{2}$/.test(f) ? f : null);

export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string; f?: string }> }) {
  await connection();
  const sp = await searchParams;
  const periodo: Periodo = sp.p === "mes" || sp.p === "anio" ? sp.p : "semana";
  const hoy = hoyEcuador();
  const fecha = valido(sp.f) ?? hoy;
  const { desde, hasta } = rangoPeriodo(periodo, fecha);
  const r = await leerCumplimiento(desde, hasta, hoy);
  if (!r) redirect("/bienvenida");

  const anterior = moverPeriodo(periodo, fecha, -1);
  const siguiente = moverPeriodo(periodo, fecha, 1);
  const hayFuturo = siguiente <= hoy;
  const titulo =
    periodo === "semana" ? `Semana ${fechaCorta(desde).split(" ")[0]} – ${fechaCorta(hasta)}` : periodo === "mes" ? `${MESES[Number(desde.slice(5, 7)) - 1]} ${desde.slice(0, 4)}` : desde.slice(0, 4);
  const url = (p: Periodo, f: string) => `/cumplimiento?p=${p}&f=${f}`;

  // Barras: por día (semana y mes) o por mes (año).
  const barras =
    periodo === "anio"
      ? MESES.map((m, i) => {
          const mm = `${desde.slice(0, 4)}-${String(i + 1).padStart(2, "0")}`;
          const ali = r.dias.filter((d) => d.fecha.startsWith(mm)).map((d) => d.alimentacion).filter((a): a is PuntajeDia => a != null);
          return { etiqueta: m[0], nombre: m, entreno: cumplimientoEntreno(r.sesiones.filter((s) => s.fecha.startsWith(mm))), alimentacion: cumplimientoAlimentacion(ali) };
        })
      : r.dias.map((d) => {
          const n = Number(d.fecha.slice(8, 10));
          const dow = new Date(d.fecha + "T12:00:00Z").getUTCDay();
          return { etiqueta: periodo === "semana" ? DIAS[dow] : n === 1 || n % 5 === 0 ? String(n) : "", nombre: d.fecha, entreno: d.entreno, alimentacion: d.alimentacion?.total ?? null };
        });
  const meses = barras.filter((b) => b.entreno != null || b.alimentacion != null);
  const mejor = (k: "entreno" | "alimentacion") => meses.filter((m) => m[k] != null).sort((a, b) => b[k]! - a[k]!)[0];
  const promedioMes = (m: (typeof meses)[number]) => ((m.entreno ?? m.alimentacion ?? 0) + (m.alimentacion ?? m.entreno ?? 0)) / 2;
  const peor = [...meses].sort((a, b) => promedioMes(a) - promedioMes(b))[0];
  const c = r.componentes;

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <Link href="/yo" className="min-w-[50px] font-semibold text-tenue">‹ Yo</Link>
          <h1 className="font-display text-2xl font-bold tracking-[0.04em]">CUMPLIMIENTO</h1>
          <span className="min-w-[50px]" />
        </header>

        <nav aria-label="Periodo" className="flex gap-1 rounded-xl bg-superficie p-1">
          {NOMBRES.map(([p, n]) => (
            <Link key={p} href={url(p, fecha)} aria-current={p === periodo ? "page" : undefined} className={`flex-1 rounded-[10px] py-2 text-center no-underline ${p === periodo ? "bg-texto font-extrabold text-fondo" : "font-semibold text-tenue"}`}>
              {n}
            </Link>
          ))}
        </nav>
        <div className="-mt-2 flex items-center justify-center gap-4 text-sm text-tenue">
          <Link href={url(periodo, anterior)} aria-label="Periodo anterior" className="px-2 py-1 text-tenue no-underline">‹</Link>
          <span>{titulo}</span>
          {hayFuturo ? <Link href={url(periodo, siguiente)} aria-label="Periodo siguiente" className="px-2 py-1 text-tenue no-underline">›</Link> : <span className="px-2 py-1 opacity-30">›</span>}
        </div>

        <div className="flex gap-2.5">
          <Medidor nombre="ENTRENO" valor={r.entreno} sub={periodo === "semana" ? subEntreno(r.sesiones) : `${r.sesiones.filter((s) => s.puntaje > 0).length} de ${r.sesiones.length} sesiones`} />
          <Medidor nombre="ALIMENTACIÓN" valor={r.alimentacion} sub={subAlimentacion(r)} />
        </div>

        <Barras titulo={periodo === "anio" ? "Mes a mes" : "Día por día"} items={barras} />

        {periodo === "anio" ? (
          meses.length > 0 && (
            <section className="flex flex-col">
              <span className="etiqueta pb-1">Mejor y peor</span>
              {mejor("entreno") && <Fila nombre="Mejor mes de entreno" sub={mejor("entreno")!.nombre.toLowerCase()} valor={mejor("entreno")!.entreno} />}
              {mejor("alimentacion") && <Fila nombre="Mejor mes de alimentación" sub={mejor("alimentacion")!.nombre.toLowerCase()} valor={mejor("alimentacion")!.alimentacion} />}
              {peor && meses.length > 1 && <Fila nombre="Mes más bajo" sub={peor.nombre.toLowerCase()} valor={Math.round(promedioMes(peor))} />}
            </section>
          )
        ) : (
          <section className="flex flex-col">
            <div className="flex items-baseline justify-between pb-1">
              <span className="etiqueta">Entreno · sesiones</span>
              <span className="text-xs text-tenue">ponderado por duración</span>
            </div>
            {r.sesiones.length === 0 && <p className="py-2 text-sm text-suave">Todavía no hay sesiones del coach para medir en este periodo.</p>}
            {r.sesiones.map((s, i) => (
              <Fila
                key={s.fecha + i}
                nombre={`${DIAS_LARGOS[new Date(s.fecha + "T12:00:00Z").getUTCDay()]} ${periodo === "mes" ? Number(s.fecha.slice(8, 10)) + " " : ""}· ${s.nombre}`}
                sub={s.hechoMin === 0 ? "no hecho" : `${duracion(s.hechoMin)} de ${duracion(s.planMin)}${s.planMin > 0 ? ` (${Math.round((s.hechoMin / s.planMin) * 100)} %)` : ""}`}
                valor={s.puntaje}
              />
            ))}
          </section>
        )}

        <section className="flex flex-col">
          <span className="etiqueta pb-1">Alimentación · promedio</span>
          {!c && <p className="py-2 text-sm text-suave">Se mide con los días ya terminados: aparece desde mañana.</p>}
          {c && (
            <>
              <Fila nombre="Calorías" sub={`en objetivo (90–110 %) ${r.diasKcalOk} de ${r.diasMedidos} días · pesa 40 %`} valor={c.kcal} />
              <Fila nombre="Proteína" sub={`${r.diasProteinaCorta > 0 ? `corta ${r.diasProteinaCorta} de ${r.diasMedidos} días` : "en objetivo"} · pesa 35 %`} valor={c.proteina} />
              <Fila nombre="Carbohidrato del día" sub="dentro de 85–115 % del objetivo · pesa 25 %" valor={c.carbo} />
            </>
          )}
        </section>

        <p className="text-[13px] text-tenue">
          Verde desde 85 %, amarillo 70–84 %, rojo bajo 70 %. Un día sin registrar cuenta 0 % en alimentación; hoy se suma cuando termina. Tus datos empiezan en noviembre de 2026.
        </p>
      </Pantalla>
      <NavBar activa="yo" />
    </>
  );
}

const DIAS_LARGOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function Fila({ nombre, sub, valor }: { nombre: string; sub: string; valor: number | null }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-linea py-2.5 last:border-0">
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{nombre}</span>
        <span className="text-xs text-tenue">{sub}</span>
      </span>
      <span className={`font-display text-lg font-bold ${colorDe(valor)}`}>{valor == null ? "—" : `${valor}%`}</span>
    </div>
  );
}

// Barras pareadas (azul entreno, amarillo alimentación) con la meta de 85 %.
function Barras({ titulo, items }: { titulo: string; items: { etiqueta: string; entreno: number | null; alimentacion: number | null }[] }) {
  const W = 340, H = 120, alto = H - 30;
  const ancho = (W - 20) / items.length;
  const bw = Math.max(2, ancho * 0.32);
  const yMeta = H - 20 - alto * 0.85;
  return (
    <section className="flex flex-col gap-1.5">
      <span className="etiqueta">{titulo}</span>
      <svg role="img" aria-label={`${titulo}: barras de entreno y alimentación`} viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1="10" x2={W - 10} y1={yMeta} y2={yMeta} stroke="#3DDC84" strokeDasharray="4 3" strokeWidth="1" />
        <text x={W - 10} y={yMeta - 4} textAnchor="end" fontSize="10" fill="#3DDC84">meta 85 %</text>
        {items.map((it, i) => {
          const x = 10 + i * ancho + ancho * 0.16;
          return (
            <g key={i}>
              {[it.entreno, it.alimentacion].map((v, j) =>
                v == null ? null : <rect key={j} x={x + j * (bw + 2)} y={H - 20 - (alto * v) / 100} width={bw} height={Math.max(1, (alto * v) / 100)} rx={Math.min(3, bw / 2)} fill={j === 0 ? "#4C9DFF" : "#FFB020"} />,
              )}
              {it.etiqueta && <text x={10 + i * ancho + ancho / 2} y={H - 5} textAnchor="middle" fontSize="11" fill="#A9B3BC">{it.etiqueta}</text>}
            </g>
          );
        })}
      </svg>
      <div className="flex gap-3.5 text-[13px] text-suave">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-proteina" />Entreno</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-carbo" />Alimentación</span>
      </div>
    </section>
  );
}
