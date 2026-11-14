// Cómo vas (maqueta 3b.1): base física, cansancio y frescura con la carga de
// Garmin, las últimas 12 semanas, la semana del coach, intensidad y sueño.
import Link from "next/link";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerEntrenoAnalisis } from "@/lib/datos/entreno";
import { diaSemana, fechaCorta, hoyEcuador, sumarDias } from "@/lib/fecha";
import { horasMin, intensidad, resumenSueno, semanaEntreno, serieCarga, textoCansancio, textoFrescura, ultimoHueco } from "@/lib/entreno/analisis";

const DIA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MARCA = { ok: ["✓", "text-bien"], falta: ["—", "text-carbo"], hoy: ["HOY", "text-marca"], luego: ["", ""], libre: ["", ""] } as const;

export default async function Page() {
  const hoy = hoyEcuador();
  const d = await leerEntrenoAnalisis(hoy);
  const serie = serieCarga(d.cargas, d.primera, hoy);
  const h = serie.at(-1)!;
  const hueco = ultimoHueco(d.cargas, d.primera, hoy);
  const enFecha = (f: string) => serie.find((x) => x.fecha === f) ?? serie[0];
  const lunes = sumarDias(hoy, -((diaSemana(hoy) + 6) % 7));
  const semana = semanaEntreno(d.semana, lunes, hoy);
  const zonas = intensidad(d.zonas);
  const sueno = resumenSueno(d.noches);

  // Gráfico: un punto por semana (domingos), últimas 12 semanas.
  const puntos = serie.filter((x, i) => diaSemana(x.fecha) === 0 || i === serie.length - 1).slice(-12);
  const maximo = Math.max(30, ...puntos.map((p) => Math.max(p.base, p.cansancio)));
  const W = 340, H = 110;
  const x = (i: number) => 10 + (i * (W - 20)) / Math.max(1, puntos.length - 1);
  const y = (v: number) => H - 10 - (v * (H - 25)) / maximo;
  const linea = (k: "base" | "cansancio") => puntos.map((p, i) => `${x(i).toFixed(0)},${y(p[k]).toFixed(0)}`).join(" ");
  const iHueco = hueco ? [puntos.findIndex((p) => p.fecha >= hueco.desde), puntos.findIndex((p) => p.fecha >= hueco.hasta)] : null;
  const semanasDesde = hueco ? Math.round((Date.parse(hoy) - Date.parse(hueco.hasta)) / (7 * 86400000)) : 0;
  const baseAntes = hueco ? Math.round(enFecha(hueco.desde).base) : null;
  const semanasCarrera = d.carrera ? Math.round((Date.parse(d.carrera.fecha) - Date.parse(hoy)) / (7 * 86400000)) : null;

  return (
    <>
      <Pantalla>
        <header className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] text-tenue">Semana {fechaCorta(lunes)} – {fechaCorta(sumarDias(lunes, 6))}</span>
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-[0.04em]">CÓMO VAS</h1>
          </div>
          <Link href="/entreno/informe" className="pb-1 font-bold text-marca">Informe semanal ›</Link>
        </header>

        <div className="grid grid-cols-3 gap-2.5">
          <Indicador nombre="Base física" valor={String(Math.round(h.base))} color="text-proteina"
            sub={baseAntes != null && h.base > baseAntes ? `ya pasaste la de antes de la pausa (${baseAntes})` : "tu forma de las últimas 6 semanas"} />
          <Indicador nombre="Cansancio" valor={String(Math.round(h.cansancio))} color="text-marca" sub={textoCansancio(h.base, h.cansancio)} />
          <Indicador nombre="Frescura" valor={`${h.frescura < 0 ? "−" : ""}${Math.abs(Math.round(h.frescura))}`} color="text-carbo" sub={textoFrescura(h.frescura)} />
        </div>

        <section className="flex flex-col gap-2 rounded-[14px] bg-superficie px-4 py-3.5">
          <div className="flex items-baseline justify-between">
            <span className="etiqueta">Últimas 12 semanas</span>
            <span className="text-xs text-tenue"><span className="text-proteina">— base</span> · <span className="text-marca">‐‐ cansancio</span></span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Base física y cansancio de las últimas 12 semanas">
            {iHueco && iHueco[0] >= 0 && (
              <>
                <rect x={x(iHueco[0])} y={5} width={Math.max(8, x(iHueco[1] >= 0 ? iHueco[1] : puntos.length - 1) - x(iHueco[0]))} height={H - 15} fill="#22282E" />
                <text x={x(iHueco[0]) + 4} y={18} fill="#9AA4AD" fontSize={10}>pausa</text>
              </>
            )}
            <polyline points={linea("cansancio")} fill="none" stroke="#FF6A1A" strokeWidth={2} strokeDasharray="4 3" />
            <polyline points={linea("base")} fill="none" stroke="#4C9DFF" strokeWidth={3} />
          </svg>
          <span className="text-[13px] text-suave">
            {hueco && semanasDesde <= 16
              ? `Volviste de la pausa hace ${semanasDesde} semanas y la base subió de ${Math.round(enFecha(hueco.hasta).base)} a ${Math.round(h.base)}.`
              : `La base ${h.base >= (serie.at(-29)?.base ?? 0) ? "subió" : "bajó"} de ${Math.round(serie.at(-29)?.base ?? 0)} a ${Math.round(h.base)} en 4 semanas.`}
            {d.carrera && semanasCarrera != null ? ` Para ${d.carrera.nombre} faltan ${semanasCarrera} semanas.` : ""}
          </span>
        </section>

        <section className="flex flex-col">
          <span className="etiqueta pb-1">Esta semana · plan del coach → lo hecho</span>
          {semana.map((s, i) => (
            <div key={s.fecha} className={`grid grid-cols-[40px_1fr_auto] gap-2 py-2 text-[13px] ${i < 6 ? "border-b border-linea" : ""}`}>
              <strong className="text-tenue">{DIA[diaSemana(s.fecha)]}</strong>
              <span>
                {s.plan || (s.hecho ? "—" : <span className="text-tenue">libre</span>)}
                {s.hecho && <span className="text-tenue"> → {s.hecho}</span>}
              </span>
              <span className={`font-bold ${MARCA[s.estado][1]}`}>{MARCA[s.estado][0]}</span>
            </div>
          ))}
        </section>

        {zonas && (
          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="etiqueta">¿Suave lo suave y fuerte lo fuerte?</span>
              <span className="text-xs text-tenue">últimas 4 semanas</span>
            </div>
            <div className="flex h-3.5 overflow-hidden rounded-full">
              <span style={{ width: `${zonas.suave}%` }} className="bg-proteina" />
              <span style={{ width: `${zonas.media}%` }} className="bg-carbo" />
              <span style={{ width: `${zonas.fuerte}%` }} className="bg-marca" />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-proteina">Suave {zonas.suave} %</span>
              <span className="text-carbo">Media {zonas.media} %</span>
              <span className="text-marca">Fuerte {zonas.fuerte} %</span>
            </div>
            <p className="text-[13px] text-suave">
              {zonas.suave >= 75
                ? "Bien repartido: la mayor parte suave y lo fuerte en su lugar."
                : `La zona media está alta: en trail lo ideal es cerca de 80 % suave.${zonas.ejemplo ? ` Ejemplo: el ${fechaCorta(zonas.ejemplo.fecha)}, ${zonas.ejemplo.zona3Min} de ${zonas.ejemplo.totalMin} min en zona 3.` : ""} Revisa con tu coach: caminar las cuestas, y que las zonas de pulso de Garmin sean las de TrainingPeaks.`}
            </p>
          </section>
        )}

        {sueno && (
          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="etiqueta">Sueño y recuperación</span>
              <span className="text-xs text-tenue">4 semanas</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Indicador nombre="Sueño" valor={horasMin(sueno.promedioMin)} color="text-texto" sub="promedio por noche" />
              {sueno.hrvSemana != null && (
                <Indicador
                  nombre="HRV semanal"
                  valor={String(sueno.hrvSemana)}
                  color={sueno.rango && sueno.hrvSemana < sueno.rango[0] + 3 ? "text-carbo" : "text-texto"}
                  sub={sueno.rango ? `rango ${sueno.rango[0]}–${sueno.rango[1]}${sueno.hrvSemana < sueno.rango[0] + 3 ? ": en el borde bajo" : ""}` : "sin rango todavía"}
                />
              )}
            </div>
            <p className="text-[13px] text-suave">
              {sueno.nochesCortas === 0 ? "Todas las noches dormiste 7 h o más." : `${sueno.nochesCortas} de ${sueno.noches} noches dormiste menos de 7 h.`}
            </p>
          </section>
        )}

        <Link href="/entreno/nuevo" className="text-center text-sm text-tenue underline">Cargar un entreno a mano</Link>
      </Pantalla>
      <NavBar activa="entreno" />
    </>
  );
}

function Indicador({ nombre, valor, sub, color }: { nombre: string; valor: string; sub: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="etiqueta">{nombre}</span>
      <span className={`font-display text-[30px] font-bold leading-none ${color}`}>{valor}</span>
      <span className="text-xs text-suave">{sub}</span>
    </div>
  );
}
