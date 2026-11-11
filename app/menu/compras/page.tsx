// Lista de compras (maqueta 2d.3): lo que pide el menú de 7 o 14 días, en
// cantidades de compra.
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import Pantalla from "@/components/Pantalla";
import { leerMenuSemana } from "@/lib/datos/menu";
import { fechaCorta, hoyEcuador, sumarDias } from "@/lib/fecha";
import { listaCompras } from "@/lib/menu/compras";
import { TIPO_MENU } from "../estilo";
import ListaCompras from "./ListaCompras";

export default async function Page({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const dias = (await searchParams).dias === "14" ? 14 : 7;
  const hoy = hoyEcuador();
  const datos = await leerMenuSemana(dias, hoy);
  if (!datos) redirect("/");
  const items = datos.dias.flatMap((x) => x.menu.comidas.flatMap((c) => c.items));
  const lista = listaCompras(items, datos.despensa);
  const conteo = new Map<string, number>();
  for (const x of datos.dias) {
    const n = TIPO_MENU[x.plan.objetivo.tipo].nombre;
    conteo.set(n, (conteo.get(n) ?? 0) + 1);
  }
  const resumen = [...conteo].map(([n, c]) => `${c} ${n.toLowerCase()}`).join(", ");

  return (
    <>
      <Pantalla>
        <header className="flex items-center justify-between">
          <Link href={dias === 14 ? "/menu?dias=14" : "/menu"} className="min-w-[70px] py-2.5 font-semibold text-tenue">‹ Semana</Link>
          <h1 className="font-display text-2xl font-bold tracking-[0.04em]">COMPRAS</h1>
          <span className="min-w-[70px]" />
        </header>
        <div role="tablist" className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-borde">
          {[7, 14].map((n) => (
            <Link key={n} href={n === 7 ? "/menu/compras" : "/menu/compras?dias=14"} role="tab" aria-selected={dias === n} className={`py-2.5 text-center no-underline ${dias === n ? "bg-texto font-bold text-fondo" : "bg-superficie font-semibold text-suave"}`}>
              {n} días
            </Link>
          ))}
        </div>
        <p className="-mt-2 text-xs text-tenue">
          Del {fechaCorta(hoy)} al {fechaCorta(sumarDias(hoy, dias - 1))} · {resumen}. Carnes y arroz en crudo, como los compras.
        </p>
        <ListaCompras items={lista} clave={`compras-${hoy}-${dias}`} />
        <span className="text-xs text-tenue">Marca lo que ya tienes en casa (se recuerda en este celular). La lista sale de tu menú tipo y del plan del coach.</span>
      </Pantalla>
      <NavBar activa="comidas" />
    </>
  );
}
