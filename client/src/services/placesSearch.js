/* ─────────────────────────────────────────────────────────
   placesSearch — Google Places API helpers
   
   Searches for real eco-friendly activities near a city using
   the Google Maps Places service (loaded via googleMaps.js).
───────────────────────────────────────────────────────── */
import { loadGoogleMaps } from "./googleMaps";

/* Map our category slugs to Google Places types */
const CATEGORY_TYPES = {
  all:         ["tourist_attraction", "park"],
  nature:      ["park", "natural_feature", "campground"],
  culture:     ["museum", "art_gallery", "library"],
  sightseeing: ["tourist_attraction", "landmark", "church"],
  food:        ["restaurant", "cafe", "bakery"],
  adventure:   ["park", "campground", "gym"],
};

/* Eco-keyword boost per category */
const CATEGORY_KEYWORDS = {
  all:         "",
  nature:      "nature park trail eco",
  culture:     "museum gallery heritage",
  sightseeing: "landmark historic",
  food:        "vegan organic local sustainable",
  adventure:   "outdoor adventure eco",
};

/**
 * Geocode a city name, then do a nearby Places search.
 * Returns an array of activity objects ready for ActivitiesPage.
 */
export async function searchActivitiesNear(cityName, category = "all") {
  const google = await loadGoogleMaps();

  /* Step 1 — geocode the city */
  const location = await geocodeCity(google, cityName);

  /* Step 2 — nearby search */
  const types   = CATEGORY_TYPES[category]   ?? ["tourist_attraction"];
  const keyword = CATEGORY_KEYWORDS[category] ?? "";

  /* PlacesService needs a (hidden) map element */
  const mapDiv = document.createElement("div");
  const map    = new google.maps.Map(mapDiv, { center: location, zoom: 13 });
  const svc    = new google.maps.places.PlacesService(map);

  const results = await new Promise((resolve, reject) => {
    svc.nearbySearch(
      {
        location,
        radius:  8000,
        type:    types[0],
        keyword: keyword || undefined,
      },
      (res, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && res?.length) {
          resolve(res);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Places nearbySearch: ${status}`));
        }
      }
    );
  });

  /* Step 3 — map to our data shape, filter out irrelevant results */
  return results
    .filter((p) => p.business_status !== "CLOSED_PERMANENTLY")
    .slice(0, 9)
    .map((p) => formatPlace(p, category));
}

/* ── Helpers ── */

async function geocodeCity(google, cityName) {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: cityName }, (results, status) => {
      if (status === "OK" && results[0]) {
        resolve(results[0].geometry.location);
      } else {
        reject(new Error(`Geocode failed for "${cityName}": ${status}`));
      }
    });
  });
}

const ECO_TAGS_BY_TYPE = {
  park:              ["Outdoor", "Nature", "Eco-Certified"],
  natural_feature:   ["Wildlife", "Scenic", "Low Carbon"],
  museum:            ["Cultural", "Indoor", "Educational"],
  art_gallery:       ["Arts", "Cultural", "Local"],
  tourist_attraction:["Landmark", "Historic", "Popular"],
  restaurant:        ["Local Food", "Seasonal", "Authentic"],
  cafe:              ["Local", "Artisan", "Sustainable"],
  campground:        ["Eco-Camp", "Outdoor", "Nature"],
};

function inferCategory(types = []) {
  if (types.some((t) => ["park", "natural_feature", "campground"].includes(t))) return "nature";
  if (types.some((t) => ["museum", "art_gallery", "library"].includes(t)))      return "culture";
  if (types.some((t) => ["restaurant", "cafe", "food", "bakery"].includes(t)))  return "food";
  if (types.some((t) => ["gym", "stadium"].includes(t)))                        return "adventure";
  return "sightseeing";
}

function inferEcoScore(types = [], rating = 4) {
  const base = Math.round(60 + rating * 7);
  if (types.some((t) => ["park", "natural_feature"].includes(t))) return Math.min(98, base + 15);
  if (types.some((t) => ["restaurant", "cafe"].includes(t)))       return Math.min(90, base);
  return Math.min(92, base + 5);
}

function inferEmissions(types = []) {
  if (types.includes("park"))    return 0.1;
  if (types.includes("museum"))  return 0.3;
  if (types.includes("restaurant")) return 0.5;
  return 0.2;
}

function inferDuration(types = []) {
  if (types.includes("park"))         return "2–4 hours";
  if (types.includes("museum"))       return "2–3 hours";
  if (types.includes("restaurant"))   return "1–2 hours";
  if (types.includes("tourist_attraction")) return "1–3 hours";
  return "1–3 hours";
}

function inferPrice(priceLevel = 1, types = []) {
  if (types.includes("park") || types.includes("natural_feature")) return 0;
  const map = { 0: 0, 1: 12, 2: 22, 3: 45, 4: 80 };
  return map[priceLevel] ?? 15;
}

function getEcoTags(types = []) {
  for (const t of types) {
    if (ECO_TAGS_BY_TYPE[t]) return ECO_TAGS_BY_TYPE[t];
  }
  return ["Local Experience", "Eco-Friendly", "Authentic"];
}

function formatPlace(place, category) {
  const cat    = inferCategory(place.types ?? []);
  const photo  = place.photos?.[0]?.getUrl({ maxWidth: 600, maxHeight: 400 }) ?? null;
  const rating = place.rating ?? 4.2;

  return {
    id:          place.place_id,
    title:       place.name,
    category:    cat,
    image:       photo,
    description: `Explore ${place.name} — a local ${cat} highlight in the heart of the city. ${place.vicinity ? `Located at ${place.vicinity}.` : ""}`,
    price:       inferPrice(place.price_level, place.types ?? []),
    duration:    inferDuration(place.types ?? []),
    emissions:   inferEmissions(place.types ?? []),
    rating,
    reviews:     place.user_ratings_total ?? 0,
    tags:        getEcoTags(place.types ?? []),
    eco_score:   inferEcoScore(place.types ?? [], rating),
    isGooglePlace: true,
    featured:    rating >= 4.5,
    address:     place.vicinity ?? "",
  };
}
