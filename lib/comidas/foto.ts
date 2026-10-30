// Achica la foto del celular antes de enviarla: lado mayor de 1280 px en
// JPEG. Una foto de 4 MB queda en ~250 KB, entra en el límite de 1 MB de las
// acciones del servidor y la IA la lee igual de bien (y cuesta menos).
export async function reducirFoto(archivo: File, ladoMax = 1280, calidad = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("sin lienzo");
  ctx.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();
  return lienzo.toDataURL("image/jpeg", calidad);
}
