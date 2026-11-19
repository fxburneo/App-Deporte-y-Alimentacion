// Barra inferior fija (rediseño R1-R7): Hoy, Plan, + (registrar), Entreno y
// Yo. El naranja marca la sección activa.
import Link from "next/link";
import BotonMas from "./BotonMas";

type Seccion = "hoy" | "plan" | "entreno" | "yo";

const icono = {
  hoy: (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  plan: (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  ),
  entreno: (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  ),
  yo: (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
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
        <Item href="/menu" nombre="Plan" activo={activa === "plan"}>{icono.plan}</Item>
        <BotonMas />
        <Item href="/entreno" nombre="Entreno" activo={activa === "entreno"}>{icono.entreno}</Item>
        <Item href="/yo" nombre="Yo" activo={activa === "yo"}>{icono.yo}</Item>
      </div>
    </nav>
  );
}
