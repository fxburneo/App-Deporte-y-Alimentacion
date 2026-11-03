"use client";

// Formulario de Registrar comida (maquetas 2.3 y 2b.3): foto, texto o "Mis
// comidas" (despensa, platos y recientes, sin IA); la IA
// desglosa en gramos y medida casera, pregunta lo que no ve, y abajo se ve
// la comida contra su objetivo y cómo se ajusta el resto del día.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { cambiarGramos, totales, type Alimento, type Pregunta } from "@/lib/comidas/alimentos";
import { reducirFoto } from "@/lib/comidas/foto";
import type { PlatoFila } from "@/lib/datos/despensa";
import { aAlimento, type AlimentoDespensa } from "@/lib/despensa/calculos";
import { NOMBRE_COMIDA } from "@/lib/datos/tipos";
import { ajustarResto, kcalDe, sumarMacros, type Macros } from "@/lib/nutricion/ajuste";
import { COMIDAS, type Comida } from "@/lib/nutricion/motor";
import { miles } from "@/lib/formato";
import { analizar, guardarComida } from "./actions";

type Modo = "foto" | "texto" | "repetir";
export interface Reciente {
  comida: Comida;
  fecha: string;
  alimentos: Alimento[];
  kcal: number;
}

const signo = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export default function FormRegistrar(props: {
  inicial: Comida;
  horarios: Record<Comida, string>;
  reparto: Record<Comida, Macros>;
  consumido: Partial<Record<Comida, Macros>>;
  mananaExigente: boolean;
  temprano: boolean;
  recientes: Reciente[];
  despensa?: AlimentoDespensa[];
  platos?: PlatoFila[];
}) {
  const router = useRouter();
  const [comida, setComida] = useState<Comida>(props.inicial);
  const [modo, setModo] = useState<Modo>("foto");
  const [foto, setFoto] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [alimentos, setAlimentos] = useState<Alimento[] | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [nota, setNota] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [extra, setExtra] = useState("");
  const [q, setQ] = useState("");
  // Alimento de la despensa de donde salió cada fila (para cambiar por unidades).
  const [fuentes, setFuentes] = useState<(AlimentoDespensa | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analizando, startAnalizar] = useTransition();
  const [guardando, startGuardar] = useTransition();
  const archivo = useRef<HTMLInputElement>(null);

  const limpiar = () => {
    setAlimentos(null);
    setFuentes([]);
    setPreguntas([]);
    setRespuestas({});
    setNota("");
    setError(null);
  };

  const elegirFoto = async (f: File | undefined) => {
    if (!f) return;
    limpiar();
    try {
      setFoto(await reducirFoto(f));
    } catch {
      setError("No se pudo abrir la foto. Prueba con otra.");
    }
  };

  const leerConIA = () => {
    setError(null);
    const fd = new FormData();
    if (modo === "foto" && foto) fd.set("foto", foto);
    fd.set("texto", texto);
    startAnalizar(async () => {
      const r = await analizar(fd);
      if (!r.ok) return setError(r.error);
      setAlimentos(r.analisis.alimentos);
      setFuentes(r.analisis.alimentos.map(() => null));
      setPreguntas(r.analisis.preguntas.filter((p) => p.alimento >= 0 && p.alimento < r.analisis.alimentos.length && p.opciones.length > 0));
      setRespuestas({});
      setNota(r.analisis.nota);
    });
  };

  // En Repetir: sumar algo distinto a la comida elegida, leído con la IA.
  const agregarConIA = () => {
    if (!alimentos || extra.trim().length < 3) return;
    setError(null);
    const fd = new FormData();
    fd.set("texto", extra);
    const base = alimentos.length;
    startAnalizar(async () => {
      const r = await analizar(fd);
      if (!r.ok) return setError(r.error);
      setAlimentos((l) => [...(l ?? []), ...r.analisis.alimentos]);
      setFuentes((f) => [...f, ...r.analisis.alimentos.map(() => null)]);
      setPreguntas((ps) => [
        ...ps,
        ...r.analisis.preguntas
          .filter((p) => p.alimento >= 0 && p.alimento < r.analisis.alimentos.length && p.opciones.length > 0)
          .map((p) => ({ ...p, alimento: p.alimento + base })),
      ]);
      setExtra("");
    });
  };

  // Mis comidas: sumar un plato, un alimento de la despensa o un registro anterior.
  const agregar = (items: Alimento[], fuente: AlimentoDespensa | null = null) => {
    setAlimentos((l) => [...(l ?? []), ...items]);
    setFuentes((f) => [...f, ...items.map(() => fuente)]);
    setQ("");
  };
  const pasoDe = (a: AlimentoDespensa) => a.unidad_g ?? a.porcion_g;
  const cambiarCantidad = (i: number, signo: 1 | -1) => {
    const fuente = fuentes[i];
    if (!fuente || !alimentos) return;
    const paso = pasoDe(fuente);
    const g = Math.max(paso / 2, alimentos[i].gramos + signo * paso);
    setAlimentos((l) => (l ? l.map((x, j) => (j === i ? aAlimento(fuente, g) : x)) : l));
  };

  const responder = (iPregunta: number, iOpcion: number) => {
    const p = preguntas[iPregunta];
    const o = p.opciones[iOpcion];
    setRespuestas((r) => ({ ...r, [iPregunta]: iOpcion }));
    setAlimentos((lista) =>
      lista ? lista.map((a, i) => (i === p.alimento ? { ...a, carbo_g: o.carbo_g, proteina_g: o.proteina_g, grasa_g: o.grasa_g } : a)) : lista
    );
  };

  const recientesComida = props.recientes.filter((r) => r.comida === comida);
  const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const busca = normal(q.trim());
  const platosVista = (props.platos ?? []).filter((p) => !busca || normal(`${p.nombre} ${p.alimentos.map((a) => a.nombre).join(" ")}`).includes(busca));
  const despensaVista = busca ? (props.despensa ?? []).filter((a) => normal(`${a.nombre} ${a.marca ?? ""}`).includes(busca)).slice(0, 8) : [];
  const pendientePregunta = new Set(preguntas.map((p, i) => (respuestas[i] == null ? p.alimento : -1)));
  const faltanRespuestas = preguntas.some((_, i) => respuestas[i] == null);

  // Objetivo vigente de esta comida (con los ajustes de lo ya registrado hoy)
  // y cómo queda el resto del día si se guarda.
  const vista = useMemo(() => {
    if (!alimentos || alimentos.length === 0) return null;
    const t = totales(alimentos);
    const { [comida]: previo, ...otras } = props.consumido;
    const antes = ajustarResto({ objetivos: props.reparto, consumido: otras, mananaExigente: props.mananaExigente });
    const objetivo = antes.objetivos[comida];
    const conEsta = sumarMacros([t, ...(previo ? [previo] : [])]);
    const despues = ajustarResto({
      objetivos: props.reparto,
      consumido: { ...otras, [comida]: conEsta },
      mananaExigente: props.mananaExigente,
    });
    return { t, objetivo, conEsta, despues, previo };
  }, [alimentos, comida, props.consumido, props.reparto, props.mananaExigente]);

  const guardar = () => {
    if (!alimentos) return;
    setError(null);
    startGuardar(async () => {
      const r = await guardarComida({
        comida,
        origen: modo === "repetir" ? "repetida" : modo,
        descripcion: texto.trim(),
        alimentos,
      });
      if (!r.ok) return setError(r.error);
      router.push("/comidas");
    });
  };

  const nombreComida = (c: Comida) => (c === "desayuno" && props.temprano ? "Desayuno de recuperación" : NOMBRE_COMIDA[c]);
  const chip = (activo: boolean) =>
    activo ? "border-texto bg-texto font-bold text-fondo" : "border-borde bg-transparent text-tenue";
  const modoClase = (activo: boolean) => (activo ? "bg-marca font-bold text-fondo" : "bg-superficie font-semibold text-suave");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-[18px] px-[18px] pt-[max(18px,env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="py-2.5 font-semibold text-tenue">Cancelar</Link>
        <h1 className="font-display text-2xl font-bold tracking-[0.04em]">REGISTRAR</h1>
        <span className="w-[62px]" />
      </header>

      <div className="-mx-[18px] flex gap-1.5 overflow-x-auto px-[18px] pb-0.5">
        {COMIDAS.map((c) => (
          <button key={c} type="button" aria-pressed={comida === c} onClick={() => { setComida(c); if (modo === "repetir") limpiar(); }} className={`flex-none rounded-full border px-3 py-2 text-[13px] whitespace-nowrap ${chip(comida === c)}`}>
            {NOMBRE_COMIDA[c]}
            {props.consumido[c] ? " ✓" : ""}
          </button>
        ))}
      </div>

      <div role="tablist" className="grid grid-cols-3 overflow-hidden rounded-xl border border-borde">
        {(
          [
            ["foto", "Foto", <path key="f" d="M4 8h3l2-3h6l2 3h3v11H4zM8.5 13a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0" />],
            ["texto", "Escribir", <path key="t" d="M5 7h14M5 12h14M5 17h9" />],
            ["repetir", "Mis comidas", <path key="r" d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />],
          ] as [Modo, string, React.ReactNode][]
        ).map(([m, nombre, icono], i) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            onClick={() => {
              setModo(m);
              limpiar();
            }}
            className={`flex flex-col items-center gap-1 px-1.5 py-3 ${i > 0 ? "border-l border-borde" : ""} ${modoClase(modo === m)}`}
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {icono}
            </svg>
            {nombre}
          </button>
        ))}
      </div>

      {modo === "foto" && (
        <section className="flex flex-col gap-2.5">
          <input ref={archivo} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => elegirFoto(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => archivo.current?.click()}
            className="flex h-[180px] items-center justify-center overflow-hidden rounded-[14px] bg-[repeating-linear-gradient(45deg,#171b1f,#171b1f_10px,#1c2126_10px,#1c2126_20px)] font-semibold text-tenue"
          >
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local, no pasa por el optimizador
              <img src={foto} alt="Foto del plato" className="h-full w-full object-cover" />
            ) : (
              "Tomar o elegir foto del plato"
            )}
          </button>
          <label htmlFor="detalle" className="sr-only">Detalle opcional</label>
          <input
            id="detalle"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Opcional: lo que no se ve (p. ej. jugo sin azúcar)"
            className="rounded-[10px] border border-borde bg-superficie px-3 py-2.5 text-texto placeholder:text-tenue"
          />
        </section>
      )}

      {modo === "texto" && (
        <section className="flex flex-col gap-1.5">
          <label htmlFor="texto" className="etiqueta">Qué comiste</label>
          <textarea
            id="texto"
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej.: 2 huevos revueltos, 1 pan integral con mantequilla y un café con leche"
            className="rounded-[10px] border border-borde bg-superficie px-3 py-2.5 text-texto placeholder:text-tenue"
          />
          <span className="text-xs text-tenue">Si sabes los gramos, ponlos: la estimación queda exacta.</span>
        </section>
      )}

      {modo === "repetir" && (
        <section className="flex flex-col gap-2">
          <label htmlFor="buscar" className="sr-only">Buscar en mis comidas</label>
          <input
            id="buscar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en tu despensa: yogur, pollo, galletas..."
            className="rounded-[10px] border border-borde bg-superficie px-3 py-2.5 text-texto placeholder:text-tenue"
          />
          {despensaVista.length > 0 && (
            <div className="flex flex-col">
              <span className="etiqueta pb-1">Despensa</span>
              {despensaVista.map((a) => (
                <button key={a.id} type="button" onClick={() => agregar([aAlimento(a, a.porcion_g)], a)} className="flex items-center justify-between gap-3 border-b border-linea py-2.5 text-left last:border-0">
                  <span className="flex flex-col">
                    <strong>{a.nombre}</strong>
                    <span className="text-xs text-tenue">{a.marca ? `${a.marca} · ` : ""}{a.porcion_nombre}</span>
                  </span>
                  <span className="text-xl text-marca">+</span>
                </button>
              ))}
            </div>
          )}
          {platosVista.length > 0 && (
            <div className="flex flex-col">
              <span className="etiqueta pb-1">Mis platos</span>
              {platosVista.slice(0, 5).map((p) => (
                <button key={p.id} type="button" onClick={() => agregar(p.alimentos)} className="flex items-center justify-between gap-3 border-b border-linea py-2.5 text-left last:border-0">
                  <span className="flex flex-col">
                    <strong>{p.nombre}</strong>
                    <span className="text-xs text-tenue">{p.alimentos.map((a) => a.nombre).join(", ")}</span>
                  </span>
                  <span className="text-xl text-marca">+</span>
                </button>
              ))}
            </div>
          )}
          {!busca && (
            <div className="flex flex-col">
              <span className="etiqueta pb-1">{NOMBRE_COMIDA[comida]} · anteriores</span>
              {recientesComida.length === 0 ? (
                <p className="text-sm text-tenue">
                  Todavía no hay registros de {NOMBRE_COMIDA[comida].toLowerCase()} para repetir. La primera vez regístralo con Foto o Escribir.
                </p>
              ) : (
                recientesComida.map((r, k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => agregar(r.alimentos)}
                    className="flex items-center justify-between gap-3 border-b border-linea py-2.5 text-left last:border-0"
                  >
                    <span className="flex flex-col">
                      <strong>{r.alimentos.map((a) => a.nombre).join(", ")}</strong>
                      <span className="text-xs text-tenue">{r.fecha.slice(8, 10)}/{r.fecha.slice(5, 7)} · {miles(r.kcal)} kcal</span>
                    </span>
                    <span className="text-xl text-marca">+</span>
                  </button>
                ))
              )}
            </div>
          )}
        </section>
      )}

      {modo !== "repetir" && !alimentos && (
        <button
          type="button"
          onClick={leerConIA}
          disabled={analizando || (modo === "foto" ? !foto : texto.trim().length < 3)}
          className="rounded-xl border border-marca py-3.5 font-extrabold tracking-[0.04em] text-marca disabled:opacity-40"
        >
          {analizando ? "LEYENDO LA COMIDA..." : "CALCULAR CON IA"}
        </button>
      )}

      {alimentos && (
        <section className="flex flex-col">
          <div className="flex items-baseline justify-between pb-1">
            <span className="etiqueta">{modo === "repetir" ? "Lo que vas a registrar" : "Lo que ve la IA"}</span>
            <span className="text-xs text-tenue">toca un alimento para cambiar gramos o quitarlo</span>
          </div>
          {alimentos.map((a, i) => (
            <div key={i} className="border-b border-linea py-2.5 last:border-0">
              <button type="button" onClick={() => setEditando(editando === i ? null : i)} className="flex w-full items-center justify-between gap-3 text-left">
                <span className="flex flex-col">
                  <strong>{a.nombre}</strong>
                  <span className="text-xs text-tenue">
                    {Math.round(a.gramos)} g · {a.medida_casera}
                    {a.detalle ? ` · ${a.detalle}` : ""}
                  </span>
                </span>
                <span className="font-display text-base font-semibold whitespace-nowrap">
                  <span className="text-carbo">{pendientePregunta.has(i) ? "?" : Math.round(a.carbo_g)} C</span>{"  "}
                  <span className="text-proteina">{Math.round(a.proteina_g)} P</span>{"  "}
                  <span className="text-grasa">{Math.round(a.grasa_g)} G</span>
                </span>
              </button>
              {fuentes[i] && (
                <div className="mt-2 flex items-center gap-3">
                  <button type="button" aria-label={`Menos ${a.nombre}`} onClick={() => cambiarCantidad(i, -1)} className="h-9 w-9 rounded-full border border-borde bg-superficie text-lg">−</button>
                  <span className="min-w-[110px] text-center font-display text-lg font-semibold">{a.medida_casera}</span>
                  <button type="button" aria-label={`Más ${a.nombre}`} onClick={() => cambiarCantidad(i, 1)} className="h-9 w-9 rounded-full border border-borde bg-superficie text-lg">+</button>
                </div>
              )}
              {editando === i && (
                <div className="mt-2 flex items-center gap-2">
                  <label htmlFor={`g-${i}`} className="text-sm text-tenue">Gramos</label>
                  <input
                    id={`g-${i}`}
                    inputMode="numeric"
                    defaultValue={Math.round(a.gramos)}
                    onBlur={(e) => {
                      const g = Number(e.target.value.replace(",", "."));
                      const fuente = fuentes[i];
                      setAlimentos((l) => (l ? l.map((x, j) => (j === i ? (fuente && g > 0 ? aAlimento(fuente, g) : cambiarGramos(x, g)) : x)) : l));
                    }}
                    className="w-24 rounded-[10px] border border-borde bg-superficie px-3 py-2 font-display text-lg text-texto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAlimentos((l) => (l ? l.filter((_, j) => j !== i) : l));
                      setFuentes((f) => f.filter((_, j) => j !== i));
                      setPreguntas((ps) => ps.filter((p) => p.alimento !== i).map((p) => (p.alimento > i ? { ...p, alimento: p.alimento - 1 } : p)));
                      setRespuestas({});
                      setEditando(null);
                    }}
                    className="ml-auto text-sm text-tenue underline"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          ))}
          {nota && <p className="pt-2 text-sm text-tenue">{nota}</p>}
          {modo === "repetir" && (
            <div className="flex flex-col gap-2 pt-3">
              <label htmlFor="extra" className="etiqueta">Agregar algo distinto</label>
              <div className="flex gap-2">
                <input
                  id="extra"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Ej.: 1 banano, 1 cucharada de mantequilla de maní"
                  className="min-w-0 flex-1 rounded-[10px] border border-borde bg-superficie px-3 py-2.5 text-texto placeholder:text-tenue"
                />
                <button
                  type="button"
                  onClick={agregarConIA}
                  disabled={analizando || extra.trim().length < 3}
                  className="rounded-[10px] border border-marca px-3 font-bold text-marca disabled:opacity-40"
                >
                  {analizando ? "..." : "Agregar"}
                </button>
              </div>
              <button type="button" onClick={limpiar} className="self-start text-sm text-tenue underline">
                Vaciar y empezar de nuevo
              </button>
            </div>
          )}
        </section>
      )}

      {preguntas.map((p, ip) => (
        <section key={ip} className="flex flex-col gap-2 border-l-[3px] border-carbo py-0.5 pl-3">
          <span className="font-semibold">{p.texto}</span>
          <div className="flex gap-2">
            {p.opciones.map((o, io) => (
              <button
                key={io}
                type="button"
                aria-pressed={respuestas[ip] === io}
                onClick={() => responder(ip, io)}
                className={`flex-1 rounded-[10px] border p-2.5 ${respuestas[ip] === io ? "border-texto bg-texto font-bold text-fondo" : "border-borde bg-superficie font-semibold text-texto"}`}
              >
                {o.etiqueta}
              </button>
            ))}
          </div>
        </section>
      ))}

      {vista && (
        <section className="flex flex-col gap-2.5 rounded-[14px] bg-superficie px-4 py-3.5">
          <div className="flex items-baseline justify-between">
            <span className="etiqueta">{nombreComida(comida)} contra el objetivo</span>
            <span className="font-display text-lg font-bold">
              {miles(vista.t.kcal)} <span className="text-[13px] text-tenue">/ {miles(kcalDe(vista.objetivo))} kcal</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Total nombre="Carbo" real={vista.t.carboG} obj={vista.objetivo.carboG} color="text-carbo" />
            <Total nombre="Proteína" real={vista.t.proteinaG} obj={vista.objetivo.proteinaG} color="text-proteina" />
            <Total nombre="Grasa" real={vista.t.grasaG} obj={vista.objetivo.grasaG} color="text-grasa" />
          </div>
          {vista.previo && <span className="text-xs text-tenue">Ya tenías {miles(kcalDe(vista.previo))} kcal registradas en esta comida; se suman.</span>}
        </section>
      )}

      {vista && <AvisoAjuste ajuste={vista.despues} horarios={props.horarios} nombreComida={nombreComida} />}

      {error && <p className="text-sm text-mal">{error}</p>}

      {alimentos && (
        <>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || faltanRespuestas || alimentos.length === 0}
            className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo uppercase disabled:opacity-50"
          >
            {guardando ? "Guardando..." : faltanRespuestas ? "Responde la pregunta" : `Guardar ${nombreComida(comida)}`}
          </button>
          <span className="-mt-2 text-center text-xs text-tenue">
            {modo === "foto" ? "La estimación por foto puede variar ±20 %. " : ""}Si pesas algo, corrige los gramos y queda exacto.
          </span>
        </>
      )}
    </main>
  );
}

