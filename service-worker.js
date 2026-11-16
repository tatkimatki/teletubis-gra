'use strict';

const CACHE_NAME = 'brawl-teletubisie-shell-v1';
const APP_URL = new URL('./', self.registration.scope).href;

async function fetchFresh(url, headers) {
  const freshUrl = new URL(url);
  freshUrl.searchParams.set('_brawl_refresh', String(Date.now()));
  return fetch(freshUrl.href, {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: headers || {}
  });
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetchFresh(APP_URL);
    if (!response.ok) throw new Error('Nie udało się pobrać gry');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(APP_URL, response.clone());
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('brawl-teletubisie-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== 'GET' || request.mode !== 'navigate' || requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetchFresh(request.url, request.headers);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(APP_URL, response.clone());
      }
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(APP_URL) || Response.error();
    }
  })());
});