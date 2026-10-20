// Manifiesto de la app instalable: nombre, ícono y pantalla completa
// cuando se agrega a la pantalla de inicio del iPhone.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FXB Performance",
    short_name: "FXB",
    description: "Nutrición y entrenamiento de Francisco",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1113",
    theme_color: "#0e1113",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