function Total({ nombre, real, obj, color }: { nombre: string; real: number; obj: number; color: string }) {
  const d = Math.round(real - obj);
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`font-display text-[22px] font-bold ${color}`}>
        {Math.round(real)}
        <span className="text-sm text-tenue"> / {obj} g</span>
      </span>
      <span className="text-[11px] text-tenue">
        {nombre} · {signo(d)} g
      </span>
    </div>
  );
}

function AvisoAjuste({
  ajuste,
  horarios,
  nombreComida,
}: {
  ajuste: ReturnType<typeof ajustarResto>;
  horarios: Record<Comida, string>;
  nombreComida: (c: Comida) => string;
}) {
  const cambios = Object.entries(ajuste.cambios) as [Comida, Macros][];
  if (cambios.length === 0) {
    if (ajuste.pendientes.length === 0 || Math.abs(ajuste.diferenciaKcal) < 60) return null;
  }
  const pasaste = ajuste.diferenciaKcal > 0;
  const titulo =
    cambios.length === 0
      ? `Te ${pasaste ? "pasaste" : "faltaron"} ${miles(Math.abs(ajuste.diferenciaKcal))} kcal, pero no quedan comidas por ajustar`
      : `Te ${pasaste ? "pasaste" : "faltaron"} ${miles(Math.abs(ajuste.diferenciaKcal))} kcal: así se ajusta el resto del día`;
  return (
    <section className="flex flex-col gap-1.5 border-l-[3px] border-marca py-0.5 pl-3">
      <span className="etiqueta text-marca!">{titulo}</span>
      {cambios.map(([c, d]) => (
        <span key={c}>
          <strong>
            {nombreComida(c)} {horarios[c]}
          </strong>{" "}
          <span className="text-tenue">·</span>
          {d.carboG !== 0 && <span className="text-carbo"> {signo(d.carboG)} g C</span>}
          {d.proteinaG !== 0 && <span className="text-proteina"> {signo(d.proteinaG)} g P</span>}
          {d.grasaG !== 0 && <span className="text-grasa"> {signo(d.grasaG)} g G</span>}
          <span className="block text-xs text-tenue">{pista(d)}</span>
        </span>
      ))}
      <span className="text-xs text-tenue">
        La proteína no se toca. Se compensa hasta 30 % de lo que queda; el resto se acepta y no pasa a mañana.
      </span>
    </section>
  );
}

function pista(d: Macros): string {
  const partes: string[] = [];
  if (d.proteinaG > 0) partes.push("suma proteína (yogur griego, huevos, pollo o queso fresco)");
  if (d.carboG < 0) partes.push("menos arroz, pan, papa o fruta");
  if (d.carboG > 0) partes.push("un poco más de arroz, pan, papa o fruta");
  if (d.grasaG < 0) partes.push("menos aceite, aguacate o queso");
  const t = partes.join("; ");
  return t ? t.charAt(0).toUpperCase() + t.slice(1) + "." : "";
}
