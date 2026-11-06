// Camino a la carrera (maqueta 4b.3): las fases con fecha, calculadas desde
// la fecha y la duración de la carrera. Se mueven solas si cambia la carrera.
import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { createClient } from "@/lib/supabase/server";
import { aCarrera, type CarreraFila } from "@/lib/datos/tipos";
import { fechaCorta, hoyEcuador, sumarDias } from "@/lib/fecha";
import { fasesCarrera, NOMBRE_DEPORTE_CARRERA } from "@/lib/nutricion/carrera";

interface Fase {
  cuando: string;
  titulo: string;
  texto: string;
  color: string;
  desde: string;
  hasta: string;
}

const COLOR = { bien: "#3DDC84", proteina: "#4C9DFF", carbo: "#FFB020", marca: "#FF6A1A" };
const mayus = (s: string) => s.toUpperCase();

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const supabase = await createClient();
  const [{ data }, { data: perfil }] = await Promise.all([
    supabase.from("carreras").select("*").eq("id", id).maybeSingle(),
    supabase.from("perfil").select("deficit_descanso, objetivo_min_kg, objetivo_max_kg").maybeSingle(),
  ]);
  if (!data) notFound();
  const fila = data as CarreraFila;
  const c = aCarrera(fila);
  const f = fasesCarrera(c);
  const hoy = hoyEcuador();
  const semanas = Math.max(0, Math.floor((Date.parse(c.fecha) - Date.parse(hoy)) / (7 * 86400000)));
  const horas = c.horasMin === c.horasMax ? `${c.horasMin} h` : `${c.horasMin} a ${c.horasMax} h`;
  const deficit = perfil?.deficit_descanso ?? 450;
  const meta = perfil ? `${Number(perfil.objetivo_min_kg)}–${Number(perfil.objetivo_max_kg)} kg`.replace(/\./g, ",") : "tu peso objetivo";
  const gkg = f.tipo === "larga" ? "8–10" : "7–8";

  const fases: Fase[] = [];
  const finDeficit = f.sinDeficitDesde ? sumarDias(f.sinDeficitDesde, -1) : sumarDias(f.carga[0] ?? c.fecha, -1);
  fases.push({
    cuando: `HOY → ${mayus(fechaCorta(finDeficit))}`,
    titulo: "Bajar de peso",
    texto: `Déficit de ${deficit} kcal en días de descanso, como hasta ahora. Meta: llegar a ${meta} antes del ${fechaCorta(sumarDias(finDeficit, 1))}.`,
    color: COLOR.bien,
    desde: hoy,
    hasta: finDeficit,
  });
  if (f.sudoracionHasta) {
    fases.push({
      cuando: `ANTES DEL ${mayus(fechaCorta(f.sudoracionHasta))} · 2 FONDOS`,
      titulo: "Test de sudoración",
      texto: "Te pesas antes y después de un fondo de más de 1 h, sin ropa mojada, y anotas lo que tomaste. Así sabes cuánto líquido pierdes por hora. Se repite con calor.",
      color: COLOR.proteina,
      desde: hoy,
      hasta: f.sudoracionHasta,
    });
  }
  if (f.ensayoDesde) {
    fases.push({
      cuando: `DESDE EL ${mayus(fechaCorta(f.ensayoDesde))}`,
      titulo: "Ensayo en los fondos largos",
      texto: "Comes como en carrera (70 g/h, como el año pasado) con lo que vas a llevar y la bebida según tu sudoración.",
      color: COLOR.proteina,
      desde: f.ensayoDesde,
      hasta: sumarDias(c.fecha, -1),
    });
  }
  if (f.sinDeficitDesde) {
    fases.push({
      cuando: `${mayus(fechaCorta(f.sinDeficitDesde))} → ${mayus(fechaCorta(sumarDias(f.carga[0] ?? c.fecha, -1)))} · 3 SEMANAS`,
      titulo: "Sin déficit",
      texto: "Comes lo que gastas. Bajar peso en la recta final quita reservas y fuerza.",
      color: COLOR.carbo,
      desde: f.sinDeficitDesde,
      hasta: sumarDias(f.carga[0] ?? c.fecha, -1),
    });
  }
  if (f.carga.length) {
    fases.push({
      cuando: f.carga.map((d) => mayus(fechaCorta(d))).join(" Y "),
      titulo: "Carga de carbohidratos",
      texto: `${gkg} g/kg al día. Poca fibra y poca grasa, sin comida nueva. Cena temprano la víspera.`,
      color: COLOR.marca,
      desde: f.carga[0],
      hasta: f.carga[f.carga.length - 1],
    });
  }
  fases.push({
    cuando: mayus(fechaCorta(c.fecha)),
    titulo: "Día de carrera",
    texto: "Desayuno 3 h antes y plan por horas: carbohidrato, líquido y sodio.",
    color: COLOR.marca,
    desde: c.fecha,
    hasta: c.fecha,
  });

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <Link href="/carreras" className="min-w-[70px] py-2.5 font-semibold text-tenue">‹ Carreras</Link>
          <h1 className="truncate px-2 font-display text-2xl font-bold tracking-[0.04em]">{mayus(c.nombre)}</h1>
          <Link href={`/carreras/${c.id}/editar`} className="min-w-[70px] text-right font-bold text-marca">Editar</Link>
        </header>
        <span className="-mt-2 text-suave">
          {NOMBRE_DEPORTE_CARRERA[c.deporte]}
          {fila.distancia_km != null ? ` ${Number(fila.distancia_km)} km` : ""} · {horas.replace(/\./g, ",")} · {semanas} semanas
        </span>

        <ol className="flex flex-col">
          {fases.map((x, i) => {
            const ahora = hoy >= x.desde && hoy <= x.hasta;
            return (
              <li key={x.titulo} className="relative flex gap-3 pb-4">
                {i < fases.length - 1 && <span className="absolute top-[18px] -bottom-1 left-[5px] w-0.5 bg-linea" />}
                <span className="mt-1 h-3 w-3 flex-none rounded-full border-2" style={{ borderColor: x.color, background: ahora ? x.color : "transparent" }} />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[11px] font-bold tracking-[0.12em]" style={{ color: x.color }}>{x.cuando}</span>
                  <strong>
                    {x.titulo}
                    {ahora && (
                      <span className="ml-1.5 rounded-full border px-2 align-[2px] text-[10px] font-bold tracking-[0.08em]" style={{ color: x.color, borderColor: x.color }}>AHORA</span>
                    )}
                  </strong>
                  <span className="text-[13px] text-suave">{x.texto}</span>
                </div>
              </li>
            );
          })}
        </ol>

        <Link href={`/carreras/${c.id}/dia`} className="rounded-xl border border-marca py-3 text-center font-extrabold tracking-[0.04em] text-marca">
          PLAN DEL DÍA DE CARRERA
        </Link>
        <span className="text-xs text-tenue">Las fechas se mueven solas si cambias la carrera. El test de sudoración afina líquido y sodio.</span>
      </Pantalla>
      <NavBar activa="mas" />
    </>
  );
}
