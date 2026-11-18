const V = "asistan-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Kişisel veriler ve API çağrıları önbelleğe alınmaz.
  if (url.hostname === "api.github.com" || url.hostname === "api.anthropic.com") return;
  if (url.origin === location.origin) {
    // Önce ağ, olmazsa önbellek: yeni sürüm gelince hemen görünür, çevrimdışıyken eski sürüm açılır.
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(m => m || caches.match("./index.html"))));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(V).then(c => c.match(req).then(m => {
      const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => m);
      return m || net;
    })));
  }
});
