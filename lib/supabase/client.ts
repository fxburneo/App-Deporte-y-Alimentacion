// Cliente de Supabase para usar en el navegador (Client Components).
// Se usa dentro de componentes marcados con "use client" - por ejemplo,
// el formulario de login o el formulario para registrar un gasto nuevo.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
