// Service worker de l'app enseignant (scope /teacher).
//
// Portée volontairement limitée pour cette première passe :
// - cache-first pour les assets statiques (_next/static, icônes, manifest) ;
// - network-first avec repli sur le cache pour les navigations et les
//   requêtes de données internes à l'app (payload RSC de Next.js), pour
//   qu'une page déjà visitée en ligne reste consultable hors-ligne.
//
// La file d'action réelle (présence, encaissement, mémorisation, messages)
// est gérée séparément dans src/lib/offline/ (IndexedDB), pas ici : ce
// service worker ne fait que du cache de lecture, jamais d'écriture.

const CACHE_NAME = "scolaris-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.json" ||
    url.pathname.startsWith("/icon")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/teacher") && !isStaticAsset(url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Pages /teacher/* et leurs payloads RSC : network-first, repli cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || Response.error())),
  );
});
