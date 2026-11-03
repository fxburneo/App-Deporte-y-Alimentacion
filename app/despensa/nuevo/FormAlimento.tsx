"use client";

// Formulario para agregar un alimento: la IA lee la etiqueta una sola vez y
// los campos quedan editables para revisarlos antes de guardar.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { reducirFoto } from "@/lib/comidas/foto";
import { por100DesdePorcion } from "@/lib/despensa/calculos";
import { guardarAlimento, leerEtiquetaAccion } from "../actions";

type Modo = "foto" | "manual";
const n = (t: string) => {
  const x = Number(t.replace(",", "."));
  return Number.isFinite(x) ? x : 0;
};

export default function FormAlimento() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("foto");
  const [foto, setFoto] = useState<string | null>(null);
  const [leida, setLeida] = useState(false);
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ nombre: "", marca: "", porcion_g: "", porcion_nombre: "", unidad_nombre: "", unidades: "", carbo: "", proteina: "", grasa: "" });
  const [leyendo, startLeer] = useTransition();
  const [guardando, startGuardar] = useTransition();
  const archivo = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const leer = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await reducirFoto(file, 1600, 0.85);
      setFoto(dataUrl);
      const fd = new FormData();
      fd.set("foto", dataUrl);
      startLeer(async () => {
        const r = await leerEtiquetaAccion(fd);
        if (!r.ok) return setError(r.error);
        const e = r.etiqueta;
        setF({
          nombre: e.nombre,
          marca: e.marca,
          porcion_g: String(e.porcion_g),
          porcion_nombre: `${e.porcion_texto} (${e.porcion_g} g)`,
          unidad_nombre: e.unidad_nombre,
          unidades: e.unidades_por_porcion > 0 ? String(e.unidades_por_porcion) : "",
          carbo: String(e.carbo_porcion),
          proteina: String(e.proteina_porcion),
          grasa: String(e.grasa_porcion),
        });
        setNota(e.nota);
        setLeida(true);
      });
    } catch {
      setError("No se pudo abrir la foto.");
    }
  };

  const porcionG = n(f.porcion_g);
  const p100 = porcionG > 0 ? por100DesdePorcion(porcionG, n(f.carbo), n(f.proteina), n(f.grasa)) : null;
  const kcalPorcion = Math.round(n(f.carbo) * 4 + n(f.proteina) * 4 + n(f.grasa) * 9);
  const unidades = n(f.unidades);
  const listo = f.nombre.trim().length >= 2 && porcionG > 0 && (modo === "manual" || leida);

  const guardar = () => {
    setError(null);
    startGuardar(async () => {
      const r = await guardarAlimento({
        nombre: f.nombre,
        marca: f.marca,
        porcion_g: porcionG,
        porcion_nombre: f.porcion_nombre.trim() || `${porcionG} g`,
        unidad_g: unidades > 0 ? Math.round((porcionG / unidades) * 10) / 10 : null,
        unidad_nombre: unidades > 0 ? f.unidad_nombre : "",
        carbo: n(f.carbo),
        proteina: n(f.proteina),
        grasa: n(f.grasa),
        origen: modo === "foto" ? "etiqueta" : "manual",
      });
      if (!r.ok) return setError(r.error);
      router.push("/despensa");
    });
  };

  const campo = (k: keyof typeof f, etiqueta: string, numerico = false) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-tenue">{etiqueta}</span>
      <input
        value={f[k]}
        onChange={set(k)}
        inputMode={numerico ? "decimal" : undefined}
        aria-label={etiqueta}
        className="rounded-[10px] border border-borde bg-superficie px-3 py-2 text-texto"
      />
    </label>
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-[18px] px-[18px] pt-[max(18px,env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between">
        <Link href="/despensa" className="py-2.5 font-semibold text-tenue">Cancelar</Link>
        <h1 className="font-display text-2xl font-bold tracking-[0.04em]">AGREGAR</h1>
        <span className="w-[62px]" />
      </header>

      <div role="tablist" className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-borde">
        {(["foto", "manual"] as const).map((m, i) => (
          <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => setModo(m)}
            className={`p-2.5 ${i > 0 ? "border-l border-borde" : ""} ${modo === m ? "bg-marca font-bold text-fondo" : "bg-superficie font-semibold text-suave"}`}>
            {m === "foto" ? "Foto de la etiqueta" : "Escribir a mano"}
          </button>
        ))}
      </div>

      {modo === "foto" && (
        <section className="flex flex-col gap-2">
          <input ref={archivo} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => leer(e.target.files?.[0])} />
          <button type="button" onClick={() => archivo.current?.click()}
            className="flex h-[150px] items-center justify-center overflow-hidden rounded-[14px] bg-[repeating-linear-gradient(45deg,#171b1f,#171b1f_10px,#1c2126_10px,#1c2126_20px)] font-semibold text-tenue">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local
              <img src={foto} alt="Etiqueta" className="h-full w-full object-cover" />
            ) : (
              "Tomar foto de la tabla nutricional"
            )}
          </button>
          {leyendo && <p className="text-sm text-suave">Leyendo la etiqueta...</p>}
          {!leida && !leyendo && <span className="text-xs text-tenue">La IA la lee una sola vez (unos 4 centavos). Después este alimento ya no usa IA.</span>}
        </section>
      )}

      {(modo === "manual" || leida) && (
        <>
          <section className="grid grid-cols-2 gap-2.5">
            {campo("nombre", "Nombre")}
            {campo("marca", "Marca (opcional)")}
            {campo("porcion_g", "Porción en gramos", true)}
            {campo("porcion_nombre", "Cómo se llama la porción")}
            {campo("unidades", "Unidades por porción (opcional)", true)}
            {campo("unidad_nombre", "Nombre de la unidad")}
          </section>
          <section className="flex flex-col gap-2 rounded-[14px] bg-superficie px-4 py-3.5">
            <span className="etiqueta">Por porción · como en la etiqueta</span>
            <div className="grid grid-cols-3 gap-2.5">
              {campo("carbo", "Carbohidrato g", true)}
              {campo("proteina", "Proteína g", true)}
              {campo("grasa", "Grasa g", true)}
            </div>
            <span className="text-sm text-suave">
              {kcalPorcion} kcal por porción
              {p100 && ` · por 100 g: ${p100.carbo_100} C · ${p100.proteina_100} P · ${p100.grasa_100} G`}
            </span>
          </section>
          {nota && <p className="text-sm text-carbo">{nota}</p>}
          {modo === "foto" && <span className="text-xs text-tenue">Revisa que los números coincidan con la etiqueta antes de guardar.</span>}
        </>
      )}

      {error && <p className="text-sm text-mal">{error}</p>}

      {(modo === "manual" || leida) && (
        <button type="button" onClick={guardar} disabled={!listo || guardando} className="rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-50">
          {guardando ? "GUARDANDO..." : "GUARDAR EN MI DESPENSA"}
        </button>
      )}
    </main>
  );
}
