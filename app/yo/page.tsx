// Yo (maqueta R7): tu progreso primero (peso, cumplimiento de la semana,
// racha y próxima carrera A) y los ajustes ordenados abajo.
import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import Medidor, { subAlimentacion, subEntreno } from "@/components/cumplimiento/Medidor";
import GraficoPeso from "@/components/peso/GraficoPeso";
import { AVISOS } from "@/lib/avisos/claves";
import { racha, rangoPeriodo } from "@/lib/cumplimiento";
import { leerCumplimiento, leerFechasConRegistro } from "@/lib/datos/cumplimiento";
import { leerDatosDia } from "@/lib/datos/dia";
import { fechaCorta, sumarDias } from "@/lib/fecha";
import { kg } from "@/lib/formato";
import { aCarrera } from "@/lib/datos/tipos";
import { fasesCarrera } from "@/lib/nutricion/carrera";
import { DEFICIT_DESCANSO_BASE, pesoReferencia } from "@/lib/nutricion/motor";
import { proyeccionPeso } from "@/lib/nutricion/peso";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
// "a fines de enero", "a mediados de marzo", "a inicios de abril"
const cuando = (f: string) => {
  const d = Number(f.slice(8, 10));
  return `${d <= 10 ? "a inicios" : d <= 20 ? "a mediados" : "a fines"} de ${MESES[Number(f.slice(5, 7)) - 1]}`;
};

export default async function Page() {
  await connection();
  const d = await leerDatosDia();
  if (!d.perfil) redirect("/bienvenida");
  const p = d.perfil;
  const { desde, hasta } = rangoPeriodo("semana", d.fecha);
  const [semana, fechas] = await Promise.all([leerCumplimiento(desde, hasta, d.fecha), leerFechasConRegistro(d.fecha)]);

  const objMin = Number(p.objetivo_min_kg);
  const objMax = Number(p.objetivo_max_kg);
  const ahora = pesoReferencia(d.pesos, d.fecha);
  const antes = pesoReferencia(d.pesos.filter((x) => x.fecha <= sumarDias(d.fecha, -28)), sumarDias(d.fecha, -28));
  const proy = proyeccionPeso(d.pesos, objMax, d.fecha);
  const carreraA = d.carreras.find((c) => c.prioridad === "A") ?? null;
  const sinDeficit = carreraA ? fasesCarrera(aCarrera(carreraA)).sinDeficitDesde : null;
  const semanasCarrera = carreraA ? Math.floor((Date.parse(carreraA.fecha) - Date.parse(d.fecha)) / (7 * 86400000)) : null;
  const dias = racha(fechas, d.fecha);
  const avisosActivos = AVISOS.filter((a) => (p.avisos ?? {})[a.clave] !== false).length;

  let frasePeso = "Con 2 semanas de pesajes te digo cuándo llegas al objetivo.";
  if (proy?.fechaObjetivo) {
    frasePeso =
      proy.fechaObjetivo <= d.fecha
        ? "Ya estás en el objetivo: ahora se trata de mantener."
        : `A este ritmo llegas a ${objMax} kg ${cuando(proy.fechaObjetivo)}${sinDeficit ? (proy.fechaObjetivo < sinDeficit ? `, antes de cortar el déficit (${fechaCorta(sinDeficit)}).` : `, después de cortar el déficit (${fechaCorta(sinDeficit)}).`) : "."}`;
  } else if (proy) frasePeso = "El peso está estable: no baja al ritmo esperado.";

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <h1 className="font-display text-[30px] font-bold leading-none tracking-[0.03em]">YO</h1>
          <span className="text-sm text-tenue">{p.nombre}</span>
        </header>

        <section className="flex flex-col gap-1.5 rounded-[18px] bg-superficie p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-extrabold tracking-[0.1em] text-tenue">PESO · TENDENCIA</span>
            <Link href="/peso" className="text-sm font-bold">+ Pesarme</Link>
          </div>
          {ahora == null ? (
            <p className="text-suave">Todavía no hay pesajes.</p>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[40px] font-bold leading-none">{kg(ahora)}</span>
              {antes != null && (
                <span className={`font-bold ${ahora <= antes ? "text-bien" : "text-carbo"}`}>
                  {ahora - antes > 0 ? "+" : "−"}{kg(Math.abs(ahora - antes))} kg en 4 semanas
                </span>
              )}
            </div>
          )}
          <GraficoPeso pesos={d.pesos} hoy={d.fecha} objMin={objMin} objMax={objMax} compacto />
          <span className="text-sm text-suave">{frasePeso}</span>
        </section>

        {semana && (
          <Link href="/cumplimiento" className="flex flex-col gap-2 text-texto no-underline">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-extrabold tracking-[0.1em] text-tenue">CUMPLIMIENTO · ESTA SEMANA</span>
              <span className="text-sm font-bold text-marca">Ver más ›</span>
            </div>
            <div className="flex gap-2.5">
              <Medidor nombre="ENTRENO" valor={semana.entreno} sub={subEntreno(semana.sesiones)} />
              <Medidor nombre="ALIMENTACIÓN" valor={semana.alimentacion} sub={subAlimentacion(semana)} />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Indicador nombre="RACHA" valor={String(dias)} sub={dias === 1 ? "día registrando" : "días registrando"} color="text-marca" />
          {carreraA && semanasCarrera != null ? (
            <Link href={`/carreras/${carreraA.id}`} className="no-underline">
              <Indicador nombre={carreraA.nombre.split(" ")[0].toUpperCase()} valor={String(semanasCarrera)} sub={semanasCarrera === 1 ? "semana" : "semanas"} color="text-proteina" />
            </Link>
          ) : (
            <Link href="/carreras/nueva" className="no-underline">
              <Indicador nombre="CARRERA" valor="+" sub="agrega tu objetivo" color="text-proteina" />
            </Link>
          )}
        </div>

        <section className="flex flex-col">
          <span className="etiqueta pb-1">Ajustes</span>
          <Ajuste href="/mas#avisos" nombre="Avisos" valor={`${avisosActivos} activos`} />
          <Ajuste href="/mas#deficit" nombre="Plan de la nutricionista" valor={`déficit ${p.deficit_descanso ?? DEFICIT_DESCANSO_BASE} en descanso`} />
          <Ajuste href="/carreras" nombre="Carreras" valor={d.carreras[0]?.nombre ?? "ninguna"} />
          <Ajuste href="/mas#pausa" nombre="Modo pausa" valor={p.pausa ? "encendido" : "apagado"} />
          <Ajuste href="/mas#conexiones" nombre="Conexiones" valor="Garmin · TrainingPeaks" />
          <Ajuste href="/bienvenida" nombre="Mis datos" valor="estatura, nacimiento, horarios" />
        </section>
      </Pantalla>
      <NavBar activa="yo" />
    </>
  );
}

function Indicador({ nombre, valor, sub, color }: { nombre: string; valor: string; sub: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[14px] bg-superficie p-3">
      <span className="text-xs font-bold tracking-[0.1em] text-tenue">{nombre}</span>
      <span className={`font-display text-[34px] font-bold leading-none ${color}`}>{valor}</span>
      <span className="text-[13px] text-suave">{sub}</span>
    </div>
  );
}

function Ajuste({ href, nombre, valor }: { href: string; nombre: string; valor: string }) {
  return (
    <Link href={href} className="flex justify-between gap-3 border-b border-linea py-[13px] text-texto no-underline last:border-0">
      <span>{nombre}</span>
      <span className="truncate text-tenue">{valor} ›</span>
    </Link>
  );
}
