// Inicio provisional de la etapa 0: confirma que la app está publicada,
// que el login funciona y que hay conexión con Supabase. La pantalla
// "Hoy" de las maquetas reemplaza a esta en la etapa 1.
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pt-[max(20px,env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between">
        <span className="font-display text-[17px] font-extrabold tracking-[0.12em] text-marca">
          FXB PERFORMANCE
        </span>
        <form action={signOut}>
          <button type="submit" className="py-2 text-sm text-tenue">Salir</button>
        </form>
      </header>

      <section className="flex flex-col gap-2">
        <span className="etiqueta">Etapa 0 · base lista</span>
        <h1 className="font-display text-5xl font-bold leading-none">Hola, Francisco</h1>
        <p className="text-suave">
          La app está publicada y conectada. Desde aquí se construye todo lo demás.
        </p>
      </section>

      <section className="flex flex-col">
        <span className="etiqueta pb-1">Revisión</span>
        <Fila texto="App publicada en Vercel" ok />
        <Fila texto={`Sesión iniciada como ${user?.email ?? "?"}`} ok={Boolean(user)} />
        <Fila texto="Base de datos Supabase conectada" ok={Boolean(user)} />
      </section>

      <section className="border-l-[3px] border-marca py-0.5 pl-3">
        <span className="etiqueta text-marca!">Siguiente</span>
        <p className="text-suave">Etapa 1: tu perfil y el cálculo de calorías y macros del día.</p>
      </section>
    </main>
  );
}

function Fila({ texto, ok }: { texto: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-linea py-3">
      <span>{texto}</span>
      <span className={`text-xs font-bold ${ok ? "text-bien" : "text-mal"}`}>{ok ? "OK" : "FALLA"}</span>
    </div>
  );
}
