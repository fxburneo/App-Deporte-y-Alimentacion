// Editar un registro de comida ya guardado: cambiar gramos o quitar alimentos.
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ComidaFila } from "@/lib/datos/tipos";
import EditarRegistro from "./EditarRegistro";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("comidas").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const fila = data as ComidaFila;
  return <EditarRegistro id={fila.id} comida={fila.comida} alimentosIniciales={fila.alimentos} />;
}
