/* Учёт рейсов: работа без интернета.
   Сначала пробуем сеть (обновления приходят сразу), без сети отдаём сохранённую копию.
   Трогает только свой кэш "rl-". */
const CACHE = "rl-v1";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-180.png"]).catch(() => {})));
});
self.addEventListener("activate", e => e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(k => Promise.all(k.filter(x => x.startsWith("rl-") && x !== CACHE).map(x => caches.delete(x))))
])));
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !font) return;
  if (font) {
    e.respondWith(caches.match(r, { cacheName: CACHE }).then(hit => hit || fetch(r).then(res => {
      const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res;
    })));
    return;
  }
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true, cacheName: CACHE }).then(hit => hit || caches.match("./", { cacheName: CACHE }))));
});
