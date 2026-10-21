// Pantalla Hoy (maqueta 2.1). Calcula el objetivo del día con el motor a
// partir del perfil, el peso de referencia y los entrenos de hoy y mañana.
// La recuperación (sueño, HRV) llega con Garmin en la etapa 2 y el registro
// de comidas en la etapa 3; mientras tanto se muestra el objetivo.
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerDatosDia } from "@/lib/datos/dia";
import { aEntreno, aPerfilMotor, NOMBRE_COMIDA, NOMBRE_DEPORTE, type EntrenoFila } from "@/lib/datos/tipos";
import { diaSemana, fechaLarga } from "@/lib/fecha";
import { duracion, kg, miles } from "@/lib/formato";
import {
  COMIDAS,
  entrenosQueCuentan,
  NOMBRE_TIPO,
  objetivoDelDia,
  pesoReferencia,
  repartirComidas,
  tipoDia,
} from "@/lib/nutricion/motor";
import { borrarEntreno } from "./entreno/actions";

const COLOR_TIPO = { descanso: "text-tenue", suave: "text-proteina", moderado: "text-carbo", duro: "text-marca", muy_largo: "text-mal" };
const INTENSIDAD = { suave: "Suave", moderado: "Moderado", fuerte: "Fuerte" };

export default async function Hoy() {
  const d = await leerDatosDia();
  if (!d.perfil) redirect("/bienvenida");

  const pesoKg = pesoReferencia(d.pesos, d.fecha);
  const perfil = aPerfilMotor(d.perfil);
  const hoy = d.entrenosHoy.map(aEntreno);
  const manana = d.entrenosManana.map(aEntreno);

  const pesaHoy = d.perfil.dias_pesaje.includes(diaSemana(d.fecha)) && !d.pesos.some((p) => p.fecha === d.fecha);

  if (pesoKg == null) {
    return (
      <>
        <Pantalla>
          <Encabezado fecha={d.fecha} />
          <p className="text-suave">Para calcular tu día necesito tu peso.</p>
          <Link href="/peso" className="rounded-xl bg-marca py-4 text-center font-extrabold text-fondo">CARGAR PESO</Link>
        </Pantalla>
        <NavBar activa="hoy" />
      </>
    );
  }

  const obj = objetivoDelDia({ perfil, pesoKg, entrenosHoy: hoy, entrenosManana: manana });
  const cuentan = new Set(entrenosQueCuentan(hoy));
  const temprano = hoy.some((e) => e.hora != null && e.hora < perfil.horaDesayuno && e.deporte !== "descanso");
  const reparto = repartirComidas(obj, temprano);
  const tipoManana = tipoDia(manana);
  const filasHoy: { fila: EntrenoFila; cuenta: boolean }[] = d.entrenosHoy.map((fila, i) => ({ fila, cuenta: cuentan.has(hoy[i]) }));

  return (
    <>
      <Pantalla>
        <Encabezado fecha={d.fecha} />

        {d.perfil.pausa && (
          <section className="rounded-[14px] border border-[#4a2a16] bg-[#1f1712] px-3.5 py-3">
            <span className="etiqueta text-marca!">Modo pausa activo</span>
            <p className="text-[#e6e9eb]">Comes a mantenimiento, sin déficit. Desactívalo en Más cuando vuelvas.</p>
          </section>
        )}

        {pesaHoy && (
          <Link href="/peso" className="flex items-center justify-between rounded-[14px] bg-superficie px-4 py-3">
            <span><strong>Hoy toca pesarte</strong><span className="block text-sm text-tenue">En ayunas, después del baño.</span></span>
            <span className="font-bold text-marca">Cargar ›</span>
          </Link>
        )}

        <section className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className="etiqueta">Entreno de hoy</span>
            <Link href="/entreno/nuevo?dia=hoy" className="text-[13px] font-bold">+ Cargar</Link>
          </div>
          {filasHoy.length === 0 ? (
            <div className="rounded-[14px] bg-superficie px-4 py-3.5 text-suave">
              Sin entreno cargado: hoy cuenta como descanso. Desde la etapa 2 llega solo desde Garmin y TrainingPeaks.
            </div>
          ) : (
            filasHoy.map(({ fila, cuenta }) => (
              <div key={fila.id} className={`rounded-[14px] bg-superficie px-4 py-3.5 ${cuenta ? "" : "opacity-50"}`}>
                <div className="flex items-baseline justify-between">
                  <strong className="text-[17px]">{NOMBRE_DEPORTE[fila.deporte]}</strong>
                  <span className={`text-xs font-bold ${fila.estado === "hecho" ? "text-bien" : "text-tenue"}`}>
                    {fila.estado === "hecho" ? "HECHO" : "PLAN"}{fila.hora ? ` ${fila.hora.slice(0, 5)}` : ""}
                  </span>
                </div>
                <div className="mt-2 flex items-end gap-6">
                  <Dato valor={duracion(fila.duracion_min)} nombre="Duración" />
                  <Dato valor={INTENSIDAD[fila.intensidad]} nombre="Intensidad" />
                  {fila.kcal != null && <Dato valor={miles(fila.kcal)} nombre="Kcal reloj" />}
                  <form action={borrarEntreno} className="ml-auto">
                    <input type="hidden" name="id" value={fila.id} />
                    <button type="submit" className="py-1 text-xs text-tenue underline">Borrar</button>
                  </form>
                </div>
                {!cuenta && <p className="mt-1.5 text-xs text-tenue">No cuenta: ya cargaste lo que hiciste.</p>}
              </div>
            ))
          )}
          {filasHoy.some(({ fila }) => fila.estado === "planificado") && !filasHoy.some(({ fila }) => fila.estado === "hecho") && (
            <Link href="/entreno/nuevo?dia=hoy&estado=hecho" className="text-sm font-bold">
              ¿Ya entrenaste? Carga lo que hiciste y el plan se ajusta ›
            </Link>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="etiqueta">Energía del día</span>
            <span className={`text-xs font-bold uppercase ${COLOR_TIPO[obj.tipo]}`}>{NOMBRE_TIPO[obj.tipo]}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[52px] font-bold leading-none">{miles(obj.kcal)}</span>
            <span className="font-display text-[22px] text-tenue">kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            <Macro valor={obj.carboG} nombre="Carbohidratos" color="bg-carbo" />
            <Macro valor={obj.proteinaG} nombre="Proteína" color="bg-proteina" />
            <Macro valor={obj.grasaG} nombre="Grasa" color="bg-grasa" />
          </div>
          <p className="text-sm text-tenue">
            Gastas ~{miles(obj.gastoKcal)} kcal ({miles(obj.entrenoKcal)} del entreno). Déficit de {miles(obj.deficitKcal)} kcal
            para tu objetivo. Peso de referencia: {kg(pesoKg)} kg.
          </p>
        </section>

        {obj.snackPreEntreno && (
          <section className="border-l-[3px] border-carbo py-0.5 pl-3">
            <span className="etiqueta text-carbo!">Antes de entrenar</span>
            <p className="text-suave">Snack de 20–30 g de carbohidrato al levantarte: un banano o una tostada con miel.</p>
          </section>
        )}

        <section className="flex flex-col">
          <span className="etiqueta pb-1.5">Comidas · objetivo por comida</span>
          {COMIDAS.map((c) => (
            <div key={c} className="flex items-center gap-3.5 border-b border-linea py-3 last:border-0">
              <span className="w-[42px] font-display text-base text-tenue">{d.perfil!.horarios_comida[c]}</span>
              <div className="flex flex-1 flex-col">
                <strong>{c === "desayuno" && temprano ? "Desayuno de recuperación" : NOMBRE_COMIDA[c]}</strong>
                <span className="text-xs text-tenue">
                  <span className="text-carbo">{reparto[c].carboG} g C</span> · <span className="text-proteina">{reparto[c].proteinaG} g P</span> ·{" "}
                  <span className="text-grasa">{reparto[c].grasaG} g G</span>
                  {c === "cena" && obj.extraCenaG > 0 && <span className="text-carbo"> · incluye +{obj.extraCenaG} g por mañana</span>}
                </span>
              </div>
            </div>
          ))}
          <p className="pt-2 text-xs text-tenue">El menú con platos concretos llega en la etapa 5; el registro de lo que comes, en la etapa 3.</p>
        </section>

        <section className="border-l-[3px] border-marca py-0.5 pl-3">
          <span className="etiqueta text-marca!">Mañana</span>
          {manana.length === 0 ? (
            <p className="text-suave">
              Sin entreno cargado. <Link href="/entreno/nuevo?dia=manana" className="font-bold">Cargar el plan de mañana ›</Link>
            </p>
          ) : (
            <p className="text-suave">
              {d.entrenosManana.map((e) => `${NOMBRE_DEPORTE[e.deporte]} ${duracion(e.duracion_min)}`).join(" + ")} · {NOMBRE_TIPO[tipoManana].toLowerCase()}.
              {obj.extraCenaG > 0 ? " La cena de hoy lleva carbohidrato extra para llegar con energía." : ""}
            </p>
          )}
        </section>
      </Pantalla>
      <NavBar activa="hoy" />
    </>
  );
}

function Encabezado({ fecha }: { fecha: string }) {
  return (
    <header className="flex items-center justify-between">
      <span className="font-display text-[17px] font-extrabold tracking-[0.12em] text-marca">FXB PERFORMANCE</span>
      <span className="text-[13px] text-tenue">{fechaLarga(fecha)}</span>
    </header>
  );
}

function Dato({ valor, nombre }: { valor: string; nombre: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-[26px] font-semibold leading-tight">{valor}</span>
      <span className="text-[11px] uppercase text-tenue">{nombre}</span>
    </div>
  );
}

function Macro({ valor, nombre, color }: { valor: number; nombre: string; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-1.5 rounded-sm ${color}`} />
      <span className="font-display text-[22px] font-semibold leading-none">{valor} g</span>
      <span className="text-[11px] uppercase text-tenue">{nombre}</span>
    </div>
  );
}
