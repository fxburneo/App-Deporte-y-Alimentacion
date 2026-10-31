// Pantalla Mi despensa (maqueta 2b.1): alimentos con marca, genéricos y platos
// habituales; desde aquí se asigna el menú tipo de cada comida.
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerDespensa } from "@/lib/datos/despensa";
import ListaDespensa from "./ListaDespensa";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { alimentos, platos } = await leerDespensa();
  const tab = (await searchParams).tab === "platos" ? "platos" : "alimentos";
  return (
    <>
      <Pantalla>
        <ListaDespensa alimentos={alimentos} platos={platos} tabInicial={tab} />
      </Pantalla>
      <NavBar activa="comidas" />
    </>
  );
}
