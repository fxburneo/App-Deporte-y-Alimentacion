import type { Metadata, Viewport } from "next";
import { Archivo, Saira_Condensed } from "next/font/google";
import "./globals.css";

// Fuentes aprobadas en las maquetas: Saira Condensed para números y
// títulos (estilo reloj deportivo), Archivo para el texto.
const display = Saira_Condensed({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-saira" });
const body = Archivo({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: "FXB Performance",
  description: "Nutrición y entrenamiento de Francisco",
  applicationName: "FXB Performance",
  // En iPhone, "Agregar a pantalla de inicio" abre la app a pantalla completa.
  appleWebApp: {
    capable: true,
    title: "FXB",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1113",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Sin altura fija en html (h-full): en el iPhone, con la app instalada en la
    // pantalla de inicio, eso a veces dejaba Hoy sin poder desplazarse (19-nov).
    <html lang="es" className={`antialiased ${display.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">{children}</body>
    </html>
  );
}
