"use client";

// Pantalla de ingreso. Es un Client Component porque muestra el error
// sin recargar la página (useActionState solo corre en el navegador).
import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, { error: null });

  return (
    <main className="flex flex-1 items-center justify-center px-5">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="font-display text-lg font-extrabold tracking-[0.12em] text-marca">
            FXB PERFORMANCE
          </span>
          <h1 className="font-display text-4xl font-bold leading-none">Entrar</h1>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="etiqueta">Correo</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-[10px] border border-borde bg-superficie px-3 py-3 text-texto focus:border-marca focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="etiqueta">Clave</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-[10px] border border-borde bg-superficie px-3 py-3 text-texto focus:border-marca focus:outline-none"
            />
          </div>

          {state.error && <p className="text-sm text-mal">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-marca py-4 font-extrabold tracking-[0.04em] text-fondo disabled:opacity-60"
          >
            {pending ? "ENTRANDO..." : "ENTRAR"}
          </button>
        </form>
      </div>
    </main>
  );
}
