let restaurants,
  neighborhoods,
  cuisines
var mapUrl;
// var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines(); 
  mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=512x200&scale=2&zoom=11&center=40.722216,-73.987501&key=AIzaSyCZbDc-qSx_lvq7HvGB82_TKsKJmcIjlWw&maptype=roadmap&format=jpg&visual_refresh=true&markers=size:mid%7Ccolor:red`

  updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
// window.initMap = () => {
  // let loc = {
  //   lat: 40.722216,
  //   lng: -73.987501
  // };
  // self.map = new google.maps.Map(document.getElementById('map'), {
  //   zoom: 12,
  //   center: loc,
  //   scrollwheel: false
  // });
// }

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.log(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  // self.markers.forEach(m => m.setMap(null));
  // self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  lazyLoad();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  // Lazy loading images as per David Walsh method:
  // https://davidwalsh.name/lazyload-image-fade
  const imgUrl = DBHelper.imageUrlForRestaurant(restaurant, 300);
  const li = document.createElement('li');
  const noscriptImage = document.createElement('noscript');
  noscriptImage.setAttribute('data-src', imgUrl);
  noscriptImage.setAttribute('class', 'lazy-image');
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = imgUrl;
  image.setAttribute('data-src', '');
  image.alt = `${restaurant.name} restaurant`
  noscriptImage.append(image);
  li.append(noscriptImage);

  const isFavorite = (restaurant.is_favorite === 'true');

  const name = document.createElement('h2');
  // name.tabIndex = 5;
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  // neighborhood.tabIndex = 5;
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  // address.tabIndex = 5;
  address.innerHTML = restaurant.address;
  li.append(address);

  const operationsContainer = document.createElement('p');
  operationsContainer.setAttribute('class', 'operations-container');

  const more = document.createElement('a');
  // more.tabIndex = 5;
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  operationsContainer.append(more);

  const favouriteLink = document.createElement('a');
  favouriteLink.setAttribute('class', 'fav-link');
  favouriteLink.setAttribute('id', `fav-link-${restaurant.id}`);
  favouriteLink.href = "javascript:void(0);";
  favouriteLink.innerHTML = (isFavorite ? '♥' : '♡');
  favouriteLink.addEventListener('click', () => {
    DBHelper.toggleFavourite(restaurant.id);
  });


  operationsContainer.append(favouriteLink);
  li.append(operationsContainer);

  return li;
}

/**
 * Lazy loading images as per David Walsh method:
 * https://davidwalsh.name/lazyload-image-fade
 * With a bit of help from Yehuda's comment here:
 * https://davidwalsh.name/lazyload-image-fade#comment-508330
 */
lazyLoad = () => {
  [].forEach.call(document.querySelectorAll('noscript.lazy-image'), function(noscript) {
    var img = new Image();
    img.setAttribute('data-src', '');
    // Setting some attributes using the original ones 
    // from the actual img tag
    img.className = noscript.firstElementChild.className;
    img.alt = noscript.firstElementChild.alt;
    noscript.parentNode.insertBefore(img, noscript);
    img.onload = function() {
      img.removeAttribute('data-src');
    };
    img.src = noscript.getAttribute('data-src');
  });
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    // const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    // google.maps.event.addListener(marker, 'click', () => {
    //   window.location.href = marker.url
    // });
    // self.markers.push(marker);
    /*
     * STATIC MAP MANAGEMENT
    */
    mapUrl += `%7C${restaurant.latlng.lat},${restaurant.latlng.lng}`;
  });
  const mapImg = document.getElementById('map');
  mapImg.alt = 'Map containing all restaurants locations';
  mapImg.src = mapUrl;
}

AppHelper.registerServiceWorker();
