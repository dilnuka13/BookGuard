/**
 * BookGuard Service Worker — Production PWA
 * Lightweight, privacy-safe caching strategy for Next.js 15 App Router.
 */

const CACHE_NAME = "bookguard-cache-v1";

const PRECACHE_ASSETS = [
  "/offline",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/logos/bookguard-app-icon.png",
  "/logos/bookguard-logo-horizontal.png",
  "/logos/bookguard-logo-mark.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

// 1. Install event: Precache static shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up stale caches from previous versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch event: Strategic routing
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only intercept GET requests
  if (request.method !== "GET") {
    return;
  }

  // SECURITY RULE: Never intercept or cache Supabase auth/database endpoints or local /api/ routes
  if (
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/")
  ) {
    return; // Pass through directly to network
  }

  // A. Navigation requests (HTML pages): Network-first with /offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If server returns a valid response, return it
          return response;
        })
        .catch(async () => {
          // If network is unreachable (offline), serve the cached offline shell
          const cache = await caches.open(CACHE_NAME);
          const offlinePage = await cache.match("/offline");
          if (offlinePage) {
            return offlinePage;
          }
          return new Response(
            "<!DOCTYPE html><html><body><h1>Offline</h1><p>You are currently offline. Please reconnect to use BookGuard.</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // B. Static asset requests (_next/static, icons, logos, fonts): Cache-first / Stale-While-Revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/logos/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Stale-while-revalidate: return cached response immediately, update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Not cached yet: fetch from network and cache
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default: Network fetch
  event.respondWith(fetch(request));
});
