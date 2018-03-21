const version = 1;
const currentCachePrefix = 'restaurant-reviews-';
const currentCacheName = `${currentCachePrefix}cache-v${version}`;

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith(currentCachePrefix) &&
            cacheName != currentCacheName;
        }).map(function (cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
/**
 * @description This caches everything (Just to be sure)
 */
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.open(currentCacheName).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function (response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );

});
self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
    console.log('SW skip waiting')
  }
});