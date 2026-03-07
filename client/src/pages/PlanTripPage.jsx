import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plane, Train, Bus, Car,
  Leaf, ArrowRight, Star,
  SlidersHorizontal, ChevronDown, Info, Wind, Filter,
  CheckCircle2, MapPin, Loader2, Sparkles, X, Shield,
} from "lucide-react";
import { buildTransportOptions, co2Equivalence, calcCO2, ecoScore } from "../utils/carbon";
import { analyzeRoute } from "../services/openRouter";
import { useTrip } from "../context/TripContext";

const FILTERS = [
  { key: "all",      label: "All Options" },
  { key: "cheapest", label: "💰 Cheapest" },
  { key: "fastest",  label: "⚡ Fastest" },
  { key: "greenest", label: "🌿 Greenest" },
];

/* ─────────────────────────────────────────
   ECO SCORE BAR
───────────────────────────────────────── */
function EcoScoreBar({ score, ecoLabel, ecoColor }) {
  const barColor = score >= 75 ? "#22c55e" : score >= 50 ? "#84cc16" : score >= 25 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ minWidth: "9rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
        <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>
          Eco Score
        </span>
        <span style={{ fontSize: "0.72rem", color: ecoColor, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
          {ecoLabel}
        </span>
      </div>
      <div style={{ width: "100%", height: "7px", borderRadius: "99px", background: "#e5e7eb", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: "99px", width: `${score}%`, background: barColor, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TRANSPORT CARD
───────────────────────────────────────── */
function TransportCard({ option, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const { Icon } = option;

  const cardBorder = option.highlight
    ? "2px solid #bbf7d0"
    : isSelected
    ? "2px solid #4aab74"
    : "2px solid transparent";

  const cardBg = option.highlight ? "linear-gradient(135deg,#f0fdf4,#ecfdf5)" : "#fff";
  const iconBg = option.highlight ? "#dcfce7" : "#f3f4f6";
  const iconColor = option.highlight ? "#2d7a4f" : "#6b7280";

  return (
    <div
      onClick={() => onSelect(option.id)}
      style={{
        borderRadius: "1.25rem",
        background: cardBg,
        border: cardBorder,
        boxShadow: isSelected
          ? "0 0 0 2px #2d7a4f, 0 8px 30px rgba(45,122,79,0.12)"
          : "0 2px 16px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "box-shadow 0.2s, border-color 0.2s",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1.25rem 1.5rem" }}>
        {/* Route label — shown for showcase cards that have a defined city pair */}
        {option.from && option.to && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            marginBottom: "0.75rem",
            padding: "0.28rem 0.8rem",
            background: "#f0fdf4",
            borderRadius: "9999px",
            border: "1px solid #bbf7d0",
          }}>
            <MapPin style={{ width: "0.72rem", height: "0.72rem", color: "#2d7a4f", flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", fontFamily: "'Inter',sans-serif" }}>
              {option.from} → {option.to}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#6b7280", fontFamily: "'Inter',sans-serif" }}>
              · {option.distanceKm?.toLocaleString()} km
            </span>
          </div>
        )}

        {/* Main row */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>

          {/* Icon + Company */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: "10rem", flex: "0 0 auto" }}>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                borderRadius: "0.875rem",
                background: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: "1.4rem", height: "1.4rem", color: iconColor }} />
            </div>
            <div>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", fontFamily: "'Inter',sans-serif", marginBottom: "0.125rem" }}>
                {option.company}
              </p>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>
                {option.title}
              </p>
            </div>
          </div>

          {/* Times + Duration */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flex: "1 1 auto", minWidth: "14rem" }}>
            {/* Departure */}
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", lineHeight: 1, fontFamily: "'Inter',sans-serif" }}>
                {option.departure}
              </p>
              <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "0.2rem", fontFamily: "'Inter',sans-serif" }}>Departure</p>
            </div>

            {/* Duration line */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>{option.duration}</p>
              <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ flex: 1, height: "1px", background: "#d1d5db" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2d7a4f", flexShrink: 0 }} />
                <div style={{ flex: 1, height: "1px", background: "#d1d5db" }} />
              </div>
              <p style={{ fontSize: "0.68rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>{option.stops}</p>
            </div>

            {/* Arrival */}
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", lineHeight: 1, fontFamily: "'Inter',sans-serif" }}>
                {option.arrival}
              </p>
              <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "0.2rem", fontFamily: "'Inter',sans-serif" }}>Arrival</p>
            </div>
          </div>

          {/* Eco score */}
          <div style={{ flex: "0 0 auto", width: "9.5rem" }}>
            <EcoScoreBar score={option.ecoScore} ecoLabel={option.ecoLabel} ecoColor={option.ecoColor} />
            <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "0.35rem", fontFamily: "'Inter',sans-serif" }}>
              {option.emissions} kg CO₂/person
            </p>
          </div>

          {/* Badge + Price */}
          <div style={{ flex: "0 0 auto", minWidth: "6rem", textAlign: "right" }}>
            {/* Badge */}
            <div style={{ marginBottom: "0.375rem", minHeight: "1.4rem" }}>
              {option.badge && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.25rem",
                  padding: "0.2rem 0.6rem", borderRadius: "9999px",
                  background: option.badgeBg, color: option.badgeColor,
                  fontSize: "0.72rem", fontWeight: 700, fontFamily: "'Inter',sans-serif",
                }}>
                  {option.badge === "Best Eco" ? "★ " : ""}{option.badge}
                </span>
              )}
            </div>
            <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1a2e1a", lineHeight: 1, fontFamily: "'Inter',sans-serif" }}>
              £{option.price}
            </p>
            <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "0.15rem", fontFamily: "'Inter',sans-serif" }}>
              per person
            </p>
          </div>

          {/* Select button */}
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(option.id); }}
            style={{
              flex: "0 0 auto",
              padding: "0.6rem 1.25rem",
              borderRadius: "0.75rem",
              border: `2px solid ${isSelected ? "#2d7a4f" : "#4aab74"}`,
              background: isSelected ? "#2d7a4f" : "transparent",
              color: isSelected ? "#fff" : "#2d7a4f",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter',sans-serif",
              whiteSpace: "nowrap",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {isSelected ? "✓ Selected" : "Select"}
          </button>
        </div>

        {/* ── Bottom action row: amenities ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.875rem", flexWrap: "wrap" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
              fontSize: "0.75rem", color: "#9ca3af",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: "'Inter',sans-serif",
            }}
          >
            <Info style={{ width: "0.875rem", height: "0.875rem" }} />
            {expanded ? "Hide" : "Show"} amenities
            <ChevronDown style={{
              width: "0.875rem", height: "0.875rem",
              transition: "transform 0.2s",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }} />
          </button>
        </div>

        {/* Expanded amenities */}
        {expanded && (
          <div style={{ marginTop: "0.75rem" }}>
            {/* Gemini fun fact for this mode */}
            {option.funFact && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                padding: "0.625rem 0.875rem",
                background: "#f0fdf4",
                borderRadius: "0.75rem",
                border: "1px solid #bbf7d0",
                marginBottom: "0.625rem",
              }}>
                <Sparkles style={{ width: "0.8rem", height: "0.8rem", color: "#2d7a4f", flexShrink: 0, marginTop: "0.15rem" }} />
                <p style={{ fontSize: "0.78rem", color: "#166534", fontFamily: "'Inter',sans-serif", lineHeight: 1.5, margin: 0 }}>
                  {option.funFact}
                </p>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            {option.amenities.map((a) => (
              <span
                key={a}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  background: "#f3f4f6",
                  color: "#4b5563",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  fontFamily: "'Inter',sans-serif",
                }}
              >
                {a}
              </span>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Star style={{ width: "0.875rem", height: "0.875rem", color: "#facc15", fill: "#facc15" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", fontFamily: "'Inter',sans-serif" }}>
                {option.rating}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                ({option.reviews.toLocaleString()} reviews)
              </span>
            </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ROUTE-AWARE OPERATORS
   Returns operator names + types based on
   origin, destination and distance.
───────────────────────────────────────── */
function getRouteOperators(from, to, distanceKm) {
  const f = (from || "").toLowerCase();
  const t = (to   || "").toLowerCase();

  /* ── Pakistan / South Asia → UK / Europe ── */
  const isPakistanOrigin = /lahore|karachi|islamabad|peshawar|multan/.test(f);
  const isPakistanDest   = /lahore|karachi|islamabad|peshawar|multan/.test(t);
  const isUKorEU = /london|manchester|paris|dubai|berlin|amsterdam|rome|madrid/.test(t + f);
  if ((isPakistanOrigin || isPakistanDest) && distanceKm > 3000) {
    return {
      flight: { operator: "PIA / Emirates / Turkish Airlines", type: "Long-Haul Flight" },
      train:  { operator: "Connecting Train", type: "Rail + Eurostar" },
      bus:    { operator: "Flixbus Connect",  type: "Coach via Istanbul" },
      car:    { operator: "International Drive", type: "Multi-Country Drive" },
    };
  }

  /* ── UK domestic ── */
  const ukCities = /london|manchester|birmingham|edinburgh|glasgow|leeds|bristol|liverpool|sheffield|newcastle|cardiff/;
  if (ukCities.test(f) && ukCities.test(t)) {
    return {
      train:  { operator: "LNER / Avanti West Coast",  type: "Intercity Train" },
      bus:    { operator: "National Express",           type: "Express Coach" },
      car:    { operator: "BlaBlaCar",                  type: "Shared Ride" },
      flight: { operator: "British Airways / Loganair", type: "Domestic Flight" },
    };
  }

  /* ── Europe ↔ UK (via Eurostar corridor) ── */
  const euCities = /paris|brussels|amsterdam|antwerp|rotterdam|lille|cologne|frankfurt/;
  if ((euCities.test(f) || euCities.test(t)) && distanceKm < 1200) {
    return {
      train:  { operator: "Eurostar / Thalys",    type: "High-Speed Train" },
      bus:    { operator: "FlixBus",              type: "Express Coach" },
      car:    { operator: "BlaBlaCar",            type: "Shared Ride" },
      flight: { operator: "Ryanair / EasyJet",   type: "Short-Haul Flight" },
    };
  }

  /* ── Europe continental (medium haul) ── */
  if (distanceKm > 500 && distanceKm <= 2500) {
    return {
      train:  { operator: "Eurostar / DB / SNCF", type: "High-Speed Train" },
      bus:    { operator: "FlixBus",              type: "Express Coach" },
      car:    { operator: "BlaBlaCar",            type: "Shared Ride" },
      flight: { operator: "Ryanair / Wizz Air",  type: "Short-Haul Flight" },
    };
  }

  /* ── Default ── */
  return {
    train:  { operator: "Eurostar",  type: "High-Speed Train" },
    bus:    { operator: "FlixBus",   type: "Express Coach" },
    car:    { operator: "BlaBlaCar", type: "Shared Ride" },
    flight: { operator: "EasyJet",  type: "Short-Haul Flight" },
  };
}

/* ─────────────────────────────────────────
   SCHEDULES  (outside component — stable ref)
   More slots = richer listing
───────────────────────────────────────── */
const SCHEDULES = {
  train:  [
    { dep: "05:48", arr: "08:05" },
    { dep: "07:31", arr: "09:46" },
    { dep: "09:02", arr: "11:17" },
    { dep: "11:58", arr: "14:13" },
    { dep: "14:22", arr: "16:37" },
    { dep: "17:04", arr: "19:19" },
  ],
  bus:    [
    { dep: "06:30", arr: "11:15" },
    { dep: "08:45", arr: "13:30" },
    { dep: "13:00", arr: "17:45" },
    { dep: "20:00", arr: "00:45" },
  ],
  car:    [
    { dep: "07:00", arr: "10:45" },
    { dep: "09:30", arr: "13:15" },
    { dep: "12:00", arr: "15:45" },
    { dep: "15:30", arr: "19:15" },
  ],
  flight: [
    { dep: "06:20", arr: "07:55" },
    { dep: "09:45", arr: "11:20" },
    { dep: "12:30", arr: "14:05" },
    { dep: "15:10", arr: "16:45" },
    { dep: "18:55", arr: "20:30" },
    { dep: "22:10", arr: "23:45" },
  ],
};

/* ─────────────────────────────────────────
   MODULE-LEVEL HELPERS
   Used by SHOWCASE_CARDS (outside component scope).
───────────────────────────────────────── */
function _getAmenities(mode) {
  return {
    train:  ["Wi-Fi", "Dining Car", "Power Sockets", "Luggage Storage"],
    bus:    ["Wi-Fi", "USB Charging", "Reclining Seats"],
    car:    ["Shared Ride", "Music Shared", "Luggage Space"],
    flight: ["Onboard Snacks", "Hand Luggage", "Online Check-in"],
  }[mode] ?? [];
}
const _getDefaultRating  = (m) => ({ train: 4.8, bus: 4.3, car: 4.6, flight: 3.9 }[m] ?? 4.0);
const _getDefaultReviews = (m) => ({ train: 2841, bus: 5120, car: 987, flight: 14322 }[m] ?? 1000);

function _addTime(dep, dur) {
  const [h, m] = dep.split(":").map(Number);
  const match  = dur.match(/(\d+)h\s*(\d+)m/);
  if (!match) return dep;
  const total = h * 60 + m + parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/* ─────────────────────────────────────────
   SHOWCASE CARDS — 35 purposeful European routes
   Shown when the user has not entered a custom
   origin/destination. Every card has a real city
   pair, real distance, calculated CO₂ and a
   realistic price + travel time.
   Format: [from, to, distKm, mode, operator, typeLabel, dep, price£, duration]
───────────────────────────────────────── */
const _IMAP = { train: Train, bus: Bus, car: Car, flight: Plane };

/* Hardcoded city coordinates — used as fromPlace/toPlace for showcase map
   rendering so the map works without needing the Geocoding API enabled. */
const _CITY_COORDS = {
  "London":     { lat: 51.5074, lng: -0.1278 },
  "Paris":      { lat: 48.8566, lng:  2.3522 },
  "Amsterdam":  { lat: 52.3676, lng:  4.9041 },
  "Brussels":   { lat: 50.8503, lng:  4.3517 },
  "Birmingham": { lat: 52.4862, lng: -1.8904 },
  "Berlin":     { lat: 52.5200, lng: 13.4050 },
  "Manchester": { lat: 53.4808, lng: -2.2426 },
  "Frankfurt":  { lat: 50.1109, lng:  8.6821 },
  "Barcelona":  { lat: 41.3851, lng:  2.1734 },
  "Rome":       { lat: 41.9028, lng: 12.4964 },
  "Vienna":     { lat: 48.2082, lng: 16.3738 },
  "Edinburgh":  { lat: 55.9533, lng: -3.1883 },
  "Zurich":     { lat: 47.3769, lng:  8.5417 },
  "Lisbon":     { lat: 38.7169, lng: -9.1395 },
  "Glasgow":    { lat: 55.8642, lng: -4.2518 },
  "Cologne":    { lat: 50.9333, lng:  6.9500 },
  "Madrid":     { lat: 40.4168, lng: -3.7038 },
  "Prague":     { lat: 50.0755, lng: 14.4378 },
  "Milan":      { lat: 45.4654, lng:  9.1859 },
  "Munich":     { lat: 48.1351, lng: 11.5820 },
  "Lyon":       { lat: 45.7640, lng:  4.8357 },
  "Hamburg":    { lat: 53.5753, lng: 10.0153 },
  "Copenhagen": { lat: 55.6761, lng: 12.5683 },
  "Stockholm":  { lat: 59.3293, lng: 18.0686 },
  "Dublin":     { lat: 53.3498, lng: -6.2603 },
  "Leeds":      { lat: 53.8008, lng: -1.5491 },
  "Liverpool":  { lat: 53.4084, lng: -2.9916 },
  "Bristol":    { lat: 51.4545, lng: -2.5879 },
};

const _DEFS = [
  // ── London → Paris (341 km) ──
  ["London","Paris",341,"train","Eurostar","High-Speed Train","06:01",90,"2h 15m"],
  ["London","Paris",341,"flight","Ryanair","Short-Haul Flight","07:30",65,"1h 15m"],
  ["London","Paris",341,"bus","FlixBus","Express Coach","22:00",25,"8h 30m"],
  ["London","Paris",341,"car","BlaBlaCar","Shared Ride","07:00",45,"5h 30m"],
  // ── London → Amsterdam (503 km) ──
  ["London","Amsterdam",503,"train","Eurostar","High-Speed Train","07:31",149,"3h 52m"],
  ["London","Amsterdam",503,"flight","EasyJet","Short-Haul Flight","06:20",79,"1h 15m"],
  ["London","Amsterdam",503,"bus","FlixBus","Express Coach","21:00",35,"10h 00m"],
  // ── London → Brussels (319 km) ──
  ["London","Brussels",319,"train","Eurostar","High-Speed Train","05:57",85,"2h 01m"],
  ["London","Brussels",319,"flight","Ryanair","Short-Haul Flight","08:10",55,"1h 00m"],
  ["London","Brussels",319,"bus","FlixBus","Express Coach","22:30",22,"7h 30m"],
  // ── Birmingham → Berlin (1268 km) ──
  ["Birmingham","Berlin",1268,"train","LNER / DB","Intercity Train","07:00",185,"9h 45m"],
  ["Birmingham","Berlin",1268,"flight","Ryanair","Short-Haul Flight","06:45",89,"2h 05m"],
  ["Birmingham","Berlin",1268,"bus","FlixBus","Express Coach","18:00",65,"22h 00m"],
  // ── Manchester → Frankfurt (1097 km) ──
  ["Manchester","Frankfurt",1097,"train","Avanti / DB","Intercity Train","07:30",165,"8h 30m"],
  ["Manchester","Frankfurt",1097,"flight","EasyJet","Short-Haul Flight","09:45",75,"1h 55m"],
  ["Manchester","Frankfurt",1097,"bus","FlixBus","Express Coach","19:00",55,"20h 00m"],
  // ── Paris → Barcelona (1037 km) ──
  ["Paris","Barcelona",1037,"train","SNCF TGV","High-Speed Train","07:00",95,"6h 27m"],
  ["Paris","Barcelona",1037,"flight","Vueling","Short-Haul Flight","09:30",70,"1h 45m"],
  ["Paris","Barcelona",1037,"bus","FlixBus","Express Coach","20:00",45,"17h 00m"],
  ["Paris","Barcelona",1037,"car","BlaBlaCar","Shared Ride","08:00",55,"10h 00m"],
  // ── Amsterdam → Rome (1649 km) ──
  ["Amsterdam","Rome",1649,"train","NS / Trenitalia","High-Speed Train","06:00",210,"14h 00m"],
  ["Amsterdam","Rome",1649,"flight","KLM","Short-Haul Flight","08:30",110,"2h 35m"],
  ["Amsterdam","Rome",1649,"bus","FlixBus","Express Coach","17:00",75,"26h 00m"],
  // ── Brussels → Vienna (1120 km) ──
  ["Brussels","Vienna",1120,"train","Thalys / ÖBB","High-Speed Train","07:15",175,"9h 00m"],
  ["Brussels","Vienna",1120,"flight","Brussels Airlines","Short-Haul Flight","10:00",90,"1h 55m"],
  ["Brussels","Vienna",1120,"bus","FlixBus","Express Coach","18:30",55,"18h 00m"],
  // ── Edinburgh → Zurich (1835 km) ──
  ["Edinburgh","Zurich",1835,"train","LNER / SBB","Intercity Train","06:00",220,"16h 00m"],
  ["Edinburgh","Zurich",1835,"flight","EasyJet","Short-Haul Flight","07:45",99,"2h 15m"],
  ["Edinburgh","Zurich",1835,"bus","FlixBus","Express Coach","15:00",85,"30h 00m"],
  // ── London → Lisbon (1761 km) ──
  ["London","Lisbon",1761,"train","Eurostar / Renfe","Intercity Train","07:00",195,"20h 00m"],
  ["London","Lisbon",1761,"flight","British Airways","Short-Haul Flight","08:20",120,"2h 30m"],
  ["London","Lisbon",1761,"bus","FlixBus","Express Coach","16:00",79,"30h 00m"],
  // ── Glasgow → Cologne (1400 km) ──
  ["Glasgow","Cologne",1400,"train","LNER / DB","Intercity Train","06:30",195,"12h 00m"],
  ["Glasgow","Cologne",1400,"flight","Jet2","Short-Haul Flight","07:00",89,"2h 00m"],
  ["Glasgow","Cologne",1400,"car","BlaBlaCar","Shared Ride","07:00",75,"13h 00m"],
  // ── London → Edinburgh (668 km) ──
  ["London","Edinburgh",668,"train","LNER","Intercity Train","05:30",85,"4h 24m"],
  ["London","Edinburgh",668,"flight","British Airways","Domestic Flight","07:00",55,"1h 20m"],
  ["London","Edinburgh",668,"bus","National Express","Express Coach","08:00",25,"9h 00m"],
  ["London","Edinburgh",668,"car","BlaBlaCar","Shared Ride","06:00",45,"7h 00m"],
  // ── Edinburgh → London (668 km) ──
  ["Edinburgh","London",668,"train","LNER","Intercity Train","07:00",89,"4h 24m"],
  ["Edinburgh","London",668,"flight","EasyJet","Domestic Flight","06:30",52,"1h 20m"],
  ["Edinburgh","London",668,"bus","National Express","Express Coach","09:00",22,"9h 00m"],
  // ── London → Manchester (320 km) ──
  ["London","Manchester",320,"train","Avanti West Coast","Intercity Train","07:03",79,"2h 08m"],
  ["London","Manchester",320,"flight","British Airways","Domestic Flight","07:30",65,"0h 55m"],
  ["London","Manchester",320,"bus","National Express","Express Coach","08:00",19,"4h 00m"],
  ["London","Manchester",320,"car","BlaBlaCar","Shared Ride","07:00",35,"3h 30m"],
  // ── Manchester → London (320 km) ──
  ["Manchester","London",320,"train","Avanti West Coast","Intercity Train","06:47",75,"2h 08m"],
  ["Manchester","London",320,"flight","British Airways","Domestic Flight","08:00",62,"0h 55m"],
  ["Manchester","London",320,"bus","National Express","Express Coach","07:00",18,"4h 00m"],
  // ── Paris → Amsterdam (516 km) ──
  ["Paris","Amsterdam",516,"train","Thalys","High-Speed Train","07:19",95,"3h 17m"],
  ["Paris","Amsterdam",516,"flight","Air France","Short-Haul Flight","09:00",79,"1h 05m"],
  ["Paris","Amsterdam",516,"bus","FlixBus","Express Coach","07:00",28,"8h 30m"],
  ["Paris","Amsterdam",516,"car","BlaBlaCar","Shared Ride","08:00",55,"5h 30m"],
  // ── Amsterdam → Paris (516 km) ──
  ["Amsterdam","Paris",516,"train","Thalys","High-Speed Train","09:17",89,"3h 17m"],
  ["Amsterdam","Paris",516,"flight","KLM","Short-Haul Flight","07:30",75,"1h 05m"],
  ["Amsterdam","Paris",516,"bus","FlixBus","Express Coach","20:00",26,"8h 30m"],
  // ── Amsterdam → Berlin (648 km) ──
  ["Amsterdam","Berlin",648,"train","NS / DB","Intercity Train","09:14",79,"5h 54m"],
  ["Amsterdam","Berlin",648,"flight","KLM / Ryanair","Short-Haul Flight","07:00",65,"1h 20m"],
  ["Amsterdam","Berlin",648,"bus","FlixBus","Express Coach","08:00",29,"9h 00m"],
  // ── Berlin → Vienna (684 km) ──
  ["Berlin","Vienna",684,"train","DB / ÖBB","High-Speed Train","06:43",79,"7h 40m"],
  ["Berlin","Vienna",684,"flight","Ryanair","Short-Haul Flight","06:00",69,"1h 30m"],
  ["Berlin","Vienna",684,"bus","FlixBus","Express Coach","20:00",35,"10h 30m"],
  // ── Vienna → Prague (333 km) ──
  ["Vienna","Prague",333,"train","ÖBB / CD","High-Speed Train","07:08",49,"4h 20m"],
  ["Vienna","Prague",333,"flight","Austrian Airlines","Short-Haul Flight","08:30",75,"0h 55m"],
  ["Vienna","Prague",333,"bus","FlixBus","Express Coach","09:00",19,"4h 30m"],
  ["Vienna","Prague",333,"car","BlaBlaCar","Shared Ride","08:00",30,"3h 45m"],
  // ── Paris → Rome (1427 km) ──
  ["Paris","Rome",1427,"train","SNCF / Trenitalia","High-Speed Train","07:10",149,"11h 00m"],
  ["Paris","Rome",1427,"flight","Air France","Short-Haul Flight","07:30",99,"2h 00m"],
  ["Paris","Rome",1427,"bus","FlixBus","Express Coach","19:00",69,"22h 00m"],
  // ── London → Rome (1870 km) ──
  ["London","Rome",1870,"train","Eurostar / Trenitalia","Intercity Train","06:00",219,"18h 00m"],
  ["London","Rome",1870,"flight","British Airways","Short-Haul Flight","07:00",129,"2h 40m"],
  ["London","Rome",1870,"bus","FlixBus","Express Coach","16:00",89,"33h 00m"],
  // ── Madrid → Barcelona (621 km) ──
  ["Madrid","Barcelona",621,"train","Renfe AVE","High-Speed Train","07:00",65,"2h 30m"],
  ["Madrid","Barcelona",621,"flight","Iberia / Vueling","Short-Haul Flight","07:00",55,"1h 20m"],
  ["Madrid","Barcelona",621,"bus","ALSA","Express Coach","08:00",25,"8h 00m"],
  ["Madrid","Barcelona",621,"car","BlaBlaCar","Shared Ride","08:00",45,"6h 00m"],
  // ── Barcelona → Madrid (621 km) ──
  ["Barcelona","Madrid",621,"train","Renfe AVE","High-Speed Train","08:00",62,"2h 30m"],
  ["Barcelona","Madrid",621,"flight","Vueling","Short-Haul Flight","08:30",52,"1h 20m"],
  ["Barcelona","Madrid",621,"bus","ALSA","Express Coach","09:00",22,"8h 00m"],
  // ── Munich → Berlin (590 km) ──
  ["Munich","Berlin",590,"train","DB ICE","High-Speed Train","06:00",69,"4h 00m"],
  ["Munich","Berlin",590,"flight","Lufthansa","Short-Haul Flight","07:00",75,"1h 10m"],
  ["Munich","Berlin",590,"bus","FlixBus","Express Coach","20:00",25,"8h 30m"],
  ["Munich","Berlin",590,"car","BlaBlaCar","Shared Ride","07:00",52,"5h 30m"],
  // ── London → Dublin (464 km) ──
  ["London","Dublin",464,"flight","Aer Lingus","Short-Haul Flight","07:00",59,"1h 20m"],
  ["London","Dublin",464,"bus","Flixbus + Ferry","Express Coach","08:00",29,"9h 00m"],
  ["London","Dublin",464,"train","Avanti + Stena Line","Rail + Ferry","06:00",89,"8h 30m"],
  // ── Zurich → Milan (225 km) ──
  ["Zurich","Milan",225,"train","SBB / Trenitalia","High-Speed Train","07:03",39,"3h 21m"],
  ["Zurich","Milan",225,"flight","Swiss","Short-Haul Flight","08:00",79,"0h 50m"],
  ["Zurich","Milan",225,"bus","FlixBus","Express Coach","09:00",15,"3h 45m"],
  ["Zurich","Milan",225,"car","BlaBlaCar","Shared Ride","08:00",25,"2h 45m"],
  // ── London → Birmingham (183 km) ──
  ["London","Birmingham",183,"train","Avanti West Coast","Intercity Train","06:43",49,"1h 21m"],
  ["London","Birmingham",183,"bus","National Express","Express Coach","08:00",15,"2h 15m"],
  ["London","Birmingham",183,"car","BlaBlaCar","Shared Ride","07:00",28,"2h 00m"],
  // ── Birmingham → London (183 km) ──
  ["Birmingham","London",183,"train","Avanti West Coast","Intercity Train","07:12",45,"1h 21m"],
  ["Birmingham","London",183,"bus","National Express","Express Coach","07:30",14,"2h 15m"],
  ["Birmingham","London",183,"car","BlaBlaCar","Shared Ride","07:00",25,"2h 00m"],
  // ── Paris → Lyon (465 km) ──
  ["Paris","Lyon",465,"train","SNCF TGV","High-Speed Train","07:00",59,"1h 58m"],
  ["Paris","Lyon",465,"flight","Air France","Short-Haul Flight","08:00",69,"1h 00m"],
  ["Paris","Lyon",465,"bus","FlixBus","Express Coach","07:30",18,"5h 30m"],
  ["Paris","Lyon",465,"car","BlaBlaCar","Shared Ride","07:00",40,"4h 30m"],
  // ── Cologne → Berlin (573 km) ──
  ["Cologne","Berlin",573,"train","DB ICE","High-Speed Train","06:00",65,"4h 17m"],
  ["Cologne","Berlin",573,"flight","Eurowings","Short-Haul Flight","07:00",72,"1h 10m"],
  ["Cologne","Berlin",573,"bus","FlixBus","Express Coach","21:00",22,"8h 00m"],
  // ── Hamburg → Berlin (288 km) ──
  ["Hamburg","Berlin",288,"train","DB ICE","High-Speed Train","06:02",39,"1h 45m"],
  ["Hamburg","Berlin",288,"flight","Ryanair","Short-Haul Flight","07:30",55,"0h 55m"],
  ["Hamburg","Berlin",288,"bus","FlixBus","Express Coach","08:00",12,"3h 30m"],
  ["Hamburg","Berlin",288,"car","BlaBlaCar","Shared Ride","08:00",29,"3h 00m"],
  // ── London → Liverpool (346 km) ──
  ["London","Liverpool",346,"train","Avanti West Coast","Intercity Train","06:55",69,"2h 07m"],
  ["London","Liverpool",346,"bus","National Express","Express Coach","07:30",20,"4h 30m"],
  ["London","Liverpool",346,"car","BlaBlaCar","Shared Ride","07:00",38,"3h 30m"],
  // ── Liverpool → London (346 km) ──
  ["Liverpool","London",346,"train","Avanti West Coast","Intercity Train","07:23",65,"2h 07m"],
  ["Liverpool","London",346,"bus","National Express","Express Coach","08:00",19,"4h 30m"],
  // ── Copenhagen → Stockholm (659 km) ──
  ["Copenhagen","Stockholm",659,"train","SJ / DSB","Intercity Train","07:30",79,"5h 30m"],
  ["Copenhagen","Stockholm",659,"flight","SAS","Short-Haul Flight","07:00",89,"1h 05m"],
  ["Copenhagen","Stockholm",659,"bus","FlixBus","Express Coach","20:00",32,"9h 00m"],
  // ── London → Bristol (189 km) ──
  ["London","Bristol",189,"train","GWR","Intercity Train","06:44",45,"1h 40m"],
  ["London","Bristol",189,"bus","National Express","Express Coach","08:00",12,"2h 30m"],
  ["London","Bristol",189,"car","BlaBlaCar","Shared Ride","07:00",25,"2h 10m"],
];

const SHOWCASE_CARDS = _DEFS.map(([from, to, distanceKm, mode, operator, typeLabel, departure, price, duration], i) => {
  const co2   = +calcCO2(mode, distanceKm, 1).toFixed(1);
  const score = ecoScore(mode, distanceKm);
  let badge = null, badgeBg = "#f3f4f6", badgeColor = "#374151";
  if (mode === "train")  { badge = "Best Eco";    badgeBg = "#dcfce7"; badgeColor = "#2d7a4f"; }
  if (mode === "bus")    { badge = "Best Value";  badgeBg = "#eff6ff"; badgeColor = "#1d4ed8"; }
  if (mode === "flight") { badge = "Highest CO₂"; badgeBg = "#fef2f2"; badgeColor = "#dc2626"; }
  const fromCoords = _CITY_COORDS[from];
  const toCoords   = _CITY_COORDS[to];
  return {
    id:        `showcase-${i}`,
    from, to, distanceKm,
    /* Pre-resolved coords bypass Geocoding API in renderRouteMap */
    fromPlace: fromCoords ? { ...fromCoords, name: from } : null,
    toPlace:   toCoords   ? { ...toCoords,   name: to   } : null,
    type:      mode,
    Icon:      _IMAP[mode] ?? Train,
    company:   operator.toUpperCase(),
    title:     typeLabel,
    departure,
    arrival:   _addTime(departure, duration),
    duration,
    stops:     "Direct",
    price,
    emissions: co2,
    ecoScore:  score,
    ecoLabel:  score >= 75 ? "Eco-Friendly" : score >= 40 ? "Moderate Carbon" : "Very High Carbon",
    ecoColor:  score >= 75 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626",
    highlight: mode === "train",
    badge, badgeBg, badgeColor,
    amenities: _getAmenities(mode),
    rating:    _getDefaultRating(mode),
    reviews:   _getDefaultReviews(mode),
  };
});

/* ─────────────────────────────────────────
   AI CARBON PANEL — Gemini-powered insights
   Shown only when user came from home search
   and Gemini has returned carbon_insights.
───────────────────────────────────────── */
function AICarbonPanel({ aiData, from, to, travelers }) {
  const insights = aiData?.carbon_insights;
  if (!insights && !aiData?.options?.some((o) => o.fun_fact)) return null;

  const treesSaved = insights?.trees_saved    ?? Math.round((insights?.co2_saved_kg ?? 0) / 22);
  const co2SavedKg = insights?.co2_saved_kg   ?? 0;
  const carKmEquiv = insights?.car_km_equivalent ?? Math.round(co2SavedKg / 0.171);

  return (
    <div style={{
      borderRadius: "1.25rem",
      overflow: "hidden",
      marginBottom: "1.5rem",
      boxShadow: "0 4px 24px rgba(45,122,79,0.15)",
      border: "1px solid #bbf7d0",
    }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1a3a2a 0%, #2d7a4f 100%)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        flexWrap: "wrap",
      }}>
        <Sparkles style={{ width: "1.1rem", height: "1.1rem", color: "#86efac", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", fontWeight: 700, fontFamily: "'Inter',sans-serif", margin: 0 }}>
            GEMINI AI · CARBON EFFICIENCY ANALYSIS
          </p>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif", margin: "0.15rem 0 0" }}>
            {from} → {to}{travelers > 1 ? ` · ${travelers} travellers` : ""}
          </p>
        </div>
        <span style={{
          padding: "0.3rem 0.875rem",
          borderRadius: "9999px",
          background: "rgba(255,255,255,0.15)",
          color: "#bbf7d0",
          fontSize: "0.72rem",
          fontWeight: 700,
          fontFamily: "'Inter',sans-serif",
          border: "1px solid rgba(255,255,255,0.22)",
          whiteSpace: "nowrap",
        }}>
          ✦ Powered by GPT-4o mini
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ background: "#fff", padding: "1.5rem" }}>

        {/* Headline */}
        {insights?.headline && (
          <p style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "#1a2e1a",
            marginBottom: "1.25rem",
            fontFamily: "'Inter',sans-serif",
            lineHeight: 1.5,
          }}>
            💡 {insights.headline}
          </p>
        )}

        {/* 3-stat grid: trees / kg CO₂ / car km */}
        {(treesSaved > 0 || co2SavedKg > 0 || carKmEquiv > 0) && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}>
            {[
              { emoji: "🌳", value: treesSaved,   unit: "trees",   label: "CO₂ equivalent",   sub: "saved vs flying · per person", color: "#16a34a" },
              { emoji: "🌿", value: co2SavedKg,   unit: "kg CO₂", label: "avoided per person", sub: "by choosing train",             color: "#15803d" },
              { emoji: "🚗", value: carKmEquiv,   unit: "km",     label: "car journey equiv.", sub: "not driven this trip",          color: "#166534" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "#f0fdf4",
                borderRadius: "1rem",
                padding: "1.125rem",
                border: "1px solid #bbf7d0",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "1.75rem", lineHeight: 1 }}>{s.emoji}</div>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: "'Inter',sans-serif", margin: "0.375rem 0 0" }}>
                  {s.value}
                </p>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", margin: "0.25rem 0 0", fontFamily: "'Inter',sans-serif" }}>
                  {s.unit}
                </p>
                <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: "0.2rem 0 0", fontFamily: "'Inter',sans-serif", lineHeight: 1.4 }}>
                  {s.label}
                </p>
                <p style={{ fontSize: "0.68rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Gemini comparison sentence */}
        {insights?.comparison_sentence && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            padding: "0.875rem 1.125rem",
            background: "#e8f5ee",
            borderRadius: "0.875rem",
            border: "1px solid #bbf7d0",
            marginBottom: aiData?.options?.some((o) => o.fun_fact) ? "1.25rem" : 0,
          }}>
            <Leaf style={{ width: "1rem", height: "1rem", color: "#2d7a4f", flexShrink: 0, marginTop: "0.1rem" }} />
            <p style={{ fontSize: "0.875rem", color: "#166534", fontFamily: "'Inter',sans-serif", lineHeight: 1.6, margin: 0 }}>
              {insights.comparison_sentence}
            </p>
          </div>
        )}

        {/* Per-mode Gemini fun facts */}
        {aiData?.options?.some((o) => o.fun_fact) && (
          <div>
            <p style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: "0.1em",
              margin: "0 0 0.75rem",
              fontFamily: "'Inter',sans-serif",
            }}>
              PER-MODE GEMINI INSIGHTS
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
              {aiData.options.filter((o) => o.fun_fact).map((o) => {
                const modeIcon  = { train: "🚄", bus: "🚌", car: "🚗", carpool: "🚗", flight: "✈️" }[o.id] ?? "🚆";
                const modeColor = { train: "#2d7a4f", bus: "#b45309", car: "#16a34a", carpool: "#16a34a", flight: "#dc2626" }[o.id] ?? "#6b7280";
                const modeBg    = { train: "#f0fdf4", bus: "#fffbeb", car: "#f0fdf4", carpool: "#f0fdf4",  flight: "#fef2f2"  }[o.id] ?? "#f8faf8";
                const modeBorder= { train: "#bbf7d0", bus: "#fde68a", car: "#bbf7d0", carpool: "#bbf7d0",  flight: "#fecaca"  }[o.id] ?? "#e5e7eb";
                return (
                  <div key={o.id} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.625rem",
                    padding: "0.875rem",
                    background: modeBg,
                    borderRadius: "0.875rem",
                    border: `1px solid ${modeBorder}`,
                  }}>
                    <span style={{ fontSize: "1.3rem", flexShrink: 0, lineHeight: 1 }}>{modeIcon}</span>
                    <div>
                      <p style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: modeColor,
                        margin: "0 0 0.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontFamily: "'Inter',sans-serif",
                      }}>
                        {o.type ?? o.id}
                      </p>
                      <p style={{
                        fontSize: "0.8rem",
                        color: "#374151",
                        lineHeight: 1.5,
                        fontFamily: "'Inter',sans-serif",
                        margin: 0,
                      }}>
                        {o.fun_fact}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   BOOKING MODAL
───────────────────────────────────────── */
function BookingModal({ card, trip, onClose, onConfirm }) {
  if (!card) return null;
  const { Icon } = card;
  const travelers  = trip.travelers ?? 2;
  const totalPrice = card.price * travelers;
  const flightCO2  = card.type === "flight" ? card.emissions : null;
  const savings    = flightCO2 ? null : Math.max(0, (card.emissions / 0.255 * 0.255 * 255 - card.emissions)).toFixed(1);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "1.5rem",
          width: "100%",
          maxWidth: "36rem",
          boxShadow: "0 24px 64px rgba(0,0,0,0.24)",
          overflow: "hidden",
          fontFamily: "'Inter',sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#1a3a2a,#2d7a4f)",
          padding: "1.5rem 1.75rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.25rem" }}>
              CONFIRM BOOKING
            </p>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
              {card.from ?? trip.from ?? "Origin"} → {card.to ?? trip.to ?? "Destination"}
            </h2>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>
              {travelers} Traveller{travelers > 1 ? "s" : ""}
              {trip.departure ? ` · ${new Date(trip.departure).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "2.25rem", height: "2.25rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X style={{ width: "1.1rem", height: "1.1rem", color: "#fff" }} />
          </button>
        </div>

        {/* Transport summary */}
        <div style={{ padding: "1.5rem 1.75rem", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: "3.25rem", height: "3.25rem", borderRadius: "1rem",
              background: card.highlight ? "#dcfce7" : "#f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon style={{ width: "1.5rem", height: "1.5rem", color: card.highlight ? "#2d7a4f" : "#6b7280" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em" }}>{card.company}</p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "#1a2e1a" }}>{card.title}</p>
            </div>
            {card.badge && (
              <span style={{
                padding: "0.25rem 0.75rem", borderRadius: "9999px",
                background: card.badgeBg, color: card.badgeColor,
                fontSize: "0.72rem", fontWeight: 700,
              }}>
                {card.badge === "Best Eco" ? "★ " : ""}{card.badge}
              </span>
            )}
          </div>

          {/* Times row */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem",
            marginTop: "1.25rem", background: "#f8faf8", borderRadius: "1rem", padding: "1rem 1.25rem",
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a2e1a", lineHeight: 1 }}>{card.departure}</p>
              <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "0.2rem" }}>Departs</p>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>{card.duration}</p>
              <div style={{ width: "100%", height: "2px", background: "linear-gradient(90deg,#bbf7d0,#2d7a4f,#bbf7d0)", borderRadius: "9999px" }} />
              <p style={{ fontSize: "0.68rem", color: "#9ca3af" }}>Direct</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a2e1a", lineHeight: 1 }}>{card.arrival}</p>
              <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "0.2rem" }}>Arrives</p>
            </div>
          </div>
        </div>

        {/* Eco + Price breakdown */}
        <div style={{ padding: "1.25rem 1.75rem", display: "flex", gap: "1rem", borderBottom: "1px solid #f3f4f6" }}>
          {/* Eco */}
          <div style={{ flex: 1, background: "#f0fdf4", borderRadius: "1rem", padding: "1rem", border: "1px solid #bbf7d0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <Leaf style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#166534" }}>Carbon Impact</span>
            </div>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>
              {card.emissions} <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>kg CO₂</span>
            </p>
            <p style={{ fontSize: "0.7rem", color: "#15803d", marginTop: "0.25rem" }}>per person</p>
            <div style={{ marginTop: "0.5rem" }}>
              <EcoScoreBar score={card.ecoScore} ecoLabel={card.ecoLabel} ecoColor={card.ecoColor} />
            </div>
          </div>
          {/* Price */}
          <div style={{ flex: 1, background: "#f8faf8", borderRadius: "1rem", padding: "1rem", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <Shield style={{ width: "0.9rem", height: "0.9rem", color: "#6b7280" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4b5563" }}>Price Summary</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>£{card.price} × {travelers} person{travelers > 1 ? "s" : ""}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1a2e1a", lineHeight: 1, marginTop: "0.25rem" }}>
              £{totalPrice}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>total for your group</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "1.25rem 1.75rem", display: "flex", gap: "0.875rem" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "0.875rem", borderRadius: "0.875rem",
              border: "2px solid #e5e7eb", background: "transparent",
              color: "#4b5563", fontSize: "0.9rem", fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2, padding: "0.875rem", borderRadius: "0.875rem",
              border: "none", background: "linear-gradient(135deg,#2d7a4f,#4aab74)",
              color: "#fff", fontSize: "0.9rem", fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "0.5rem",
              boxShadow: "0 4px 14px rgba(45,122,79,0.35)",
            }}
          >
            <CheckCircle2 style={{ width: "1.1rem", height: "1.1rem" }} />
            Confirm & Browse Activities
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Loading skeleton card ── */
function SkeletonCard() {
  return (
    <div style={{ borderRadius: "1.25rem", background: "#fff", padding: "1.5rem", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: i === 2 ? "1rem" : "0.75rem", borderRadius: "0.5rem", marginBottom: "0.75rem", background: "linear-gradient(90deg,#f0f0f0 25%,#e0e8e0 50%,#f0f0f0 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s infinite" }} />
      ))}
    </div>
  );
}

export function PlanTripPage() {
  const navigate    = useNavigate();
  const { state }   = useLocation();
  const { trip, updateTrip, selectTransport, setAiAnalysis } = useTrip();

  /* True only when the user arrived via the search form */
  const hasRoute = !!(state?.from && state?.to);

  /* Prefer router state → TripContext → sensible defaults */
  const from       = state?.from       ?? trip.from       ?? "London";
  const to         = state?.to         ?? trip.to         ?? "Paris";
  const distanceKm = state?.distanceKm ?? trip.distanceKm ?? 340;
  const travelers  = state?.travelers  ?? trip.travelers  ?? 2;
  const departure  = state?.departure  ?? trip.departure  ?? "";
  const fromPlace  = state?.fromPlace  ?? trip.fromPlace  ?? null;
  const toPlace    = state?.toPlace    ?? trip.toPlace    ?? null;

  /* Route-aware operators */
  const routeOps = useMemo(
    () => getRouteOperators(from, to, distanceKm),
    [from, to, distanceKm]
  );

  /* AI analysis state */
  const [aiData,    setAiData]    = useState(trip.aiAnalysis ?? null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState("");

  /* Fetch OpenRouter analysis on mount (once per route) */
  useEffect(() => {
    if (aiData || !from || !to) return;
    setAiLoading(true);
    setAiError("");
    analyzeRoute({ from, to, distanceKm, travelers })
      .then((result) => {
        setAiData(result);
        setAiAnalysis(result);
      })
      .catch((err) => {
        if (err.message === "OPENAI_KEY_MISSING") {
          setAiError("key_missing");
        } else {
          setAiError(err.message);
        }
      })
      .finally(() => setAiLoading(false));
  }, [from, to, distanceKm, travelers]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Build base options — apply route-aware operators */
  const BASE_OPTIONS = useMemo(() => {
    const opts = buildTransportOptions(distanceKm, travelers);
    return opts.map((o) => {
      const op = routeOps[o.mode];
      if (!op) return o;
      return { ...o, operator: op.operator, type: op.type };
    });
  }, [distanceKm, travelers, routeOps]);

  /* Merge AI data into base options when available.
     AI returns ids: "train" | "bus" | "car" | "flight"
     BASE_OPTIONS modes: "train" | "bus" | "car" | "flight"      */
  const TRANSPORT_OPTIONS_REAL = useMemo(() => {
    if (!aiData?.options) return BASE_OPTIONS;
    return BASE_OPTIONS.map((base) => {
      /* match AI option by mode OR by option id (handles carpool ↔ car alias) */
      const ai = aiData.options.find(
        (o) => o.id === base.mode || o.id === base.id || (base.id === "carpool" && o.id === "car")
      );
      if (!ai) return base;
      return {
        ...base,
        co2:      ai.co2_per_person      ?? base.co2,
        score:    ai.eco_score           ?? base.score,
        price:    ai.price_per_person_gbp ?? base.price,
        duration: ai.duration_display    ?? base.duration,
        badge:    ai.badge !== undefined  ? ai.badge : base.badge,
        funFact:  ai.fun_fact            ?? "",
        operator: ai.operator            ?? base.operator,
        type:     ai.type                ?? base.type,
      };
    });
  }, [BASE_OPTIONS, aiData]);

  /* Carbon chart bars */
  const CARBON_BARS_REAL = useMemo(() => {
    const icons  = { train: "🚄", bus: "🚌", car: "🚗", flight: "✈️" };
    const labels = { train: "High-Speed Train", bus: "Coach Bus", car: "Carpool", flight: "Economy Flight" };
    const colors = { train: "#10b981", bus: "#f59e0b", car: "#22c55e", flight: "#ef4444" };
    const max = TRANSPORT_OPTIONS_REAL.find(o => o.mode === "flight")?.co2 ?? 90;
    return [...TRANSPORT_OPTIONS_REAL]
      .sort((a, b) => b.co2 - a.co2)
      .map(o => ({ label: `${icons[o.mode]} ${labels[o.mode]}`, value: o.co2, max, color: colors[o.mode] }));
  }, [TRANSPORT_OPTIONS_REAL]);

  const trainOpt  = TRANSPORT_OPTIONS_REAL.find(o => o.mode === "train");
  const flightOpt = TRANSPORT_OPTIONS_REAL.find(o => o.mode === "flight");
  const savedKg   = flightOpt && trainOpt ? +(flightOpt.co2 - trainOpt.co2).toFixed(1) : 84.8;
  const ecoTip = !hasRoute
    ? "Trains emit up to 98% less CO₂ per person than flying. Across these 35 routes, choosing rail over air saves an average of 200 kg CO₂ per journey — equivalent to planting 9 trees."
    : (aiData?.eco_tip
        ?? `Taking the train saves ${savedKg} kg CO₂ — ${co2Equivalence(savedKg)} or driving ${Math.round(savedKg / 0.171)} km less.`);

  const [activeFilter,  setActiveFilter]  = useState("all");
  const [selectedId,    setSelectedId]    = useState(trip.selectedTransport?.id ?? null);
  const [bookingCard,   setBookingCard]   = useState(null); // modal state

  /* Map raw option → card model — one per scheduled timeslot */
  const toCardModel = useCallback((o, idx = 0) => {
    const scheds = SCHEDULES[o.mode] ?? [{ dep: "08:00", arr: "—" }];
    const sched  = scheds[idx % scheds.length];
    const slotId = `${o.id}-${idx}`;
    return {
      id:          slotId,
      _modeId:     o.id,
      /* Stamp the user's actual origin/destination so the route label and
         map render correctly for user-entered routes from the home form */
      from,
      to,
      distanceKm,
      fromPlace,
      toPlace,
      type:        o.mode,
      Icon:        { train: Train, bus: Bus, car: Car, flight: Plane }[o.mode] ?? Train,
      company:     o.operator.toUpperCase(),
      title:       o.type,
      departure:   sched.dep,
      arrival:     sched.arr,
      duration:    o.duration,
      stops:       "Direct",
      price:       o.price,
      emissions:   o.co2,
      ecoScore:    o.score,
      ecoLabel:    o.score >= 75 ? "Eco-Friendly" : o.score >= 40 ? "Moderate Carbon" : "Very High Carbon",
      ecoColor:    o.score >= 75 ? "#16a34a" : o.score >= 40 ? "#d97706" : "#dc2626",
      highlight:   o.highlight,
      badge:       o.badge,
      badgeBg:     o.badge === "Best Eco" ? "#dcfce7" : o.badge === "Best Value" ? "#eff6ff" : o.badge === "Highest CO₂" ? "#fef2f2" : "#f5f3ff",
      badgeColor:  o.badgeColor,
      amenities:   getAmenities(o.mode),
      rating:      getDefaultRating(o.mode),
      reviews:     getDefaultReviews(o.mode),
      funFact:     o.funFact ?? "",
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Card list logic:
     - No route → show all 35 showcase cards
     - Route matches showcase data (case-insensitive) → show those filtered cards
     - Route not in showcase → generate from transport options (any distance works) */
  const allCards = useMemo(() => {
    if (!hasRoute) return SHOWCASE_CARDS;
    const fn = from.trim().toLowerCase();
    const tn = to.trim().toLowerCase();
    const matched = SHOWCASE_CARDS.filter(
      (c) => c.from.toLowerCase() === fn && c.to.toLowerCase() === tn
    );
    if (matched.length > 0) return matched;
    return TRANSPORT_OPTIONS_REAL.flatMap((o) =>
      (SCHEDULES[o.mode] ?? [{ dep: "08:00", arr: "—" }]).map((_, i) => toCardModel(o, i))
    );
  }, [hasRoute, from, to, TRANSPORT_OPTIONS_REAL, toCardModel]);

  /* Sort by active filter */
  const sorted = useMemo(() => {
    const copy = [...allCards];
    if (activeFilter === "cheapest") return copy.sort((a, b) => a.price - b.price);
    if (activeFilter === "fastest") {
      const toMins = (d) => { const m = d.match(/(\d+)h\s*(\d+)m/); return m ? +m[1] * 60 + +m[2] : 999; };
      return copy.sort((a, b) => toMins(a.duration) - toMins(b.duration));
    }
    if (activeFilter === "greenest") return copy.sort((a, b) => b.ecoScore - a.ecoScore);
    return copy;
  }, [allCards, activeFilter]);

  /* Open booking modal */
  const handleSelect = useCallback((id) => {
    const card = allCards.find(o => o.id === id);
    if (card) setBookingCard(card);
  }, [allCards]);

  /* Confirm booking → save to context → go to activities.
     For showcase cards, use the card's own city pair & distance. */
  const handleConfirmBooking = useCallback(() => {
    if (!bookingCard) return;
    setSelectedId(bookingCard.id);
    selectTransport(bookingCard);
    updateTrip({
      from:        bookingCard.from        ?? from,
      to:          bookingCard.to          ?? to,
      distanceKm:  bookingCard.distanceKm  ?? distanceKm,
      travelers,
    });
    setBookingCard(null);
    navigate("/activities");
  }, [bookingCard, selectTransport, updateTrip, to, from, distanceKm, travelers, navigate]);

  const selectedCard = sorted.find(o => o.id === selectedId);

  function getAmenities(mode) {
    return {
      train:  ["Wi-Fi", "Dining Car", "Power Sockets", "Luggage Storage"],
      bus:    ["Wi-Fi", "USB Charging", "Reclining Seats"],
      car:    ["Shared Ride", "Music Shared", "Luggage Space"],
      flight: ["Onboard Snacks", "Hand Luggage", "Online Check-in"],
    }[mode] ?? [];
  }
  function getDefaultRating(mode)  { return { train: 4.8, bus: 4.3, car: 4.6, flight: 3.9 }[mode] ?? 4.0; }
  function getDefaultReviews(mode) { return { train: 2841, bus: 5120, car: 987, flight: 14322 }[mode] ?? 1000; }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>

      {/* ══════════════════════════════════════
          DARK GREEN HEADER
         ══════════════════════════════════════ */}
      <div
        style={{
          paddingTop: "68px",          /* clear fixed navbar */
          background: "linear-gradient(135deg, #1a3a2a 0%, #2d7a4f 100%)",
        }}
      >
        <div
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "2rem 2rem 2.25rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.25rem",
          }}
        >
          {/* Left — route + title */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
              <MapPin style={{ width: "0.875rem", height: "0.875rem", color: "rgba(255,255,255,0.65)" }} />
              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                {hasRoute ? (
                  <>
                    {from} → {to}
                    {travelers ? ` · ${travelers} Traveller${travelers > 1 ? "s" : ""}` : ""}
                    {departure ? ` · ${new Date(departure).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
                    {distanceKm ? ` · ${Math.round(distanceKm).toLocaleString()} km` : ""}
                  </>
                ) : (
                  "35 Popular European Routes · Real Prices & CO₂"
                )}
              </p>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "clamp(1.75rem,3.5vw,2.5rem)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.15,
            }}>
              {hasRoute ? "Choose Your Journey" : "Explore Popular Routes"}
            </h1>
          </div>

          {/* Right — CO₂ badge + Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.875rem",
              background: "rgba(255,255,255,0.14)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              fontFamily: "'Inter',sans-serif",
              border: "1px solid rgba(255,255,255,0.18)",
            }}>
              <Wind style={{ width: "1rem", height: "1rem" }} />
              Avg flight: {flightOpt?.co2 ?? "89"} kg CO₂
            </div>
            <button style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.875rem",
              background: "#fff",
              color: "#2d7a4f",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontFamily: "'Inter',sans-serif",
            }}>
              <SlidersHorizontal style={{ width: "1rem", height: "1rem" }} />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CONTENT AREA
         ══════════════════════════════════════ */}
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 2rem 4rem" }}>

        {/* ── Filter Tabs ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}>
          {FILTERS.map(({ key, label }) => {
            const active = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "0.875rem",
                  border: "none",
                  background: active ? "#2d7a4f" : "#fff",
                  color: active ? "#fff" : "#4b5563",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  boxShadow: active
                    ? "0 4px 14px rgba(45,122,79,0.28)"
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  fontFamily: "'Inter',sans-serif",
                  transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}

          {/* Options count */}
          <div style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.875rem",
            color: "#6b7280",
            fontFamily: "'Inter',sans-serif",
          }}>
            <Filter style={{ width: "1rem", height: "1rem" }} />
            {sorted.length} option{sorted.length !== 1 ? "s" : ""} found
          </div>
        </div>

        {/* ── "No route" prompt when navigating directly ── */}
        {!hasRoute && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
            padding: "1rem 1.25rem",
            borderRadius: "1rem",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            marginBottom: "1.5rem",
          }}>
            <span style={{ fontSize: "1.25rem" }}>🗺️</span>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#92400e", fontFamily: "'Inter',sans-serif", margin: "0 0 0.2rem" }}>
                Browsing 35 popular European routes with real distances, prices & CO₂
              </p>
              <p style={{ fontSize: "0.8rem", color: "#b45309", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                Go to <a href="/" style={{ color: "#2d7a4f", fontWeight: 600 }}>Home</a> and enter your own FROM / TO to see options tailored to your exact journey.
              </p>
            </div>
          </div>
        )}

        {/* ── Eco Tip Banner ── */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.875rem",
          padding: "1rem 1.25rem",
          borderRadius: "1rem",
          background: "#e8f5ee",
          border: "1px solid #bbf7d0",
          marginBottom: "1.5rem",
        }}>
          <Leaf style={{ width: "1.25rem", height: "1.25rem", color: "#2d7a4f", flexShrink: 0, marginTop: "0.1rem" }} />
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#166534", marginBottom: "0.25rem", fontFamily: "'Inter',sans-serif" }}>
              💡 Eco Tip: Take the train instead of flying
            </p>
            <p style={{ fontSize: "0.875rem", color: "#15803d", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 }}>
              {ecoTip}
            </p>
          </div>
        </div>

        {/* ── AI Analysis Banner (only for user-entered routes) ── */}
        {aiLoading && hasRoute && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.25rem", borderRadius: "1rem", background: "linear-gradient(135deg,#e8f5ee,#f0fdf4)", border: "1px solid #bbf7d0", marginBottom: "1.25rem" }}>
            <Loader2 style={{ width: "1.1rem", height: "1.1rem", color: "#2d7a4f", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.875rem", color: "#166534", fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
              OpenAI is analysing your route for real-time carbon data…
            </span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {aiData && !aiLoading && hasRoute && (
          <AICarbonPanel
            aiData={aiData}
            from={from}
            to={to}
            travelers={travelers}
          />
        )}
        {aiError === "key_missing" && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.875rem", background: "#fff7ed", border: "1px solid #fed7aa", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.8rem", color: "#92400e", fontFamily: "'Inter',sans-serif", margin: 0 }}>
              ⚠️ Add your <code>VITE_OPENAI_API_KEY</code> to <code>.env</code> to enable AI-powered carbon analysis. Using calculated estimates for now.
            </p>
          </div>
        )}

        {/* ── Transport Cards (each has "View Route Map" button inside) ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem" }}>
          {aiLoading && hasRoute
            ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
            : sorted.map((opt) => (
              <TransportCard
                key={opt.id}
                option={opt}
                isSelected={selectedId === opt.id}
                onSelect={handleSelect}
              />
            ))
          }
        </div>

        {/* ── Selected transport banner ── */}
        {selectedCard && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", padding: "1rem 1.5rem", borderRadius: "1rem", background: "linear-gradient(135deg,#1a3a2a,#2d7a4f)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem", color: "#4aab74", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", fontFamily: "'Inter',sans-serif", marginBottom: "0.1rem" }}>Booking confirmed</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif" }}>
                  {selectedCard.company} {selectedCard.title} · {selectedCard.departure} → {selectedCard.arrival} · {selectedCard.emissions} kg CO₂/person
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/activities")}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.25rem", borderRadius: "0.875rem", border: "none", background: "#fff", color: "#2d7a4f", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap" }}
            >
              Browse Activities <ArrowRight style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>
        )}

        {/* ── Booking Modal ── */}
        <BookingModal
          card={bookingCard}
          trip={{ from, to, travelers, departure }}
          onClose={() => setBookingCard(null)}
          onConfirm={handleConfirmBooking}
        />

        {/* ── Carbon Emissions Comparison ── */}
        <div style={{
          background: "#fff",
          borderRadius: "1.25rem",
          padding: "1.75rem 2rem",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          marginBottom: "2.5rem",
        }}>
          <h3 style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#1a2e1a",
            marginBottom: "1.5rem",
            fontFamily: "'Inter',sans-serif",
          }}>
            Carbon Emissions Comparison
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {CARBON_BARS_REAL.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{
                  fontSize: "0.875rem",
                  color: "#4b5563",
                  fontWeight: 500,
                  fontFamily: "'Inter',sans-serif",
                  width: "10rem",
                  flexShrink: 0,
                }}>
                  {item.label}
                </span>
                <div style={{ flex: 1, height: "0.75rem", borderRadius: "9999px", background: "#f3f4f6", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    borderRadius: "9999px",
                    width: `${(item.value / item.max) * 100}%`,
                    background: item.color,
                    transition: "width 0.7s ease",
                  }} />
                </div>
                <span style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#374151",
                  fontFamily: "'Inter',sans-serif",
                  width: "6rem",
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {item.value} kg CO₂
                </span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: "1.25rem", fontSize: "0.75rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
            * Per person, one-way journey. Based on average load factors and fuel efficiency data.
          </p>
        </div>

        {/* ── Browse Activities / Continue CTA ── */}
        <div style={{ textAlign: "center" }}>
          {selectedId ? (
            <>
              <button
                onClick={() => navigate("/activities")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "1rem 2.5rem",
                  borderRadius: "9999px",
                  border: "none",
                  background: "#2d7a4f",
                  color: "#fff",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Inter',sans-serif",
                  boxShadow: "0 8px 25px rgba(45,122,79,0.35)",
                  transition: "transform 0.15s, opacity 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem" }} />
                Continue to Activities
                <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
              <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                Selected: {selectedCard?.company} {selectedCard?.title}
              </p>
            </>
          ) : (
            <button
              onClick={() => navigate("/activities")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "1rem 2.5rem",
                borderRadius: "9999px",
                border: "none",
                background: "#2d7a4f",
                color: "#fff",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                boxShadow: "0 8px 25px rgba(45,122,79,0.35)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              Browse Activities
              <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
