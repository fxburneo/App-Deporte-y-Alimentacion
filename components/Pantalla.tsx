// Contenedor común: ancho de celular, márgenes seguros del iPhone y espacio
// abajo para la barra de navegación.
export default function Pantalla({ children, conNav = true }: { children: React.ReactNode; conNav?: boolean }) {
  return (
    <main
      className={`mx-auto flex w-full max-w-md flex-1 flex-col gap-[22px] px-[18px] pt-[max(20px,env(safe-area-inset-top))] ${conNav ? "pb-32" : "pb-10"}`}
    >
      {children}
    </main>
  );
}
