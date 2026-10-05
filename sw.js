const CACHE = "mood-mask-v3-paper-center";
const APP_SHELL = [
  "./",
  "./index.html",
  "./src/style.css",
  "./src/main.js",
  "./src/lib/expressions.js",
  "./src/lib/draw.js",
  "./src/lib/geometry.js",
  "./src/lib/tracking.js",
  "./src/lib/exporter.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.url.startsWith("blob:")) return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, { cache: "no-cache" });
      if (response && response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone()).catch(() => undefined);
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        return (await caches.match("./index.html")) || Response.error();
      }
      throw error;
    }
  })());
});
