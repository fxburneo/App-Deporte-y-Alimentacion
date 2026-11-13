// Service worker de FXB Performance: recibe los avisos (Web Push) y abre la
// pantalla que corresponde al tocarlos. No guarda nada en caché.
self.addEventListener("push", (event) => {
  let d = { titulo: "FXB Performance", cuerpo: "", url: "/" };
  try {
    if (event.data) d = { ...d, ...event.data.json() };
  } catch {
    if (event.data) d.cuerpo = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(d.titulo, {
      body: d.cuerpo,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: d.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ("focus" in v) {
          v.navigate(url);
          return v.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
