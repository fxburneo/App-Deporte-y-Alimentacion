// Cargar entreno a mano (maqueta 2.2). El servidor entrega el perfil, el
// peso y los entrenos ya cargados para que el formulario muestre en vivo
// cómo queda el día.
import { redirect } from "next/navigation";
import { leerDatosDia } from "@/lib/datos/dia";
import { aEntreno, aPerfilMotor } from "@/lib/datos/tipos";
import { diaSemana } from "@/lib/fecha";
import { pesoReferencia } from "@/lib/nutricion/motor";
import FormEntreno from "./FormEntreno";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const d = await leerDatosDia();
  if (!d.perfil) redirect("/bienvenida");
  const pesoKg = pesoReferencia(d.pesos, d.fecha) ?? 75;
  const finde = (f: string) => [0, 6].includes(diaSemana(f));
  return (
    <FormEntreno
      perfil={aPerfilMotor(d.perfil)}
      pesoKg={pesoKg}
      existentes={{ hoy: d.entrenosHoy.map(aEntreno), manana: d.entrenosManana.map(aEntreno) }}
      siguientes={{ hoy: d.entrenosManana.map(aEntreno), manana: [] }}
      horaHabitual={{
        hoy: (finde(d.fecha) ? d.perfil.entreno_finde : d.perfil.entreno_semana).slice(0, 5),
        manana: (finde(d.manana) ? d.perfil.entreno_finde : d.perfil.entreno_semana).slice(0, 5),
      }}
      diaInicial={q.dia === "hoy" ? "hoy" : "manana"}
      estadoInicial={q.estado === "hecho" ? "hecho" : "planificado"}
    />
  );
}
