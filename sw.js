importScripts('/js/idb.js'); // Needed to deal with DB from the serviceworker
importScripts('/js/dbhelper.js'); // Needed to deal with DB from the serviceworker

var currentCacheName = 'restaurant-reviews-cache-v173';

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(currentCacheName).then(function (cache) {
      return cache.addAll([
        '/',
        '/css/',
        '/css/details.min.css',
        '/css/styles.min.css',
        '/sw.min.js',
        '/js/',
        '/js/apphelper.min.js',
        '/js/dbhelper.min.js',
        '/js/idb.min.js',
        '/js/main.min.js',
        '/js/restaurant_info.min.js'
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
  // I don't want to cache JSON data returned by the server, since I'd like to 
  // work just with indexedDB and the actual server responses
  const pathname = new URL(event.request.url).pathname;
  if (pathname.startsWith('/restaurants') || pathname.startsWith('/reviews')) return;

  // Resuming chosen caching pattern. Ref. https://jakearchibald.com/2014/offline-cookbook
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
    console.log('skip waiting');
  } 
});

// Whenever the system goes online, then try a sync
self.addEventListener('online', event => {
  event.waitUntil(favSync());
});

self.addEventListener('sync', function (event) {
  if (event.tag === 'favsync') {
    event.waitUntil(favSync());
  }

  if (event.tag == 'revsync') {
    event.waitUntil(revSync());
  }
});

// Sending new reviews to online endpoint.
// The reviews to send are the ones which don't have 
// an id (just local_id).
// Upon returninga successful REST call, 
// we must update the id from undefined to the value set by the 
// server endpoint
function revSync() {
  return new Promise(function (resolve, reject) {
    console.log('opening DB');
    idb.open('mws', 2).then((db) => {
      console.log('checking DB');
      if (!db) return;
      console.log('DB exists: Starting the update procedure')
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      const storeIndex = store.index('server_id');

      storeIndex.getAll("").then(function (reviews) {
        reviews.forEach(function (review) {
          // Trying to update the remote endpoint
          const url = DBHelper.DATABASE_REVIEWS_URL;
          console.log(`Sending Review to remote: ${url}`);
          const localId = review.local_id;
          delete review.local_id;
          delete review.id; // Just to be sure server will auto increment and generate the id
          fetch(url, {
            method: "POST",
            body: JSON.stringify(review)
          }).then(function (response) {
            console.log("Watching the response:");
            console.log(response);
            return response.json();
          }).then(function (returnedReview) {
            // surprisingly it cannot see the store already instantiated
            const tx = db.transaction('reviews', 'readwrite');
            const store = tx.objectStore('reviews');
            console.log(returnedReview);
            console.log("Setting changed to false and saving it in order to avoid other syncs of the same data");
            // Assigning the local id so that idb will 
            // update and not create a new review
            returnedReview.local_id = localId;
            store.put(returnedReview);
            resolve('synced');
          }).catch(function (error) {
            reject(error);
          });
        });
      });
    });
  });
}

// Sending favourite value to online endpoint only if the record is marked as changed
function favSync() {
  return new Promise(function (resolve, reject) {
    console.log('opening DB');
    idb.open('mws', 2).then((db) => {
      console.log('checking DB');
      if (!db) return;
      console.log('DB exists: Starting the update procedure')
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      const storeIndex = store.index('changed');

      storeIndex.getAll('true').then(function (restaurants) {
        restaurants.forEach(function (restaurant) {
          // Trying to update the remote endpoint
          const url = `${DBHelper.DATABASE_RESTAURANTS_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`;
          console.log(`Sending fav to remote: ${url}`);
          fetch(url, {
            method: "PUT"
          }).then(function (response) {
            console.log("Watching the response:");
            console.log(response);
            return response.json();
          }).then(function (returnedRestaurant) {
            // surprisingly it cannot see the store already instantiated
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            console.log(returnedRestaurant);
            console.log("Setting changed to false and saving it in order to avoid other syncs of the same data");
            returnedRestaurant.changed = 'false';
            store.put(returnedRestaurant);
            resolve('synced');
          }).catch(function (error) {
            reject(error);
          });
        });
      });
    });
  });
}