var currentCacheName = 'restaurant-reviews-cache-v39';

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(currentCacheName).then(function (cache) {
      return cache.addAll([
        '/',
        '/sw.js',
        '/index.html',
        '/restaurant.html',
        '/css/breakpoints_details.css',
        '/css/breakpoints.css',
        '/css/details.css',
        '/css/styles.css',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/js/dbhelper.js',
        '/js/apphelper.js',
        '/img/',
        '/data/'
      ]);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('restaurant-reviews-') &&
            cacheName != currentCacheName;
        }).map(function (cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

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
    console.log('skip waiting')
  }
});