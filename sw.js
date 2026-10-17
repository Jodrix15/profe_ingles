// Guarda las fichas para usarlas sin conexión y las actualiza en segundo plano cuando hay internet.
const CACHE = "fichas-v5";
const FILES = ["./", "index.html", "ficha-ingles.html", "examen-nivel.html", "teoria-1.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Páginas: primero internet (para ver siempre lo último) y, si no hay conexión, la copia guardada.
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(caches.open(CACHE).then(cache =>
      fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cache.match(req, { ignoreSearch: true }).then(r => r || cache.match("index.html")))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
