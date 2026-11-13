"use client";

// Avisos en el iPhone (maqueta 4.1, etapa 7). iOS solo permite avisos cuando
// la app está agregada a la pantalla de inicio y se abre desde ahí.
import { useEffect, useState, useTransition } from "react";
import { AVISOS, claveABytes } from "@/lib/avisos/claves";
import { cambiarAviso, enviarPrueba, guardarSuscripcion, quitarSuscripcion } from "./avisos-actions";

type Estado = "cargando" | "sin_soporte" | "instalar" | "bloqueado" | "inactivo" | "activo";

export default function Avisos({ preferencias, clavePublica }: { preferencias: Record<string, boolean>; clavePublica: string | null }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [prefs, setPrefs] = useState(preferencias);
  const [ocupado, start] = useTransition();

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const instalada = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setEstado(ios && !instalada ? "instalar" : "sin_soporte");
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const sub = await reg.pushManager.getSubscription();
      setEstado(sub ? "activo" : "inactivo");
    })().catch(() => setEstado("sin_soporte"));
  }, []);

  const activar = () =>
    start(async () => {
      setMensaje(null);
      if (!clavePublica) return setMensaje("Falta la clave de avisos en el servidor. Avísame por el chat.");
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") return setEstado("bloqueado");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveABytes(clavePublica) });
      const r = await guardarSuscripcion(JSON.parse(JSON.stringify(sub)));
      if (!r.ok) return setMensaje(r.error ?? "No se pudo activar.");
      setEstado("activo");
      const p = await enviarPrueba();
      setMensaje(p.mensaje);
    });

  const desactivar = () =>
    start(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await quitarSuscripcion(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("inactivo");
      setMensaje(null);
    });

  const probar = () => start(async () => setMensaje((await enviarPrueba()).mensaje));

  const cambiar = (clave: string) =>
    start(async () => {
      const nuevo = prefs[clave] === false;
      setPrefs((p) => ({ ...p, [clave]: nuevo }));
      await cambiarAviso(clave, nuevo);
    });

  return (
    <section className="flex flex-col gap-1">
      <span className="etiqueta pb-1">Avisos</span>

      {estado === "instalar" && (
        <p className="rounded-[12px] bg-superficie px-3.5 py-3 text-sm text-suave">
          Para recibir avisos en el iPhone, agrega la app a la pantalla de inicio: en Safari toca <strong>Compartir</strong> ›{" "}
          <strong>Agregar a inicio</strong>, y ábrela desde ese ícono.
        </p>
      )}
      {estado === "bloqueado" && (
        <p className="rounded-[12px] bg-superficie px-3.5 py-3 text-sm text-suave">
          Los avisos están bloqueados. Actívalos en Ajustes del iPhone › Notificaciones › FXB, y vuelve a esta pantalla.
        </p>
      )}
      {estado === "sin_soporte" && <p className="text-sm text-tenue">Este navegador no permite avisos. Abre la app desde el ícono de la pantalla de inicio del iPhone.</p>}
      {estado === "inactivo" && (
        <button type="button" onClick={activar} disabled={ocupado} className="mb-1 rounded-xl bg-marca py-3.5 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-60">
          {ocupado ? "ACTIVANDO…" : "ACTIVAR AVISOS EN ESTE IPHONE"}
        </button>
      )}
      {estado === "activo" && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-bien">Activos en este iPhone</span>
          <span className="flex gap-3 text-sm">
            <button type="button" onClick={probar} disabled={ocupado} className="font-bold text-marca">Enviar prueba</button>
            <button type="button" onClick={desactivar} disabled={ocupado} className="text-tenue underline">Desactivar</button>
          </span>
        </div>
      )}
      {mensaje && <p className="text-sm text-suave">{mensaje}</p>}

      {AVISOS.map((a) => {
        const on = prefs[a.clave] !== false;
        return (
          <div key={a.clave} className="flex items-center gap-3 border-b border-linea py-2.5 last:border-0">
            <span className="flex flex-1 flex-col">
              <span>{a.nombre}</span>
              <span className="text-xs text-tenue">{a.cuando}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={a.nombre}
              onClick={() => cambiar(a.clave)}
              className={`relative h-7 w-12 flex-none rounded-full ${on ? "bg-marca" : "bg-borde"}`}
            >
              <span className={`absolute top-[3px] h-[22px] w-[22px] rounded-full ${on ? "right-[3px] bg-fondo" : "left-[3px] bg-tenue"}`} />
            </button>
          </div>
        );
      })}
    </section>
  );
}
