import Link from "next/link";
import EnConstruccion from "@/components/EnConstruccion";

export default function Page() {
  return (
    <EnConstruccion
      titulo="Cómo vas"
      etapa={6}
      seccion="entreno"
      descripcion="Tu base física, cansancio y frescura en lenguaje simple. Necesita los datos de Garmin (etapa 2)."
    >
      <Link href="/entreno/nuevo" className="block rounded-xl border border-borde py-3.5 text-center font-bold">
        Cargar un entreno a mano
      </Link>
    </EnConstruccion>
  );
}
