// Avisos que se pueden activar o desactivar en Más (maqueta 4.1).
export const AVISOS = [
  { clave: "resumen", nombre: "Resumen de la mañana", cuando: "06:40" },
  { clave: "peso", nombre: "Peso (L · M · V)", cuando: "05:00" },
  { clave: "plan_cambia", nombre: "Plan ajustado si cambia", cuando: "al momento" },
  { clave: "registrar", nombre: "Si no registraste comidas", cuando: "15:00" },
  { clave: "manana", nombre: "Comidas de mañana", cuando: "19:30" },
  { clave: "dormir", nombre: "Hora de dormir", cuando: "21:00" },
  { clave: "fatiga", nombre: "Alertas de fatiga", cuando: "al momento" },
] as const;
export const CLAVES_AVISO = AVISOS.map((a) => a.clave) as string[];

// La clave pública VAPID viene en base64url; el navegador la pide en bytes.
export function claveABytes(base64url: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64url.length % 4)) % 4);
  const b64 = (base64url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
