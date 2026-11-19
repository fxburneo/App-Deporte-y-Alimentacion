// Pesarme (maqueta R8): el peso del día con − y +, la tendencia de 6 semanas
// y los últimos pesajes. Los datos fijos (estatura, nacimiento) viven en
// Yo › Mis datos.
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import GraficoPeso from "@/components/peso/GraficoPeso";
import { leerDatosDia } from "@/lib/datos/dia";
import { fechaLarga, sumarDias } from "@/lib/fecha";
import { kg } from "@/lib/formato";
import { pesoReferencia } from "@/lib/nutricion/motor";
import FormPeso from "./FormPeso";

export default async function Page() {
  const d = await leerDatosDia();
  if (!d.perfil) redirect("/bienvenida");
  const objMin = Number(d.perfil.objetivo_min_kg);
  const objMax = Number(d.perfil.objetivo_max_kg);
  const deHoy = d.pesos.find((p) => p.fecha === d.fecha);
  // Empieza en el peso de hoy si ya lo cargó; si no, en el último pesaje.
  const inicial = deHoy?.kg ?? d.pesos[0]?.kg ?? 75;
  const ahora = pesoReferencia(d.pesos, d.fecha);
  const antes = pesoReferencia(d.pesos.filter((p) => p.fecha <= sumarDias(d.fecha, -42)), sumarDias(d.fecha, -42)) ?? d.pesos.at(-1)?.kg ?? null;
  const cambio = ahora != null && antes != null ? ahora - antes : null;

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <Link href="/yo" className="min-w-[60px] font-semibold text-tenue">‹ Yo</Link>
          <h1 className="font-display text-2xl font-bold tracking-[0.04em]">PESARME</h1>
          <span className="min-w-[60px]" />
        </header>

        <FormPeso inicial={inicial} yaGuardado={deHoy != null} />

        <section className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="etiqueta">Tendencia · 6 semanas</span>
            {cambio != null && (
              <span className={`font-bold ${cambio <= 0 ? "text-bien" : "text-carbo"}`}>
                {cambio > 0 ? "+" : "−"}{kg(Math.abs(cambio))} kg
              </span>
            )}
          </div>
          <GraficoPeso pesos={d.pesos} hoy={d.fecha} objMin={objMin} objMax={objMax} />
          <span className="text-sm text-suave">Mira la tendencia, no el día: el peso sube y baja 0,5 a 1 kg por agua.</span>
        </section>

        <section className="flex flex-col">
          <span className="etiqueta pb-1">Últimos pesajes</span>
          {d.pesos.length === 0 && <p className="text-suave">Todavía no hay pesajes.</p>}
          {d.pesos.slice(0, 6).map((p) => (
            <div key={p.id} className="flex justify-between border-b border-linea py-2.5 last:border-0">
              <span className="text-suave">{fechaLarga(p.fecha)} {p.origen === "garmin" && <span className="text-tenue">· Garmin</span>}</span>
              <span className="font-display text-lg font-bold">{kg(p.kg)} kg</span>
            </div>
          ))}
        </section>
      </Pantalla>
      <NavBar activa="yo" />
    </>
  );
}
