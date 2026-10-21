// Barra inferior fija, como en las maquetas: Hoy, Comidas, + (registrar),
// Entreno y Más. El naranja marca la sección activa.
import Link from "next/link";

type Seccion = "hoy" | "comidas" | "entreno" | "mas";

const icono = {
  hoy: (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  comidas: (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  ),
  entreno: (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  ),
  mas: (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  ),
};

function Item({ href, nombre, activo, children }: { href: string; nombre: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`flex min-w-14 flex-col items-center gap-0.5 text-[11px] ${activo ? "font-bold text-marca" : "font-medium text-[#8c969f]"}`}
    >
      {children}
      {nombre}
    </Link>
  );
}

export default function NavBar({ activa }: { activa: Seccion }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-linea bg-[#121518] pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-md items-start justify-around px-2">
        <Item href="/" nombre="Hoy" activo={activa === "hoy"}>{icono.hoy}</Item>
        <Item href="/comidas" nombre="Comidas" activo={activa === "comidas"}>{icono.comidas}</Item>
        <Link
          href="/registrar"
          aria-label="Registrar comida"
          className="-mt-2 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-marca text-fondo"
        >
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        <Item href="/entreno" nombre="Entreno" activo={activa === "entreno"}>{icono.entreno}</Item>
        <Item href="/mas" nombre="Más" activo={activa === "mas"}>{icono.mas}</Item>
      </div>
    </nav>
  );
}
