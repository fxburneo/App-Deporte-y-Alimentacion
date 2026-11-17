// Pantalla Hoy (rediseño v2, maquetas R1-R3): anillos con lo que queda,
// "Ahora toca" con el plato de siempre y "Lo comí" en un toque, recuperación y
// entreno compactos y el día como línea de tiempo. Los números del día (gasto,
// déficit, macros) están en la hoja (i).
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import FranjaDias from "@/components/FranjaDias";
import Pantalla from "@/components/Pantalla";
import Anillos from "@/components/hoy/Anillos";
import DetalleDia from "@/components/hoy/DetalleDia";
import LoComi from "@/components/hoy/LoComi";
import { leerDatosDia } from "@/lib/datos/dia";
import { planDelDia } from "@/lib/datos/planDia";
import { leerDespensa } from "@/lib/datos/despensa";
import { platoDeMomento } from "@/lib/menu/semana";
import { cantidadDe, nombreCorto, totalesItems } from "@/lib/menu/escalar";
import { comidaQueToca } from "@/lib/comidas/queToca";
import { aEntreno, NOMBRE_DEPORTE, NOMBRE_MOMENTO } from "@/lib/datos/tipos";
import { diaSemana, esEditable, fechaHistorial, fechaLarga, horaEcuador, horasDesde, hoyEcuador, sumarDias } from "@/lib/fecha";
import { calcularRecuperacion, ETIQUETA_NIVEL } from "@/lib/recuperacion";
import BotonActualizar from "./garmin/BotonActualizar";
import { duracion, kg, miles } from "@/lib/formato";
import { kcalDe, type Macros } from "@/lib/nutricion/ajuste";
import { COMIDAS, entrenosQueCuentan, NEAT_KCAL, NOMBRE_TIPO, SNACK_PRE_G, tipoDia, type Comida, type Momento } from "@/lib/nutricion/motor";
import type { CarreraDelDia } from "@/lib/nutricion/carrera";
import { borrarEntreno } from "./entreno/actions";

const COLOR_TIPO = { descanso: "text-tenue", suave: "text-proteina", moderado: "text-carbo", duro: "text-marca", muy_largo: "text-mal" };
const COLOR_NIVEL = { listo: "#3ddc84", cuidado: "#ffb020", descansa: "#ff5a5f" };

type Estado = "hecha" | "ahora" | "pend" | "ajustada";
interface Fila {
  momento: Momento;
  nombre: string;
  hora: string;
  estado: Estado;
  detalle: string;
  kcal: number;
}

