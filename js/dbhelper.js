/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/`;
  }

  static get DATABASE_RESTAURANTS_URL(){
    return `${this.DATABASE_URL}restaurants`;
  }

  static get DATABASE_REVIEWS_URL(){
    return `${this.DATABASE_URL}reviews`;
  }
  /**
   * INIT DB
   */

  static initDB() {
    if (!navigator.serviceWorker) {
      console.log("Browser can't support serviceworkers")
      return Promise.resolve();
    }

    return idb.open('mws', 1, upgradeDb => {
      const tableRestaurant = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      tableRestaurant.createIndex('changed', 'changed', {unique: false});
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_RESTAURANTS_URL).then((response) => {
      return response.json();
    }).then((restaurants) => {
      this.initDB().then((db) => {
        if (!db) return;

        let tx = db.transaction('restaurants', 'readwrite');
        let store = tx.objectStore('restaurants');

        //filling the DB with response from JSON service
        restaurants.forEach(function (restaurant) {
          store.get(parseInt(restaurant.id)).then((local_restaurant) => {
            // if (restaurant.updatedAt > local_restaurant.updatedAt) {
            if (local_restaurant.changed === 'false') {
              // If local copy is not changed, then overwrite with data from REST
              // If changed, I won't do anything since I'd like to have it synced 
              // with server before.
              store.put(restaurant);
            }
          }).catch((error) => {
            store.put(restaurant);
          });
        });

        callback(null, restaurants);
      });
    }).catch((error) => {
      console.log(error);
      // Fallback to local data if online fails
      this.initDB().then((db) => {
          if (!db) return;

          var tx = db.transaction('restaurants')
          var store = tx.objectStore('restaurants');

          store.getAll().then(restaurants => {
              callback(null, restaurants)
            })
            .catch(error => callback(error, null));
        })
        .catch(error => callback(error, null));
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  // Trying a RESTful approach
  // static urlForToggleFav(restaurant) {
  //   return (`./?toggleFav="true"&&restaurantId=${restaurant.id}`);
  // }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, size) {
    // return (`/img/${size}-${restaurant.photograph}`);
    return (`/img/${size}-${restaurant.photograph || restaurant.id}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  /**
   * 
   * @param {Restaurant Identifier} id 
   * 
   * 
   */
  static toggleFavourite(id) {
    console.log(`Change favorite value for ${id}`)
    DBHelper.initDB().then((db) => {
      if (!db) return;

      let tx = db.transaction('restaurants', 'readwrite');
      let store = tx.objectStore('restaurants');

      store.get(parseInt(id)).then((restaurant) => {

        const isFavorite = (restaurant.is_favorite === 'true');
        // Record new values to the DB
        // updatedAt is needed for a way 
        // to sync back the remote endpoint
        restaurant.is_favorite = (!isFavorite).toString();
        restaurant.updatedAt = Date.now();
        // I cannot find a way to query by comparing dates
        // thus I switch to a status management (booleanish)
        restaurant.changed = 'true';
        store.put(restaurant);

        // Updating UI
        const favouriteLink = document.getElementById(`fav-link-${restaurant.id}`);
        favouriteLink.innerHTML = (!isFavorite ? '♥' : '♡');

        // Make the serviceworker transparently
        // deal with the sync to remote endpoint
        // if (navigator.onLine) {
          navigator.serviceWorker.controller.postMessage('favsync');
          // navigator.serviceWorker.ready.then(function (reg) {
          //   reg.favsync.then(() => {
          //     console.log('Start syncing Favorites');
          //   });
          // });
        // }
      });
    });
  }
}