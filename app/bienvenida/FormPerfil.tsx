"use client";

// Formulario en dos pasos (maquetas 1.1 y 1.2). Es un solo <form>: el paso
// que no se ve queda oculto pero conserva sus valores, y todo se guarda
// junto al final. El resumen de abajo se recalcula mientras escribes.
import { useActionState, useMemo, useState } from "react";
import type { PerfilFila } from "@/lib/datos/tipos";
import { metabolismoReposo } from "@/lib/nutricion/motor";
import { edadEnAnios } from "@/lib/perfil/edad";
import { objetivoSugerido } from "@/lib/perfil/validar";
import { miles } from "@/lib/formato";
import { guardarPerfil } from "./actions";

const COMIDAS = [
  ["desayuno", "Desayuno", "06:45"],
  ["media_manana", "Media mañana", "10:00"],
  ["almuerzo", "Almuerzo", "13:00"],
  ["media_tarde", "Media tarde", "16:00"],
  ["cena", "Cena", "19:00"],
] as const;
const SUGERIDOS = ["Pescado", "Mariscos", "Vísceras", "Lácteos", "Gluten", "Cerdo"];
const DIAS = [
  [1, "L"], [2, "M"], [3, "M"], [4, "J"], [5, "V"], [6, "S"], [0, "D"],
] as const;
const RITMOS = [
  ["moderado", "Moderado", "0,3–0,5 kg/sem"],
  ["recomponer", "Recomponer", "peso estable"],
  ["mantener", "Mantener", "sin déficit"],
] as const;

const campo =
  "min-w-0 rounded-[10px] border border-borde bg-superficie px-3 py-2.5 font-display text-[22px] text-texto focus:border-marca focus:outline-none";

const aNumero = (s: string) => Number(s.replace(",", "."));

