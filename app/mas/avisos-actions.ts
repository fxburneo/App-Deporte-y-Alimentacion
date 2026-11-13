"use server";

// Avisos en el iPhone: guardar o quitar la suscripción de este dispositivo,
// elegir qué avisos llegan y mandar un aviso de prueba.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CLAVES_AVISO } from "@/lib/avisos/claves";
import { createClient } from "@/lib/supabase/server";

const SuscripcionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});


export async function guardarSuscripcion(datos: unknown): Promise<{ ok: boolean; error?: string }> {
  const p = SuscripcionSchema.safeParse(datos);
  if (!p.success) return { ok: false, error: "La suscripción no es válida." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_suscripciones")
    .upsert({ endpoint: p.data.endpoint, p256dh: p.data.keys.p256dh, auth: p.data.keys.auth }, { onConflict: "endpoint" });
  if (error) return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  revalidatePath("/mas");
  return { ok: true };
}

export async function quitarSuscripcion(endpoint: string) {
  const supabase = await createClient();
  await supabase.from("push_suscripciones").delete().eq("endpoint", endpoint);
  revalidatePath("/mas");
}

export async function cambiarAviso(clave: string, activo: boolean) {
  if (!CLAVES_AVISO.includes(clave)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase.from("perfil").select("avisos").eq("user_id", user.id).single();
  const avisos = { ...((data?.avisos as Record<string, boolean>) ?? {}), [clave]: activo };
  await supabase.from("perfil").update({ avisos }).eq("user_id", user.id);
  revalidatePath("/mas");
}

export async function enviarPrueba(): Promise<{ ok: boolean; mensaje: string }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, mensaje: "La sesión expiró, vuelve a entrar." };
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/avisos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "prueba" }),
      cache: "no-store",
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) return { ok: false, mensaje: "No se pudo enviar el aviso de prueba." };
    return j.enviados > 0 ? { ok: true, mensaje: "Enviado: debería llegarte en unos segundos." } : { ok: false, mensaje: "No hay ningún iPhone activado todavía." };
  } catch {
    return { ok: false, mensaje: "No se pudo conectar. Intenta en unos minutos." };
  }
}
