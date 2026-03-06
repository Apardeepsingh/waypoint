
import { Loader } from "@googlemaps/js-api-loader";

let _loader = null;
let _google  = null;
let _loading = null; // pending promise

export async function loadGoogleMaps() {
  if (_google) return _google;

  if (!_loading) {
    if (!_loader) {
      _loader = new Loader({
        apiKey:    import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version:   "weekly",
        libraries: ["places", "geometry"],
      });
    }
    _loading = _loader.load().then((google) => {
      _google = google;
      return google;
    });
  }

  return _loading;
}

/* ─────────────────────────────────────────────────────────
   Distance Matrix — road distance in km between two places.
───────────────────────────────────────────────────────── */
export async function getRoadDistanceKm(origin, destination) {
  const google = await loadGoogleMaps();
  return new Promise((resolve, reject) => {
    const svc = new google.maps.DistanceMatrixService();
    svc.getDistanceMatrix(
      {
        origins:      [typeof origin      === "string" ? origin      : new google.maps.LatLng(origin.lat,      origin.lng)],
        destinations: [typeof destination === "string" ? destination : new google.maps.LatLng(destination.lat, destination.lng)],
        travelMode:   google.maps.TravelMode.DRIVING,
        unitSystem:   google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status !== "OK") return reject(new Error(`Distance Matrix: ${status}`));
        const el = response.rows[0].elements[0];
        if (el.status !== "OK") return reject(new Error(`Route not found: ${el.status}`));
        resolve(Math.round(el.distance.value / 1000));
      }
    );
  });
}

/* ─────────────────────────────────────────────────────────
   Directions API — real driving & transit durations.
   Returns { drivingMins, drivingText, transitMins, transitText }
   Falls back gracefully if route is not drivable (e.g. international).
───────────────────────────────────────────────────────── */
export async function getRouteDurations(origin, destination) {
  const google = await loadGoogleMaps();

  const resolve1 = (mode) =>
    new Promise((res) => {
      const svc = new google.maps.DirectionsService();
      const org = typeof origin      === "object" ? new google.maps.LatLng(origin.lat,      origin.lng)      : origin;
      const dst = typeof destination === "object" ? new google.maps.LatLng(destination.lat, destination.lng) : destination;
      svc.route(
        { origin: org, destination: dst, travelMode: google.maps.TravelMode[mode] },
        (result, status) => {
          if (status === "OK") {
            const leg = result.routes[0]?.legs[0];
            res({ mins: Math.round((leg?.duration?.value ?? 0) / 60), text: leg?.duration?.text ?? "" });
          } else {
            res(null);
          }
        }
      );
    });

  const [driving, transit] = await Promise.all([
    resolve1("DRIVING"),
    resolve1("TRANSIT"),
  ]);

  return {
    drivingMins: driving?.mins ?? null,
    drivingText: driving?.text ?? null,
    transitMins: transit?.mins ?? null,
    transitText: transit?.text ?? null,
  };
}

/* ─────────────────────────────────────────────────────────
   Render a Google Map into a DOM element.
   Shows the route between origin → destination using
   Directions API (roads). Falls back to geodesic polyline
   for international / undrivable routes (e.g. Lahore → London).
───────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
   Geocode a city/place name string → LatLng
───────────────────────────────────────────────────────── */
async function geocodeAddress(google, address) {
  return new Promise((resolve, reject) => {
    new google.maps.Geocoder().geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        resolve(results[0].geometry.location);
      } else {
        reject(new Error(`Geocode failed for "${address}": ${status}`));
      }
    });
  });
}

export async function renderRouteMap(divEl, originPlace, destinationPlace, originName, destinationName) {
  if (!divEl) return;
  const google = await loadGoogleMaps();

  const MAP_STYLE = [
    { featureType: "all",  elementType: "geometry.fill", stylers: [{ saturation: -20 }] },
    { featureType: "water", elementType: "geometry",     stylers: [{ color: "#c9dff0" }] },
    { featureType: "road",  elementType: "geometry",     stylers: [{ color: "#ffffff" }] },
    { featureType: "road",  elementType: "geometry.stroke", stylers: [{ color: "#e5e7eb" }] },
    { featureType: "poi",   stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#9ca3af" }, { weight: 1 }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f0fdf4" }] },
  ];

  const map = new google.maps.Map(divEl, {
    zoom: 4,
    center: { lat: 48, lng: 10 },
    styles: MAP_STYLE,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: "cooperative",
  });

  /* Resolve coordinates — use place objects first, fall back to geocoding */
  let p1, p2, fromLabel, toLabel;

  if (originPlace?.lat != null && destinationPlace?.lat != null) {
    p1 = new google.maps.LatLng(originPlace.lat, originPlace.lng);
    p2 = new google.maps.LatLng(destinationPlace.lat, destinationPlace.lng);
    fromLabel = originPlace.name ?? originName ?? "From";
    toLabel   = destinationPlace.name ?? destinationName ?? "To";
  } else if (originName && destinationName) {
    [p1, p2] = await Promise.all([
      geocodeAddress(google, originName),
      geocodeAddress(google, destinationName),
    ]);
    fromLabel = originName;
    toLabel   = destinationName;
  } else {
    throw new Error("No location data available for map");
  }

  /* Try Directions API (works for drivable routes) */
  const ds = new google.maps.DirectionsService();
  const dr = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: true,
    polylineOptions: { strokeColor: "#2d7a4f", strokeWeight: 4, strokeOpacity: 0.85 },
  });

  const drawFallbackArc = () => {
    new google.maps.Polyline({
      path: [p1, p2],
      geodesic: true,
      strokeColor: "#2d7a4f",
      strokeWeight: 3,
      strokeOpacity: 0.85,
      map,
      icons: [
        {
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 4, fillColor: "#2d7a4f", fillOpacity: 1, strokeOpacity: 0 },
          offset: "50%",
        },
      ],
    });
  };

  const addMarkersAndFit = () => {
    [
      { pos: p1, label: fromLabel, color: "#2d7a4f" },
      { pos: p2, label: toLabel,   color: "#1a3a2a" },
    ].forEach(({ pos, label, color }, i) => {
      const marker = new google.maps.Marker({
        position: pos, map,
        title: label,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2.5,
        },
      });
      new google.maps.InfoWindow({
        content: `<div style="font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:#1a2e1a;padding:2px 4px">${label}</div>`,
      }).open(map, marker);
    });
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(p1); bounds.extend(p2);
    map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
  };

  ds.route(
    { origin: p1, destination: p2, travelMode: google.maps.TravelMode.DRIVING },
    (result, status) => {
      if (status === "OK") {
        dr.setDirections(result);
      } else {
        drawFallbackArc();
      }
      addMarkersAndFit();
    }
  );
}
