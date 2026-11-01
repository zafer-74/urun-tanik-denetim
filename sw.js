const CACHE = "utd-v1.11.0";
const ASSETS = ["./", "index.html", "style.css", "app.js", "f62app.js", "data.js", "f62.js", "vendor/jszip.min.js", "report/F701-062_sablon.docx", "vendor/xlsx.full.min.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.cache === "no-store" || new URL(e.request.url).searchParams.has("t")) { e.respondWith(fetch(e.request)); return; }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return res;
  }).catch(() => caches.match("index.html"))));
});
