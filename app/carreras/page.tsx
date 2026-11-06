// Mis carreras (maqueta 4b.1): la próxima carrera con su cuenta regresiva y
// las demás. Se cargan aquí porque el calendario de TrainingPeaks solo
// comparte 2 semanas; cuando la carrera aparece ahí, se une sola.
import Link from "next/link";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerCarreras } from "@/lib/datos/dia";
import type { CarreraFila } from "@/lib/datos/tipos";
import { fechaConAnio, hoyEcuador } from "@/lib/fecha";
import { NOMBRE_DEPORTE_CARRERA } from "@/lib/nutricion/carrera";

const horas = (c: CarreraFila) => {
  const a = Number(c.horas_min), b = Number(c.horas_max);
  const f = (n: number) => String(n).replace(".", ",");
  return a === b ? `${f(a)} h` : `${f(a)} a ${f(b)} h`;
};
const detalle = (c: CarreraFila) =>
  [NOMBRE_DEPORTE_CARRERA[c.deporte], c.distancia_km != null ? `${String(Number(c.distancia_km)).replace(".", ",")} km` : null, horas(c)].filter(Boolean).join(" · ");

export default async function Page() {
  const hoy = hoyEcuador();
  const todas = await leerCarreras();
  const proximas = todas.filter((c) => c.fecha >= hoy);
  const pasadas = todas.filter((c) => c.fecha < hoy).reverse();
  const [primera, ...resto] = proximas;
  const dias = primera ? Math.round((Date.parse(primera.fecha) - Date.parse(hoy)) / 86400000) : 0;

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <Link href="/mas" className="min-w-[70px] py-2.5 font-semibold text-tenue">‹ Más</Link>
          <h1 className="font-display text-2xl font-bold tracking-[0.04em]">MIS CARRERAS</h1>
          <Link href="/carreras/nueva" className="min-w-[70px] text-right font-bold text-marca">+ Agregar</Link>
        </header>

        {primera ? (
          <section className="flex flex-col gap-2.5 rounded-[14px] bg-superficie px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className={`rounded-full border px-2 text-[10px] font-bold tracking-[0.08em] ${primera.prioridad === "A" ? "border-marca text-marca" : "border-tenue text-tenue"}`}>
                {primera.prioridad === "A" ? "OBJETIVO A" : "PREPARACIÓN B"}
              </span>
              <Link href={`/carreras/${primera.id}/editar`} className="text-[13px] font-bold">Editar</Link>
            </div>
            <span className="font-display text-[30px] font-bold leading-tight">{primera.nombre}</span>
            <span className="text-suave">{fechaConAnio(primera.fecha)} · {detalle(primera)}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-5xl font-bold leading-none">{dias >= 14 ? Math.floor(dias / 7) : dias}</span>
              <span className="font-display text-xl text-tenue">{dias >= 14 ? "semanas" : dias === 1 ? "día" : "días"}</span>
            </div>
            {dias >= 14 && <span className="-mt-1.5 text-[13px] text-tenue">faltan {dias} días</span>}
            <Link href={`/carreras/${primera.id}`} className="rounded-xl bg-marca py-3.5 text-center font-extrabold tracking-[0.04em] text-fondo">
              VER EL CAMINO A LA CARRERA
            </Link>
          </section>
        ) : (
          <section className="flex flex-col gap-3">
            <p className="text-suave">No tienes carreras cargadas. Agrega tu próxima carrera para que la app prepare la alimentación: semanas sin déficit, carga de carbohidratos y plan del día.</p>
            <Link href="/carreras/nueva" className="rounded-xl bg-marca py-3.5 text-center font-extrabold text-fondo">AGREGAR CARRERA</Link>
          </section>
        )}

        {resto.length > 0 && (
          <section className="flex flex-col">
            <span className="etiqueta pb-1">Después</span>
            {resto.map((c) => (
              <Link key={c.id} href={`/carreras/${c.id}`} className="flex flex-col border-b border-linea py-2.5 text-texto no-underline last:border-0">
                <strong>{c.nombre} <span className="text-xs font-bold text-tenue">{c.prioridad}</span></strong>
                <span className="text-xs text-tenue">{fechaConAnio(c.fecha)} · {detalle(c)}</span>
              </Link>
            ))}
          </section>
        )}

        <section className="border-l-[3px] border-proteina py-0.5 pl-3">
          <span className="etiqueta text-proteina!">TrainingPeaks</span>
          <p className="text-sm text-suave">El calendario solo comparte 2 semanas hacia adelante. Cuando la carrera aparezca ahí, se une a esta y no se duplica.</p>
        </section>

        {pasadas.length > 0 && (
          <section className="flex flex-col">
            <span className="etiqueta pb-1">Pasadas</span>
            {pasadas.map((c) => (
              <div key={c.id} className="flex flex-col border-b border-linea py-2.5 last:border-0">
                <strong>{c.nombre}</strong>
                <span className="text-xs text-tenue">{fechaConAnio(c.fecha)} · {detalle(c)}</span>
              </div>
            ))}
          </section>
        )}
      </Pantalla>
      <NavBar activa="mas" />
    </>
  );
}
