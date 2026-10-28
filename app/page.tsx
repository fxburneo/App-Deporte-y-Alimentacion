// Pantalla Hoy (maqueta 2.1). Calcula el objetivo del día con el motor a
// partir del perfil, el peso de referencia y los entrenos de hoy y mañana.
// Recuperación desde Garmin (etapa 2) y comidas registradas con el ajuste del
// resto del día (etapa 3).
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerDatosDia } from "@/lib/datos/dia";
import { planDelDia } from "@/lib/datos/planDia";
import { aEntreno, NOMBRE_COMIDA, NOMBRE_DEPORTE, type EntrenoFila } from "@/lib/datos/tipos";
import { diaSemana, fechaLarga, horaEcuador, horasDesde } from "@/lib/fecha";
import { calcularRecuperacion, ETIQUETA_NIVEL, type Recuperacion } from "@/lib/recuperacion";
import BotonActualizar from "./garmin/BotonActualizar";
import { duracion, kg, miles } from "@/lib/formato";
import { kcalDe } from "@/lib/nutricion/ajuste";
import { COMIDAS, entrenosQueCuentan, NOMBRE_TIPO, tipoDia } from "@/lib/nutricion/motor";
import { borrarEntreno } from "./entreno/actions";

const COLOR_TIPO = { descanso: "text-tenue", suave: "text-proteina", moderado: "text-carbo", duro: "text-marca", muy_largo: "text-mal" };
const INTENSIDAD = { suave: "Suave", moderado: "Moderado", fuerte: "Fuerte" };

