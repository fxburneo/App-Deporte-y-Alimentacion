// Editar una carrera (misma pantalla que 4b.2), con opción de borrarla.
import { notFound } from "next/navigation";
import Pantalla from "@/components/Pantalla";
import { createClient } from "@/lib/supabase/server";
import type { CarreraFila } from "@/lib/datos/tipos";
import FormCarrera from "../../FormCarrera";
import { borrarCarrera } from "../../actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("carreras").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const c = data as CarreraFila;
  return (
    <Pantalla conNav={false}>
      <FormCarrera
        inicial={{
          id: c.id,
          nombre: c.nombre,
          fecha: c.fecha,
          deporte: c.deporte,
          distancia_km: c.distancia_km == null ? null : Number(c.distancia_km),
          desnivel_m: c.desnivel_m,
          horas_min: Number(c.horas_min),
          horas_max: Number(c.horas_max),
          prioridad: c.prioridad,
        }}
      />
      <form action={borrarCarrera}>
        <input type="hidden" name="id" value={c.id} />
        <button type="submit" className="w-full py-2 text-sm text-tenue underline">Borrar carrera</button>
      </form>
    </Pantalla>
  );
}
