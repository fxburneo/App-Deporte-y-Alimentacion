// Pantallas que todavía no se construyen: dicen en qué etapa llegan.
import NavBar from "./NavBar";
import Pantalla from "./Pantalla";

export default function EnConstruccion({
  titulo,
  etapa,
  descripcion,
  seccion,
  children,
}: {
  titulo: string;
  etapa: number;
  descripcion: string;
  seccion: "hoy" | "comidas" | "entreno" | "mas";
  children?: React.ReactNode;
}) {
  return (
    <>
      <Pantalla>
        <header className="flex flex-col gap-1">
          <span className="etiqueta">Llega en la etapa {etapa}</span>
          <h1 className="font-display text-[34px] font-bold uppercase leading-none tracking-[0.02em]">{titulo}</h1>
        </header>
        <p className="text-suave">{descripcion}</p>
        {children}
      </Pantalla>
      <NavBar activa={seccion} />
    </>
  );
}
