// Primer uso (maquetas 1.1 y 1.2). También sirve para editar el perfil.
import { leerDatosDia } from "@/lib/datos/dia";
import FormPerfil from "./FormPerfil";

export default async function Page() {
  const { perfil, pesos } = await leerDatosDia();
  return <FormPerfil inicial={perfil} pesoActual={pesos[0]?.kg ?? null} />;
}