export default function FormPerfil({ inicial, pesoActual }: { inicial: PerfilFila | null; pesoActual: number | null }) {
  const [state, formAction, pending] = useActionState(guardarPerfil, { error: null });
  const [paso, setPaso] = useState<1 | 2>(1);
  const [nacimiento, setNacimiento] = useState(inicial?.fecha_nacimiento ?? "1984-07-05");
  const [estatura, setEstatura] = useState(String(inicial?.estatura_cm ?? "181"));
  const [peso, setPeso] = useState(pesoActual != null ? String(pesoActual).replace(".", ",") : "");
  const [grasa, setGrasa] = useState(inicial?.grasa_pct != null ? String(inicial.grasa_pct).replace(".", ",") : "");
  const sugerido = objetivoSugerido(aNumero(estatura) || 181);
  const [objMin, setObjMin] = useState(String(inicial?.objetivo_min_kg ?? sugerido[0]));
  const [objMax, setObjMax] = useState(String(inicial?.objetivo_max_kg ?? sugerido[1]));
  const [noIncluir, setNoIncluir] = useState<string[]>(inicial?.no_incluir ?? ["Pescado", "Mariscos", "Vísceras"]);
  const [otro, setOtro] = useState("");
  const editando = inicial != null;

  // Resumen en vivo: gasto en reposo y proteína diaria.
  const resumen = useMemo(() => {
    const kg = aNumero(peso);
    const cm = aNumero(estatura);
    if (!kg || !cm || !/^\d{4}-\d{2}-\d{2}$/.test(nacimiento)) return null;
    const g = grasa.trim() ? aNumero(grasa) : null;
    return {
      reposo: metabolismoReposo(kg, cm, edadEnAnios(nacimiento), g),
      protMin: Math.round(1.8 * kg),
      protMax: Math.round(2.2 * kg),
    };
  }, [peso, estatura, nacimiento, grasa]);

  const toggle = (x: string) => setNoIncluir((l) => (l.includes(x) ? l.filter((y) => y !== x) : [...l, x]));
  const agregar = () => {
    const t = otro.trim();
    if (t && !noIncluir.includes(t)) setNoIncluir([...noIncluir, t]);
    setOtro("");
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-[22px] px-[18px] pt-[max(20px,env(safe-area-inset-top))] pb-10">
      <header className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          {paso === 1 ? (
            <span className="font-display text-[15px] font-extrabold tracking-[0.12em] text-marca">FXB PERFORMANCE</span>
          ) : (
            <button type="button" onClick={() => setPaso(1)} className="py-1 text-[13px] font-semibold text-tenue">
              ‹ Atrás
            </button>
          )}
          <span className="text-xs text-tenue">Paso {paso} de {editando ? 2 : 4}</span>
        </div>
        <div className={`grid gap-1 ${editando ? "grid-cols-2" : "grid-cols-4"}`}>
          {Array.from({ length: editando ? 2 : 4 }, (_, i) => (
            <span key={i} className={`h-1 rounded-sm ${i < paso ? "bg-marca" : "bg-borde"}`} />
          ))}
        </div>
        <h1 className="font-display text-[40px] font-bold uppercase leading-none">
          {paso === 1 ? "Tus datos" : "Comidas y horarios"}
        </h1>
        {paso === 1 && <p className="text-suave">Con esto calculo tu gasto diario. Lo puedes cambiar después en Más.</p>}
      </header>

      <form action={formAction} className="flex flex-col gap-[22px]">
        {/* Paso 1 */}
        <div hidden={paso !== 1} className="flex flex-col gap-[22px]">
          <section className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="fecha_nacimiento" className="etiqueta">Fecha de nacimiento</label>
              <input id="fecha_nacimiento" name="fecha_nacimiento" type="date" required value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} className={campo} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="estatura_cm" className="etiqueta">Estatura · cm</label>
              <input id="estatura_cm" name="estatura_cm" inputMode="numeric" required value={estatura} onChange={(e) => setEstatura(e.target.value)} className={campo} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="peso_kg" className="etiqueta">Peso hoy · kg</label>
              <input id="peso_kg" name="peso_kg" inputMode="decimal" required={!editando} placeholder={editando ? "Opcional" : ""} value={peso} onChange={(e) => setPeso(e.target.value)} className={campo} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="grasa_pct" className="etiqueta">% de grasa · opcional</label>
              <input id="grasa_pct" name="grasa_pct" inputMode="decimal" placeholder="Si te lo mediste" value={grasa} onChange={(e) => setGrasa(e.target.value)} className={campo} />
              <span className="text-xs text-tenue">Si lo cargas, el cálculo es más preciso.</span>
            </div>
          </section>

          <section className="flex flex-col gap-2.5">
            <span className="etiqueta">Peso objetivo · kg</span>
            <div className="flex items-center gap-3">
              <label htmlFor="objetivo_min_kg" className="sr-only">Mínimo</label>
              <input id="objetivo_min_kg" name="objetivo_min_kg" inputMode="decimal" value={objMin} onChange={(e) => setObjMin(e.target.value)} className={`${campo} w-24 text-center`} />
              <span className="font-display text-2xl text-tenue">–</span>
              <label htmlFor="objetivo_max_kg" className="sr-only">Máximo</label>
              <input id="objetivo_max_kg" name="objetivo_max_kg" inputMode="decimal" value={objMax} onChange={(e) => setObjMax(e.target.value)} className={`${campo} w-24 text-center`} />
            </div>
            <span className="text-suave">
              Sugerido para tu estatura: {sugerido[0]}–{sugerido[1]} kg (IMC ~22). No bajes de {sugerido[0]} kg sin medir tu % de grasa.
            </span>
          </section>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="etiqueta mb-2.5">Ritmo</legend>
            <div className="grid grid-cols-3 overflow-hidden rounded-[10px] border border-borde">
              {RITMOS.map(([valor, nombre, detalle], i) => (
                <label key={valor} className={`flex cursor-pointer flex-col items-center px-1 py-2.5 has-checked:bg-texto has-checked:font-bold has-checked:text-fondo bg-superficie text-suave ${i > 0 ? "border-l border-borde" : ""}`}>
                  <input type="radio" name="ritmo" value={valor} defaultChecked={(inicial?.ritmo ?? "moderado") === valor} className="sr-only" />
                  {nombre}
                  <span className="text-[11px] font-medium opacity-80">{detalle}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {resumen && (
            <section className="grid grid-cols-2 border-y border-linea">
              <div className="flex flex-col border-r border-linea py-3">
                <span className="etiqueta">Gasto en reposo</span>
                <span className="font-display text-[28px] font-bold leading-tight">{miles(resumen.reposo)} kcal</span>
              </div>
              <div className="flex flex-col py-3 pl-3.5">
                <span className="etiqueta">Proteína diaria</span>
                <span className="font-display text-[28px] font-bold leading-tight text-proteina">
                  {resumen.protMin}–{resumen.protMax} g
                </span>
              </div>
            </section>
          )}

          <button type="button" onClick={() => setPaso(2)} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo">
            SIGUIENTE
          </button>
        </div>

        {/* Paso 2 */}
        <div hidden={paso !== 2} className="flex flex-col gap-[22px]">
          <section className="flex flex-col gap-2.5">
            <span className="etiqueta">No incluir en el menú</span>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...SUGERIDOS, ...noIncluir])).map((x) => {
                const activo = noIncluir.includes(x);
                return (
                  <button
                    key={x}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => toggle(x)}
                    className={`rounded-full border px-3 py-2 ${activo ? "border-texto bg-texto font-bold text-fondo" : "border-borde text-suave"}`}
                  >
                    {x}{activo ? " ×" : ""}
                  </button>
                );
              })}
            </div>
            {noIncluir.map((x) => (
              <input key={x} type="hidden" name="no_incluir" value={x} />
            ))}
            <div className="flex gap-2">
              <label htmlFor="otro" className="sr-only">Otro alimento</label>
              <input id="otro" value={otro} onChange={(e) => setOtro(e.target.value)} placeholder="Otro alimento" className="min-w-0 flex-1 rounded-[10px] border border-borde bg-superficie px-3 py-2.5 text-texto" />
              <button type="button" onClick={agregar} className="rounded-[10px] border border-dashed border-[#4a535b] px-4 text-suave">
                + Agregar
              </button>
            </div>
          </section>

          <section className="flex flex-col">
            <span className="etiqueta pb-1">Comidas entre semana</span>
            {COMIDAS.map(([clave, nombre, defecto]) => (
              <div key={clave} className="flex items-center justify-between border-b border-linea py-2 last:border-0">
                <label htmlFor={`hora_${clave}`}>{nombre}</label>
                <input id={`hora_${clave}`} name={`hora_${clave}`} type="time" defaultValue={inicial?.horarios_comida?.[clave] ?? defecto} className="w-28 rounded-lg border border-borde bg-superficie p-1.5 text-center font-display text-xl text-texto" />
              </div>
            ))}
          </section>

          <section className="flex flex-col">
            <span className="etiqueta pb-1">Entreno habitual</span>
            <div className="flex items-center justify-between border-b border-linea py-2">
              <label htmlFor="entreno_semana">Lunes a viernes</label>
              <input id="entreno_semana" name="entreno_semana" type="time" defaultValue={inicial?.entreno_semana?.slice(0, 5) ?? "05:00"} className="w-28 rounded-lg border border-borde bg-superficie p-1.5 text-center font-display text-xl text-texto" />
            </div>
            <div className="flex items-center justify-between py-2">
              <label htmlFor="entreno_finde">Sábado y domingo</label>
              <input id="entreno_finde" name="entreno_finde" type="time" defaultValue={inicial?.entreno_finde?.slice(0, 5) ?? "06:30"} className="w-28 rounded-lg border border-borde bg-superficie p-1.5 text-center font-display text-xl text-texto" />
            </div>
            <span className="pt-1.5 text-xs text-tenue">Con esto la app decide si el desayuno va antes o después del entreno.</span>
          </section>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="etiqueta mb-2.5">Días de pesaje</legend>
            <div className="grid grid-cols-7 gap-1">
              {DIAS.map(([n, letra], i) => (
                <label key={i} className="cursor-pointer rounded-lg bg-superficie py-2 text-center text-tenue has-checked:bg-texto has-checked:font-bold has-checked:text-fondo">
                  <input type="checkbox" name="dias_pesaje" value={n} defaultChecked={(inicial?.dias_pesaje ?? [1, 3, 5]).includes(n)} className="sr-only" />
                  {letra}
                </label>
              ))}
            </div>
          </fieldset>

          {state.error && <p className="text-sm text-mal">{state.error}</p>}

          <div className="flex flex-col gap-2">
            <button type="submit" disabled={pending} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-60">
              {pending ? "GUARDANDO..." : editando ? "GUARDAR CAMBIOS" : "GUARDAR Y EMPEZAR"}
            </button>
            {!editando && (
              <span className="text-center text-xs text-tenue">
                Los pasos 3 (conectar Garmin) y 4 (avisos) se activan en las próximas etapas.
              </span>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
