/* ─────────────────────────────────────────────────────────
   Waypoint — Carbon Footprint Utilities
   
   Formula:  CO₂ (kg) = distance_km × factor × passengers
   
   Emission factors (kg CO₂ per km per person):
     ✈  Short-haul flight   0.255
     🚂 High-speed train    0.006
     🚌 Coach / bus         0.027
     🚗 Car (petrol)        0.171
     🔋 EV car              0.053
   
   Eco Score = normalised 0–100 vs flight baseline (lowest = best).
───────────────────────────────────────────────────────── */

export const EMISSION_FACTORS = {
  flight: 0.255,
  train:  0.006,
  bus:    0.027,
  car:    0.171,
  ev:     0.053,
};

/** Haversine great-circle distance in km between two lat/lng points */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
function deg2rad(d) { return (d * Math.PI) / 180; }

/** CO₂ in kg for a given mode, distance and number of passengers */
export function calcCO2(mode, distanceKm, passengers = 1) {
  const factor = EMISSION_FACTORS[mode] ?? 0;
  return +(factor * distanceKm * passengers).toFixed(1);
}

/**
 * Eco Score 0–100 relative to the flight baseline for the same route.
 * Flight = score 0 (worst), a mode with 0 emissions = score 100.
 */
export function ecoScore(mode, distanceKm) {
  const co2     = calcCO2(mode, distanceKm, 1);
  const worst   = calcCO2("flight", distanceKm, 1);
  if (worst === 0) return 100;
  return Math.max(0, Math.round((1 - co2 / worst) * 100));
}

/** Human-readable CO₂ equivalence string */
export function co2Equivalence(savedKg) {
  const trees   = Math.round(savedKg / 22);
  const kmDrive = Math.round(savedKg / (EMISSION_FACTORS.car));
  if (trees >= 1) return `equivalent to planting ${trees} tree${trees !== 1 ? "s" : ""}`;
  return `equivalent to not driving ${kmDrive} km`;
}

/**
 * Build the full transport options array for a given route.
 * Returns objects ready to render in PlanTripPage.
 */
export function buildTransportOptions(distanceKm, passengers = 2) {
  const flight = calcCO2("flight", distanceKm, 1);

  return [
    {
      id:        "eurostar",
      mode:      "train",
      operator:  "Eurostar",
      type:      "High-Speed Train",
      emoji:     "🚄",
      duration:  estimateDuration("train",  distanceKm),
      price:     estimatePrice("train",   distanceKm, passengers),
      co2:       calcCO2("train",  distanceKm, 1),
      score:     ecoScore("train",  distanceKm),
      badge:     "Best Eco",
      badgeColor:"#2d7a4f",
      highlight: true,
    },
    {
      id:        "bus",
      mode:      "bus",
      operator:  "FlixBus",
      type:      "Eco Coach",
      emoji:     "🚌",
      duration:  estimateDuration("bus",   distanceKm),
      price:     estimatePrice("bus",    distanceKm, passengers),
      co2:       calcCO2("bus",   distanceKm, 1),
      score:     ecoScore("bus",   distanceKm),
      badge:     "Best Value",
      badgeColor:"#1d4ed8",
      highlight: false,
    },
    {
      id:        "carpool",
      mode:      "car",
      operator:  "BlaBlaCar",
      type:      "Shared Ride",
      emoji:     "🚗",
      duration:  estimateDuration("car",   distanceKm),
      price:     estimatePrice("car",    distanceKm, passengers),
      co2:       calcCO2("car",   distanceKm, 1),
      score:     ecoScore("car",   distanceKm),
      badge:     null,
      badgeColor:null,
      highlight: false,
    },
    {
      id:        "flight",
      mode:      "flight",
      operator:  "EasyJet",
      type:      "Short-Haul Flight",
      emoji:     "✈️",
      duration:  estimateDuration("flight", distanceKm),
      price:     estimatePrice("flight",  distanceKm, passengers),
      co2:       flight,
      score:     0,
      badge:     "Highest CO₂",
      badgeColor:"#dc2626",
      highlight: false,
    },
  ];
}

/* ── Private helpers ─────────────────────────────────────── */

function estimateDuration(mode, km) {
  const speeds = { train: 220, bus: 90, car: 100, flight: 750 };
  const overheads = { train: 30, bus: 15, car: 0, flight: 120 }; // boarding etc.
  const mins = Math.round((km / speeds[mode]) * 60) + (overheads[mode] ?? 0);
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function estimatePrice(mode, km, passengers) {
  // rough pricing per person
  const basePerKm = { train: 0.22, bus: 0.06, car: 0.08, flight: 0.18 };
  const fixed     = { train: 15,   bus: 5,    car: 10,   flight: 40  };
  const perPerson = Math.round(basePerKm[mode] * km + fixed[mode]);
  return mode === "car"
    ? Math.round(perPerson * passengers) // car price is per trip
    : perPerson;                         // others are per person
}
