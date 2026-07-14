// Minimalny service worker (SPEC §7): tylko po to, by aplikację dało się zainstalować.
// Zero offline-first — gra i tak wymaga sieci, więc requesty przepuszczamy jak zwykle.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  /* przepuszczamy do sieci bez cache */
});
