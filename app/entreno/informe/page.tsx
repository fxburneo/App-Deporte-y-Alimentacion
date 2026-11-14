// Informe semanal (maqueta 3b.2): números de la semana y lo que escribe Claude
// (mejoró, falta, temas para el coach), para compartir con el coach.
import Link from "next/link";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { createClient } from "@/lib/supabase/server";
import { fechaCorta, hoyEcuador, sumarDias } from "@/lib/fecha";
import { horasMin } from "@/lib/entreno/analisis";
import { lunesInforme } from "@/lib/entreno/informe";
import { InformeSchema } from "@/lib/ia/informeSemanal";
import { construirDatosInforme } from "./datos";
import { Compartir, Generar } from "./Acciones";

export default async function Page({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  const hoy = hoyEcuador();
  const actual = lunesInforme(hoy);
  const pedida = (await searchParams).semana;
  const lunes = pedida && /^\d{4}-\d{2}-\d{2}$/.test(pedida) && pedida <= actual && pedida >= sumarDias(actual, -112) ? pedida : actual;
  const domingo = sumarDias(lunes, 6);
  const supabase = await createClient();
  const [datos, guardado] = await Promise.all([
    construirDatosInforme(lunes),
    supabase.from("informes_semanales").select("contenido, creado_en").eq("semana", lunes).maybeSingle(),
  ]);
  const informe = guardado.data ? InformeSchema.safeParse(guardado.data.contenido) : null;
  const n = datos?.numeros;
  const periodo = `${fechaCorta(lunes)} – ${fechaCorta(domingo)}`;
  const textoCoach =
    informe?.success && n
      ? [
          `Semana ${periodo}`,
          `Entrenos: ${n.entrenos.cumplidos}/${n.entrenos.planificados} · Sueño: ${n.suenoMin != null ? horasMin(n.suenoMin) : "—"} h · Peso: ${n.peso ? `${String(n.peso.kg).replace(".", ",")} kg` : "—"}`,
          "",
          "Lo que mejoró:",
          ...informe.data.mejoro.map((t) => `• ${t}`),
          "",
          "Lo que falta:",
          ...informe.data.falta.map((t) => `• ${t}`),
          "",
          "Para conversar:",
          ...informe.data.coach.map((t, i) => `${i + 1}. ${t}`),
        ].join("\n")
      : "";

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <Link href="/entreno" className="min-w-[70px] py-2.5 font-semibold text-tenue">‹ Entreno</Link>
          <h1 className="text-center font-display text-2xl font-bold tracking-[0.04em]">INFORME</h1>
          <span className="min-w-[70px]" />
        </header>
        <nav className="-mt-2 flex items-center justify-center gap-4 text-sm">
          <Link href={`/entreno/informe?semana=${sumarDias(lunes, -7)}`} aria-label="Semana anterior" className="px-2 text-lg font-bold text-texto">‹</Link>
          <span className="font-bold">{periodo}</span>
          {lunes < actual ? (
            <Link href={`/entreno/informe?semana=${sumarDias(lunes, 7)}`} aria-label="Semana siguiente" className="px-2 text-lg font-bold text-texto">›</Link>
          ) : (
            <span className="px-2 text-lg text-borde">›</span>
          )}
        </nav>

        {n && (
          <div className="grid grid-cols-2 gap-3">
            <Dato nombre="Entrenos" valor={`${n.entrenos.cumplidos}/${n.entrenos.planificados}`} sub="días del plan cumplidos" />
            <Dato nombre="Comidas en objetivo" valor={`${n.comidas.enObjetivo}/${n.comidas.registrados}`} sub="días entre 80 y 110 %" color={n.comidas.enObjetivo < n.comidas.registrados ? "text-carbo" : "text-bien"} />
            <Dato nombre="Sueño promedio" valor={n.suenoMin != null ? horasMin(n.suenoMin) : "—"} sub="por noche" />
            <Dato
              nombre="Peso"
              valor={n.peso ? String(n.peso.kg).replace(".", ",") : "—"}
              sub={n.peso?.cambio != null ? `${n.peso.cambio > 0 ? "+" : ""}${String(n.peso.cambio).replace(".", ",")} kg vs. las 4 semanas previas` : "sin pesajes esta semana"}
              color={n.peso?.cambio != null && n.peso.cambio <= 0 ? "text-bien" : "text-texto"}
            />
          </div>
        )}

        {informe?.success ? (
          <>
            <Lista titulo="Lo que mejoró" items={informe.data.mejoro} />
            <Lista titulo="Lo que falta" items={informe.data.falta} />
            <section className="flex flex-col">
              <span className="etiqueta pb-1">Para hablar con tu coach</span>
              {informe.data.coach.map((t, i) => (
                <div key={i} className="flex gap-3 border-t border-linea py-2">
                  <span className="font-display text-[22px] font-bold text-marca">{i + 1}</span>
                  <span className="text-sm">{t}</span>
                </div>
              ))}
            </section>
            <Compartir texto={textoCoach} />
            <Generar lunes={lunes} regenerar />
            <span className="text-center text-xs text-tenue">Lo escribió Claude con tus datos de la semana. Revísalo antes de mandarlo.</span>
          </>
        ) : (
          <>
            <p className="text-sm text-suave">Claude lee tus entrenos, comidas, sueño y peso de la semana y escribe lo que mejoró, lo que falta y 3 temas para tu coach.</p>
            <Generar lunes={lunes} />
          </>
        )}
      </Pantalla>
      <NavBar activa="entreno" />
    </>
  );
}

function Dato({ nombre, valor, sub, color = "text-texto" }: { nombre: string; valor: string; sub: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="etiqueta">{nombre}</span>
      <span className={`font-display text-[30px] font-bold leading-none ${color}`}>{valor}</span>
      <span className="text-xs text-suave">{sub}</span>
    </div>
  );
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <section className="flex flex-col">
      <span className="etiqueta pb-1">{titulo}</span>
      {items.map((t, i) => (
        <div key={i} className="flex gap-2.5 py-1.5 text-sm">
          <span className="text-tenue">•</span>
          <span>{t}</span>
        </div>
      ))}
    </section>
  );
}