export default async function Hoy() {
  const d = await leerDatosDia();
  if (!d.perfil) redirect("/bienvenida");

  const plan = planDelDia({ ...d, perfil: d.perfil });
  const hoy = d.entrenosHoy.map(aEntreno);
  const manana = d.entrenosManana.map(aEntreno);

  const pesaHoy = d.perfil.dias_pesaje.includes(diaSemana(d.fecha)) && !d.pesos.some((p) => p.fecha === d.fecha);

  if (plan == null) {
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

  const { objetivo: obj, temprano, ajuste, consumido, totalConsumido, pesoKg } = plan;
  const cuentan = new Set(entrenosQueCuentan(hoy));
  const tipoManana = tipoDia(manana);
  const recuperacion = calcularRecuperacion(d.bienestar, d.fecha);
  const siguienteCambio = ajuste.siguiente ? ajuste.cambios[ajuste.siguiente] : undefined;
  const bienestarHoy = d.bienestar.find((b) => b.fecha === d.fecha) ?? null;
  const sinDatos = d.ultimaSyncOk == null || horasDesde(d.ultimaSyncOk.inicio) >= 48;
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

        {sinDatos && (
          <section className="rounded-[14px] border border-[#5a2326] bg-[#1f1213] px-3.5 py-3">
            <span className="etiqueta text-mal!">Sin datos de Garmin</span>
            <p className="text-[#e6e9eb]">
              {d.ultimaSync?.ok === false ? `La última sincronización falló: ${d.ultimaSync.detalle ?? "error desconocido"}` : "Hace más de 48 horas que no llegan datos nuevos."}
            </p>
            <BotonActualizar texto="Reintentar" />
          </section>
        )}

        <BloqueRecuperacion
          r={recuperacion}
          bienestar={bienestarHoy}
          ultima={d.ultimaSyncOk ? horaEcuador(d.ultimaSyncOk.inicio) : null}
        />

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
              Sin entreno todavía: hoy cuenta como descanso. Lo que hagas con el reloj llega solo desde Garmin.
            </div>
          ) : (
            filasHoy.map(({ fila, cuenta }) => (
              <div key={fila.id} className={`rounded-[14px] bg-superficie px-4 py-3.5 ${cuenta ? "" : "opacity-50"}`}>
                <div className="flex items-baseline justify-between">
                  <strong className="text-[17px]">{fila.origen === "garmin" && fila.nombre ? fila.nombre : NOMBRE_DEPORTE[fila.deporte]}</strong>
                  <span className={`text-xs font-bold ${fila.estado === "hecho" ? "text-bien" : "text-tenue"}`}>
                    {fila.origen === "garmin" ? "GARMIN" : fila.estado === "hecho" ? "HECHO" : "PLAN"}{fila.hora ? ` ${fila.hora.slice(0, 5)}` : ""}
                  </span>
                </div>
                <div className="mt-2 flex items-end gap-6">
                  <Dato valor={duracion(fila.duracion_min)} nombre="Duración" />
                  <Dato valor={INTENSIDAD[fila.intensidad]} nombre="Intensidad" />
                  {fila.kcal != null && <Dato valor={miles(fila.kcal)} nombre="Kcal reloj" />}
                  {fila.origen === "manual" && (
                    <form action={borrarEntreno} className="ml-auto">
                      <input type="hidden" name="id" value={fila.id} />
                      <button type="submit" className="py-1 text-xs text-tenue underline">Borrar</button>
                    </form>
                  )}
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

        {siguienteCambio && ajuste.siguiente && (
          <section className="border-l-[3px] border-marca py-0.5 pl-3">
            <span className="etiqueta text-marca!">Ajuste · {NOMBRE_COMIDA[ajuste.siguiente].toLowerCase()} {d.perfil.horarios_comida[ajuste.siguiente]}</span>
            <p className="text-suave">
              {ajuste.diferenciaKcal > 0 ? "Te pasaste" : "Te faltaron"} {miles(Math.abs(ajuste.diferenciaKcal))} kcal en lo que va del día. La siguiente comida cambia:{" "}
              <Cambio valor={siguienteCambio.carboG} letra="C" color="text-carbo" />
              <Cambio valor={siguienteCambio.proteinaG} letra="P" color="text-proteina" />
              <Cambio valor={siguienteCambio.grasaG} letra="G" color="text-grasa" />.
            </p>
          </section>
        )}

        <section className="flex flex-col">
          <div className="flex items-baseline justify-between pb-1.5">
            <span className="etiqueta">Comidas</span>
            <Link href="/comidas" className="text-[13px] font-bold">
              {miles(Math.round(kcalDe(totalConsumido)))} / {miles(obj.kcal)} kcal ›
            </Link>
          </div>
          {COMIDAS.map((c) => {
            const real = consumido[c];
            const meta = ajuste.objetivos[c];
            const cambio = ajuste.cambios[c];
            return (
              <Link key={c} href={real ? "/comidas" : `/registrar?comida=${c}`} className="flex items-center gap-3.5 border-b border-linea py-3 last:border-0">
                <span className="w-[42px] font-display text-base text-tenue">{d.perfil!.horarios_comida[c]}</span>
                <div className="flex flex-1 flex-col">
                  <strong>
                    {c === "desayuno" && temprano ? "Desayuno de recuperación" : NOMBRE_COMIDA[c]}
                    {cambio && <span className="ml-2 text-[11px] font-bold uppercase text-marca">ajustada</span>}
                  </strong>
                  {real ? (
                    <span className="text-xs text-tenue">
                      Comiste <span className="text-carbo">{Math.round(real.carboG)} C</span> · <span className="text-proteina">{Math.round(real.proteinaG)} P</span> ·{" "}
                      <span className="text-grasa">{Math.round(real.grasaG)} G</span> <span>(objetivo {meta.carboG} · {meta.proteinaG} · {meta.grasaG})</span>
                    </span>
                  ) : (
                    <span className="text-xs text-tenue">
                      <span className="text-carbo">{meta.carboG} g C</span> · <span className="text-proteina">{meta.proteinaG} g P</span> ·{" "}
                      <span className="text-grasa">{meta.grasaG} g G</span>
                      {c === "cena" && obj.extraCenaG > 0 && <span className="text-carbo"> · incluye +{obj.extraCenaG} g por mañana</span>}
                    </span>
                  )}
                </div>
                {real ? (
                  <span className="font-display text-lg font-semibold text-bien">{miles(Math.round(kcalDe(real)))}</span>
                ) : (
                  <span className="text-xl text-tenue">+</span>
                )}
              </Link>
            );
          })}
          <p className="pt-2 text-xs text-tenue">Toca una comida para registrarla. El menú con platos concretos llega en la etapa 5.</p>
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

function Cambio({ valor, letra, color }: { valor: number; letra: string; color: string }) {
  if (valor === 0) return null;
  return <span className={`font-semibold ${color}`}> {valor > 0 ? "+" : ""}{valor} g {letra}</span>;
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

const COLOR_NIVEL = { listo: "#3ddc84", cuidado: "#ffb020", descansa: "#ff5a5f" };

function BloqueRecuperacion({ r, bienestar, ultima }: { r: Recuperacion | null; bienestar: { sueno_seg: number | null; hrv_noche: number | null; fc_reposo: number | null } | null; ultima: string | null }) {
  const sueno = bienestar?.sueno_seg != null ? duracion(Math.round(bienestar.sueno_seg / 60)) + " h" : "—";
  const circ = 2 * Math.PI * 56;
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center gap-[18px]">
        <div className="relative h-[132px] w-[132px] flex-none">
          <svg aria-hidden="true" width="132" height="132" viewBox="0 0 132 132">
            <circle cx="66" cy="66" r="56" fill="none" stroke="#1f2429" strokeWidth="10" />
            {r && (
              <circle cx="66" cy="66" r="56" fill="none" stroke={COLOR_NIVEL[r.nivel]} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(r.puntaje / 100) * circ} ${circ}`} transform="rotate(-90 66 66)" />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[46px] font-bold leading-none">{r ? r.puntaje : "—"}</span>
            <span className="text-[11px] tracking-[0.1em] text-tenue">RECUPERACIÓN</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5">
          <Fila nombre="Sueño" valor={sueno} />
          <Fila nombre="HRV" valor={bienestar?.hrv_noche != null ? `${bienestar.hrv_noche} ms` : "—"} />
          <Fila nombre="FC reposo" valor={bienestar?.fc_reposo != null ? `${bienestar.fc_reposo} lpm` : "—"} ultima />
        </div>
      </div>
      {r ? (
        <p className="text-[15px] text-suave">
          <strong style={{ color: COLOR_NIVEL[r.nivel] }}>{ETIQUETA_NIVEL[r.nivel]}.</strong> {r.mensaje.replace(/^[^:.]*[:.]\s*/, "")}
        </p>
      ) : (
        <p className="text-[15px] text-suave">Tu noche todavía no llega: el reloj la envía cuando sincroniza con el celular al despertar.</p>
      )}
      <div className="flex items-center justify-between text-xs text-tenue">
        <span>{ultima ? `Garmin · actualizado ${ultima}` : "Garmin · sin sincronizar"}</span>
        <BotonActualizar />
      </div>
    </section>
  );
}

function Fila({ nombre, valor, ultima }: { nombre: string; valor: string; ultima?: boolean }) {
  return (
    <div className={`flex justify-between ${ultima ? "" : "border-b border-linea pb-1.5"}`}>
      <span className="text-tenue">{nombre}</span>
      <span className="font-display text-xl font-semibold">{valor}</span>
    </div>
  );
}
