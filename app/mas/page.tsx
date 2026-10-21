// Más (maqueta 4.1): perfil, modo pausa y accesos. Test de sudoración,
// avisos y conexiones se activan en sus etapas.
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerDatosDia } from "@/lib/datos/dia";
import { kg } from "@/lib/formato";
import { pesoReferencia } from "@/lib/nutricion/motor";
import { edadEnAnios } from "@/lib/perfil/edad";
import { signOut } from "../login/actions";
import { cambiarPausa } from "./actions";

export default async function Page() {
  const d = await leerDatosDia();
  if (!d.perfil) redirect("/bienvenida");
  const p = d.perfil;
  const peso = pesoReferencia(d.pesos, d.fecha);

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <h1 className="font-display text-[34px] font-bold uppercase leading-none tracking-[0.02em]">Más</h1>
          <span className="font-display text-[15px] font-extrabold tracking-[0.12em] text-marca">FXB PERFORMANCE</span>
        </header>

        <section className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <strong className="text-lg">{p.nombre}</strong>
            <Link href="/bienvenida" className="text-[13px] font-bold">Editar</Link>
          </div>
          <div className="grid grid-cols-4 border-y border-linea">
            <Celda valor={String(edadEnAnios(p.fecha_nacimiento))} nombre="Años" />
            <Celda valor={String(Number(p.estatura_cm))} nombre="Cm" borde />
            <Celda valor={peso != null ? kg(peso) : "—"} nombre="Kg prom." borde />
            <Celda valor={`${Number(p.objetivo_min_kg)}–${Number(p.objetivo_max_kg)}`} nombre="Objetivo" borde />
          </div>
          <span className="text-[13px] text-tenue">
            {p.no_incluir.length > 0 ? `Sin ${p.no_incluir.join(", ").toLowerCase()}` : "Sin restricciones"} · {p.ciudad}, {p.altitud_m.toLocaleString("de-DE")} m
          </span>
          <Link href="/peso" className="font-bold">Peso y tendencia ›</Link>
        </section>

        <form action={cambiarPausa} className="flex items-center gap-3.5 border-y border-linea py-3.5">
          <input type="hidden" name="activar" value={p.pausa ? "0" : "1"} />
          <div className="flex flex-1 flex-col">
            <strong className="text-base">Modo pausa</strong>
            <span className="text-[13px] text-tenue">Enfermo, de viaje o lesionado: comes a mantenimiento, sin déficit.</span>
          </div>
          <button
            type="submit"
            role="switch"
            aria-checked={p.pausa}
            aria-label="Modo pausa"
            className={`relative h-8 w-[52px] flex-none rounded-full ${p.pausa ? "bg-marca" : "bg-borde"}`}
          >
            <span className={`absolute top-[3px] h-[26px] w-[26px] rounded-full ${p.pausa ? "right-[3px] bg-fondo" : "left-[3px] bg-tenue"}`} />
          </button>
        </form>

        <section className="flex flex-col">
          <span className="etiqueta pb-1">Próximamente</span>
          <Proximo nombre="Conexión con Garmin (Intervals.icu)" etapa={2} />
          <Proximo nombre="Plan de TrainingPeaks y test de sudoración" etapa={4} />
          <Proximo nombre="Avisos en el iPhone" etapa={7} />
        </section>

        <form action={signOut}>
          <button type="submit" className="w-full rounded-xl border border-borde py-3.5 font-bold text-suave">Salir</button>
        </form>
      </Pantalla>
      <NavBar activa="mas" />
    </>
  );
}

function Celda({ valor, nombre, borde }: { valor: string; nombre: string; borde?: boolean }) {
  return (
    <div className={`flex flex-col py-2.5 ${borde ? "border-l border-linea pl-2.5" : ""}`}>
      <span className="font-display text-[22px] font-semibold leading-tight">{valor}</span>
      <span className="text-[11px] uppercase text-tenue">{nombre}</span>
    </div>
  );
}

function Proximo({ nombre, etapa }: { nombre: string; etapa: number }) {
  return (
    <div className="flex items-center justify-between border-b border-linea py-2.5 last:border-0">
      <span className="text-suave">{nombre}</span>
      <span className="text-xs text-tenue">etapa {etapa}</span>
    </div>
  );
}
