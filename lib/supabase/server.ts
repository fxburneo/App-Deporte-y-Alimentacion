// Cliente de Supabase para usar en el servidor (Server Components,
// Server Actions, y las paginas que verifican si hay sesion antes de
// mostrar contenido protegido). Lee/escribe las cookies de sesion que
// maneja Next.js en el servidor.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll puede fallar si se llama desde un Server Component
            // (no puede escribir cookies). No pasa nada: el middleware
            // (middleware.ts) se encarga de refrescar la sesion en esos casos.
          }
        },
      },
    }
  );
}