export default async function Hoy({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const hoyEc = hoyEcuador();
  const fecha = fechaHistorial((await searchParams).fecha, hoyEc);
  const esHoy = fecha === hoyEc;
  // Hasta 7 días atrás se puede registrar y corregir; más atrás, solo lectura.
  const editable = esEditable(fecha, hoyEc);
  const fq = esHoy ? "" : `fecha=${fecha}`;
  const reg = (m: string) => `/registrar?comida=${m}${fq ? `&${fq}` : ""}`;
  const verComidas = esHoy ? "/comidas" : `/comidas?${fq}`;
  const d = await leerDatosDia(fecha);
  if (!d.perfil) redirect("/bienvenida");
  const plan = planDelDia({ ...d, perfil: d.perfil });
  const pesaHoy = esHoy && d.perfil.dias_pesaje.includes(diaSemana(d.fecha)) && !d.pesos.some((p) => p.fecha === d.fecha);

  if (plan == null) {
    return (
      <>
        <Pantalla>
          <Encabezado fecha={d.fecha} esHoy={esHoy} />
          {esHoy ? (
            <>
              <p className="text-suave">Para calcular tu día necesito tu peso.</p>
              <Link href="/peso" className="rounded-xl bg-marca py-4 text-center font-extrabold text-fondo">PESARME</Link>
            </>
          ) : (
            <p className="text-suave">No hay datos de ese día: todavía no tenías un peso registrado.</p>
          )}
        </Pantalla>
        <NavBar activa="hoy" />
      </>
    );
  }

  const { objetivo: obj, ajuste, consumido, totalConsumido, pesoKg, objetivoPre, consumoPre, objetivoDurante, consumoDurante, consumoExtra } = plan;
  const hoy = d.entrenosHoy.map(aEntreno);
  const manana = d.entrenosManana.map(aEntreno);
  const tipoManana = tipoDia(manana);
  const comidoKcal = kcalDe(totalConsumido);
  const recuperacion = calcularRecuperacion(d.bienestar, d.fecha);
  const bienestarHoy = d.bienestar.find((b) => b.fecha === d.fecha) ?? null;
  const sinDatos = esHoy && (d.ultimaSyncOk == null || horasDesde(d.ultimaSyncOk.inicio) >= 48);

  // Plato de siempre de cada momento con las cantidades vigentes.
  const despensa = editable ? await leerDespensa() : { alimentos: [], platos: [] };
  const menuTipo = Object.fromEntries(despensa.platos.filter((p) => p.menu_tipo).map((p) => [p.menu_tipo!, p.alimentos]));
  const horasLargas = entrenosQueCuentan(hoy).filter((e) => e.deporte !== "descanso" && e.deporte !== "fuerza" && e.duracionMin >= 90).reduce((s, e) => s + e.duracionMin / 60, 0);
  const dia = Math.floor(new Date(d.fecha + "T12:00:00Z").getTime() / 86400000);
  const hayEntreno = d.entrenosHoy.some((e) => e.deporte !== "descanso" && e.deporte !== "fuerza" && e.duracion_min > 0);
  const objetivoDe = (m: Momento): Macros | null =>
    m === "pre_entreno" ? (objetivoPre ?? (hayEntreno ? { carboG: SNACK_PRE_G, proteinaG: 0, grasaG: 0 } : null)) : m === "durante" ? objetivoDurante : m === "extra" ? null : ajuste.objetivos[m as Comida];
  const plato = (m: Momento) => (editable ? platoDeMomento({ momento: m, objetivo: objetivoDe(m), tipo: obj.tipo, carga: plan.carrera?.modo === "carga", menuTipo, despensa: despensa.alimentos, horasLargas, dia }) : []);

  // Lo registrado por momento (nombres de los alimentos).
  const registrado = (m: Momento) => d.comidas.filter((c) => c.comida === m);
  const nombres = (m: Momento) => registrado(m).flatMap((c) => c.alimentos.map((a) => nombreCorto(a.nombre).toLowerCase())).join(", ");
  const consumoDe = (m: Momento): Macros | null | undefined => (m === "pre_entreno" ? consumoPre : m === "durante" ? consumoDurante : m === "extra" ? consumoExtra : consumido[m as Comida]);

  const siguiente: Comida | null = esHoy && Object.keys(consumido).length < 5 ? comidaQueToca(d.perfil.horarios_comida, horaEcuador(new Date().toISOString()), new Set(Object.keys(consumido) as Comida[])) : null;
  const momentos: Momento[] = [
    ...(objetivoPre || consumoPre || hayEntreno ? (["pre_entreno"] as Momento[]) : []),
    ...(objetivoDurante || consumoDurante ? (["durante"] as Momento[]) : []),
    ...COMIDAS,
    ...(consumoExtra ? (["extra"] as Momento[]) : []),
  ];
  const horaDe = (m: Momento) => (m === "pre_entreno" ? d.perfil!.entreno_semana.slice(0, 5) : m === "durante" ? "entreno" : m === "extra" ? "—" : d.perfil!.horarios_comida[m as Comida]);
  const filas: Fila[] = momentos.map((m) => {
    const real = consumoDe(m);
    const p = real ? [] : plato(m);
    const estado: Estado = real ? "hecha" : m === siguiente ? "ahora" : COMIDAS.includes(m as Comida) && ajuste.cambios[m as Comida] ? "ajustada" : "pend";
    const meta = objetivoDe(m);
    return {
      momento: m,
      nombre: m === "desayuno" && plan.temprano ? "Desayuno de recuperación" : NOMBRE_MOMENTO[m],
      hora: horaDe(m),
      estado,
      detalle: real ? nombres(m) : p.length ? p.map((a) => `${cantidadDe(a)} ${nombreCorto(a.nombre).toLowerCase()}`.replace(/^a gusto (.*)$/, "$1 a gusto")).join(" · ") : meta ? `${Math.round(meta.carboG)} g C · ${Math.round(meta.proteinaG)} g P · ${Math.round(meta.grasaG)} g G` : "",
      kcal: Math.round(real ? kcalDe(real) : p.length ? totalesItems(p).carboG * 4 + totalesItems(p).proteinaG * 4 + totalesItems(p).grasaG * 9 : meta ? kcalDe(meta) : 0),
    };
  });
  const registradas = filas.filter((f) => f.estado === "hecha" && f.momento !== "extra").length;
  const ahora = siguiente ? plato(siguiente) : [];
  const ahoraKcal = ahora.length ? Math.round(kcalDe(totalesItems(ahora))) : 0;
  const entrenoHoy = d.entrenosHoy.filter((e) => e.deporte !== "descanso");
  const hechos = entrenoHoy.filter((e) => e.estado === "hecho");
  const mostrar = (hechos.length ? hechos : entrenoHoy).filter((e) => e.deporte !== "fuerza" || entrenoHoy.every((x) => x.deporte === "fuerza"));
  const manuales = d.entrenosHoy.filter((e) => e.origen === "manual");

  return (
    <>
      <Pantalla>
        <Encabezado
          fecha={d.fecha}
          esHoy={esHoy}
          detalle={
            <DetalleDia
              n={{
                tipo: NOMBRE_TIPO[obj.tipo].replace("Día ", "día "),
                reposo: obj.reposoKcal,
                vidaDiaria: NEAT_KCAL,
                entreno: obj.entrenoKcal,
                objetivo: obj.kcal,
                comido: Math.round(comidoKcal),
                proteina: { real: totalConsumido.proteinaG, obj: obj.proteinaG, porKg: `${(obj.proteinaG / pesoKg).toFixed(1).replace(".", ",")} g por kilo` },
                grasa: { real: totalConsumido.grasaG, obj: obj.grasaG, porKg: `${(obj.grasaG / pesoKg).toFixed(1).replace(".", ",")} g por kilo` },
                carbo: { real: totalConsumido.carboG, obj: obj.carboG },
                pesoKg: kg(pesoKg),
              }}
            />
          }
        />

        {!esHoy && (
          <section className="flex items-center justify-between rounded-[14px] border border-borde px-3.5 py-2.5">
            <span className="text-sm text-suave">{editable ? "Día anterior: toca una comida para registrarla o corregirla." : "Historial: así quedó ese día."}</span>
            <Link href="/" className="text-sm font-bold text-marca">Volver a hoy</Link>
          </section>
        )}
        {esHoy && d.perfil.pausa && (
          <section className="rounded-[14px] border border-[#4a2a16] bg-[#1f1712] px-3.5 py-3">
            <span className="etiqueta text-marca!">Modo pausa activo</span>
            <p className="text-[#e6e9eb]">Comes a mantenimiento, sin déficit. Desactívalo en Más cuando vuelvas.</p>
          </section>
        )}
        {plan.carrera && <AvisoCarrera c={plan.carrera} />}
        {sinDatos && (
          <section className="rounded-[14px] border border-[#5a2326] bg-[#1f1213] px-3.5 py-3">
            <span className="etiqueta text-mal!">Sin datos de Garmin</span>
            <p className="text-[#e6e9eb]">{d.ultimaSync?.ok === false ? `La última sincronización falló: ${d.ultimaSync.detalle ?? "error desconocido"}` : "Hace más de 48 horas que no llegan datos nuevos."}</p>
            <BotonActualizar texto="Reintentar" />
          </section>
        )}

        {/* Recuperación y entreno, compactos */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2.5 rounded-[14px] bg-superficie px-3 py-2.5">
            <span className="font-display text-[28px] font-bold leading-none" style={{ color: recuperacion ? COLOR_NIVEL[recuperacion.nivel] : "#A9B3BC" }}>{recuperacion ? recuperacion.puntaje : "—"}</span>
            <span className="text-[13px] leading-tight">
              <strong>{recuperacion ? ETIQUETA_NIVEL[recuperacion.nivel] : "Sin datos"}</strong>
              <span className="block text-tenue">
                {bienestarHoy?.sueno_seg != null ? `${duracion(Math.round(bienestarHoy.sueno_seg / 60))} h` : "sueño —"}
                {bienestarHoy?.hrv_noche != null ? ` · HRV ${bienestarHoy.hrv_noche}` : ""}
              </span>
            </span>
          </div>
          <Link href="/entreno" className="flex flex-col justify-center rounded-[14px] bg-superficie px-3 py-2.5 text-texto no-underline">
            <strong className="truncate text-[13px]">
              {mostrar.length ? mostrar.map((e) => `${NOMBRE_DEPORTE[e.deporte]} ${duracion(e.duracion_min)}`).join(" + ") : "Sin entreno"}
            </strong>
            <span className={`text-[13px] ${COLOR_TIPO[obj.tipo]}`}>
              {NOMBRE_TIPO[obj.tipo]}
              {hechos.length ? " · ✓ hecho" : entrenoHoy.length ? " · plan" : ""}
            </span>
          </Link>
        </div>
        {esHoy && (
          <div className="-mt-3 flex items-center justify-between text-xs text-tenue">
            <span>{d.ultimaSyncOk ? `Garmin · ${horaEcuador(d.ultimaSyncOk.inicio)}` : "Garmin · sin sincronizar"}</span>
            <BotonActualizar />
          </div>
        )}
        {manuales.length > 0 && esHoy && (
          <div className="-mt-3 flex flex-wrap gap-3 text-xs text-tenue">
            {manuales.map((e) => (
              <form key={e.id} action={borrarEntreno} className="flex items-center gap-1.5">
                <span>{NOMBRE_DEPORTE[e.deporte]} {duracion(e.duracion_min)} cargado a mano</span>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="underline">Borrar</button>
              </form>
            ))}
          </div>
        )}

        {pesaHoy && (
          <Link href="/peso" className="flex items-center justify-between rounded-[14px] bg-superficie px-4 py-3 text-texto no-underline">
            <span><strong>Hoy toca pesarte</strong><span className="block text-[13px] text-tenue">En ayunas, después del baño.</span></span>
            <span className="font-bold text-marca">Pesarme ›</span>
          </Link>
        )}

        <Anillos
          carbo={{ real: totalConsumido.carboG, obj: obj.carboG }}
          proteina={{ real: totalConsumido.proteinaG, obj: obj.proteinaG }}
          grasa={{ real: totalConsumido.grasaG, obj: obj.grasaG }}
          quedanKcal={Math.round(obj.kcal - comidoKcal)}
        />

        {siguiente && (
          <section className="flex flex-col gap-2.5 rounded-[18px] border border-marca/35 bg-superficie p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-extrabold tracking-[0.1em] text-marca">AHORA TOCA · {d.perfil.horarios_comida[siguiente]}</span>
              {ahoraKcal > 0 && <span className="font-display text-lg font-bold">{miles(ahoraKcal)} kcal</span>}
            </div>
            <strong className="text-xl">{siguiente === "desayuno" && plan.temprano ? "Desayuno de recuperación" : NOMBRE_MOMENTO[siguiente]}</strong>
            {ahora.length > 0 ? (
              <ul className="flex flex-col">
                {ahora.map((i, k) => (
                  <li key={k} className="flex items-baseline justify-between gap-3 border-b border-linea py-1.5 last:border-0">
                    <span className="text-[15px]">{nombreCorto(i.nombre)}</span>
                    <span className={`text-[15px] whitespace-nowrap ${i.varia ? "font-bold text-carbo" : "text-suave"}`}>{cantidadDe(i)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[15px] text-suave">Guarda tu plato de siempre en Mi despensa › Platos para registrarlo en un toque.</span>
            )}
            {obj.tipo !== "descanso" && ahora.some((i) => i.nombre.startsWith("Arroz blanco")) && <span className="text-[13px] text-tenue">{NOMBRE_TIPO[obj.tipo]}: arroz blanco y un poco más de cantidad.</span>}
            <div className="flex gap-2.5">
              {ahora.length > 0 && <LoComi momento={siguiente} nombre={NOMBRE_MOMENTO[siguiente]} />}
              <Link href={reg(siguiente)} className="flex-1 rounded-[14px] border border-borde py-3.5 text-center font-bold text-texto no-underline">Comí otra cosa</Link>
            </div>
          </section>
        )}

        <section className="flex flex-col">
          <div className="flex items-baseline justify-between pb-2">
            <span className="etiqueta">{esHoy ? "Tu día" : "Ese día"}</span>
            <span className="text-[13px] text-tenue">{registradas} de {filas.filter((f) => f.momento !== "extra").length} registradas</span>
          </div>
          {filas.map((f, i) => (
            <FilaDia
              key={f.momento}
              f={f}
              ultimo={i === filas.length - 1}
              href={editable ? (f.estado === "hecha" ? verComidas : reg(f.momento)) : null}
              accion={
                editable && f.estado !== "hecha" && (f.momento === "pre_entreno" || f.momento === "durante") && plato(f.momento).length > 0 ? (
                  <span className="flex items-center gap-3 pt-1.5">
                    <LoComi momento={f.momento} nombre={NOMBRE_MOMENTO[f.momento]} fecha={esHoy ? undefined : d.fecha} compacto />
                    <Link href={reg(f.momento)} className="text-[13px] font-bold text-tenue">Otra cosa</Link>
                  </span>
                ) : null
              }
            />
          ))}
        </section>
        {editable && <Link href={reg("extra")} className="-mt-2 text-sm font-bold text-tenue no-underline">+ Algo fuera de horario</Link>}

        {esHoy && (
          <Link href={`/menu/${sumarDias(d.fecha, 1)}`} className="border-l-[3px] border-proteina py-0.5 pl-3 text-texto no-underline">
            <span className="etiqueta text-proteina!">Mañana</span>
            <p className="text-sm text-suave">
              {manana.filter((e) => e.deporte !== "descanso" && e.duracionMin > 0).length
                ? `${d.entrenosManana.filter((e) => e.deporte !== "descanso" && e.duracion_min > 0).map((e) => `${NOMBRE_DEPORTE[e.deporte]} ${duracion(e.duracion_min)}`).join(" + ")} · ${NOMBRE_TIPO[tipoManana].toLowerCase()}.`
                : "Descanso."}{" "}
              Toca para ver el menú.
            </p>
          </Link>
        )}
      </Pantalla>
      <NavBar activa="hoy" />
    </>
  );
}

const COLOR_ESTADO: Record<Estado, string> = { hecha: "#3ddc84", ahora: "#FF6A1A", pend: "#323A42", ajustada: "#FFB020" };

function FilaDia({ f, ultimo, href, accion }: { f: Fila; ultimo: boolean; href: string | null; accion?: React.ReactNode }) {
  const c = COLOR_ESTADO[f.estado];
  const contenido = (
    <>
      {!ultimo && <span className="absolute top-5 -bottom-1.5 left-[6px] w-0.5 bg-linea" />}
      <span className="mt-1 h-3.5 w-3.5 flex-none rounded-full" style={f.estado === "hecha" ? { background: c } : { border: `2px solid ${c}` }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-2">
          <strong className="text-[15px]">
            {f.nombre}
            {f.estado === "ahora" && <span className="ml-1.5 text-[11px] font-extrabold" style={{ color: c }}>AHORA</span>}
            {f.estado === "ajustada" && <span className="ml-1.5 text-[11px] font-extrabold" style={{ color: c }}>AJUSTADA</span>}
          </strong>
          <span className={`font-display text-[17px] font-semibold ${f.estado === "hecha" ? "text-bien" : "text-suave"}`}>{miles(f.kcal)}</span>
        </div>
        <span className="line-clamp-2 text-[13px] text-tenue">{f.hora} · {f.detalle}</span>
        {accion}
      </div>
    </>
  );
  const cls = "relative flex gap-3 pb-3.5 text-texto no-underline";
  // Con botón propio ("Lo comí") la fila no es enlace: no se puede anidar un botón en un enlace.
  return href && !accion ? <Link href={href} className={cls}>{contenido}</Link> : <div className={cls}>{contenido}</div>;
}

// Aviso de carrera: semanas sin déficit, días de carga y el día de la carrera.
function AvisoCarrera({ c }: { c: CarreraDelDia }) {
  const nombre = c.carrera.nombre;
  if (c.modo === "carga") {
    const cuando = c.diasFaltan === 1 ? "MAÑANA" : `EN ${c.diasFaltan} DÍAS`;
    return (
      <section className="border-l-[3px] border-marca py-0.5 pl-3">
        <span className="etiqueta text-marca!">
          Carga de carbohidratos{c.diasCarga > 1 ? ` · día ${c.diaCarga} de ${c.diasCarga}` : ""} · {nombre} {cuando}
        </span>
        <p className="text-suave">
          Hoy comes más carbohidrato ({String(c.cargaGKg).replace(".", ",")} g/kg) y menos fibra y grasa: arroz blanco, papa, pan, fideos, fruta sin cáscara. Nada de comida nueva.
          {c.diasFaltan === 1 ? " Cena temprano." : ""} Sin déficit. Es normal subir 1–2 kg por agua: no es grasa.
        </p>
      </section>
    );
  }
  if (c.modo === "carrera") {
    return (
      <Link href={`/carreras/${c.carrera.id}/dia`} className="flex items-center justify-between rounded-[14px] border border-[#4a2a16] bg-[#1f1712] px-4 py-3 text-texto no-underline">
        <span>
          <strong>Hoy es {nombre}</strong>
          <span className="block text-sm text-tenue">Desayuno 3 h antes y comida por horas.</span>
        </span>
        <span className="font-bold text-marca">Plan ›</span>
      </Link>
    );
  }
  return (
    <section className="border-l-[3px] border-carbo py-0.5 pl-3">
      <span className="etiqueta text-carbo!">Sin déficit · {nombre} en {c.diasFaltan} días</span>
      <p className="text-suave">Recta final: comes lo que gastas para llegar con reservas y fuerza.</p>
    </section>
  );
}

function Encabezado({ fecha, esHoy, detalle }: { fecha: string; esHoy: boolean; detalle?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="font-display text-[16px] font-extrabold tracking-[0.1em] text-marca">FXB</span>
        <span className={`text-sm ${esHoy ? "text-tenue" : "font-bold text-carbo"}`}>{esHoy ? `Hoy · ${fechaLarga(fecha).split(" ").slice(1).join(" ")}` : fechaLarga(fecha)}</span>
        {detalle ?? <span className="w-[30px]" />}
      </div>
      <FranjaDias fecha={fecha} hoy={hoyEcuador()} ruta="/" />
    </header>
  );
}
