let restaurant;
// var map;
var mapUrl;

/**
 * Initialize Google map, called from HTML.
 */
// window.initMap = () => {
document.body.onload = (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      // self.map = new google.maps.Map(document.getElementById('map'), {
      //   zoom: 16,
      //   center: restaurant.latlng,
      //   scrollwheel: false
      // });
      fillBreadcrumb();
      mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=512x200&scale=2&zoom=11&center=${restaurant.latlng.lat},${restaurant.latlng.lng}&key=AIzaSyCZbDc-qSx_lvq7HvGB82_TKsKJmcIjlWw&maptype=roadmap&format=jpg&visual_refresh=true&markers=size:mid%7Ccolor:red%7C${restaurant.latlng.lat},${restaurant.latlng.lng}`
      const mapImg = document.getElementById('map');
      mapImg.alt = 'Map containing current restaurant location';
      mapImg.src = mapUrl;
      // DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const isFavorite = (restaurant.is_favorite === 'true');

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favouriteLink = document.createElement('a');
  favouriteLink.setAttribute('class', 'fav-link');
  favouriteLink.setAttribute('id', `fav-link-${restaurant.id}`);
  favouriteLink.href = "javascript:void(0);";
  favouriteLink.innerHTML = (isFavorite ? '♥' : '♡');
  favouriteLink.addEventListener('click', () => {
    DBHelper.toggleFavourite(restaurant.id);
  });

  name.append(favouriteLink);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant, 600);
  image.alt = `${restaurant.name} restaurant`

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  let i = 51;
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    // day.tabIndex = 8;
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    // time.tabIndex = 8;
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  // title.tabIndex = 15;
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const name = document.createElement('p');
  // name.tabIndex = 19;
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  // date.tabIndex = 19;
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  // rating.tabIndex = 19;
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  // comments.tabIndex = 19;
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

AppHelper.registerServiceWorker();