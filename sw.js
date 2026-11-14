/**
 * Service Worker: cache-first untuk aset inti, offline penuh.
 * Versi naik lewat CACHE_NAME untuk membatalkan cache lama.
 */
const CACHE_NAME = 'bpjs-card-gen-v1';
const ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/img/bpjs-mark.svg',
  './assets/img/bpjs-icon-180.png',
  './assets/img/bpjs-icon-512.png'
];
// Daftar modul JS ditempel otomatis dari index.html tidak praktis di SW;
// cukup cache runtime: simpan apa pun yang berhasil diminta pertama kali.

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

// Cache-first dengan fallback jaringan; simpan respons OK ke cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request).then((res) => {
        if (res && res.ok && new URL(event.request.url).origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      });
    })
  );
});
