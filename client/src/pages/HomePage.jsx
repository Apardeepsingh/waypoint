import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Calendar, Users, DollarSign,
  Leaf, Wind, Zap, ArrowRight, ChevronDown,
  TreePine, Globe, Shield,
} from "lucide-react";
import { loadGoogleMaps } from "../services/googleMaps";
import logoImg from "../assets/Untitled_Artwork.png";
import { haversineKm } from "../utils/carbon";
import { useTrip } from "../context/TripContext";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1581869145044-5b35d5a53430?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMHRyYXZlbCUyMGFlcmlhbCUyMHZpZXd8ZW58MXx8fHwxNzcyODA2NTUzfDA&ixlib=rb-4.1.0&q=80&w=1920";

const POPULAR_DESTINATIONS = [
  { name: "Kyoto",      country: "Japan",       eco: 92, tag: "Culture & Nature",  color: "#e8f5ee" },
  { name: "Reykjavik",  country: "Iceland",     eco: 95, tag: "Geothermal Energy", color: "#e8f0ff" },
  { name: "Copenhagen", country: "Denmark",     eco: 98, tag: "Green Capital",     color: "#fff3e8" },
  { name: "Queenstown", country: "New Zealand", eco: 88, tag: "Eco Adventures",    color: "#e8f9f5" },
];

const STATS = [
  { value: "2.4M+", label: "Eco Trips Planned",    icon: <Globe  className="w-6 h-6" /> },
  { value: "186K",  label: "Tonnes CO₂ Saved",     icon: <Leaf   className="w-6 h-6" /> },
  { value: "95%",   label: "Traveller Satisfaction",icon: <Shield className="w-6 h-6" /> },
  { value: "340+",  label: "Green Destinations",   icon: <TreePine className="w-6 h-6" /> },
];

const FEATURES = [
  {
    icon: <DollarSign className="w-7 h-7" />,
    title: "Real-Time Cost Estimation",
    description: "Compare flights, trains, buses, and carpools with live pricing so you know exactly what your trip will cost before you book.",
    color: "#4aab74", bg: "#e8f5ee", tag: "Budget Smart",
  },
  {
    icon: <Wind className="w-7 h-7" />,
    title: "Carbon Footprint Tracking",
    description: "Every option shows estimated CO₂ emissions, compared to the average trip. Understand your environmental impact at a glance.",
    color: "#2d7a4f", bg: "#f0fdf4", tag: "Eco Aware",
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: "Sustainable Suggestions",
    description: "We proactively suggest greener alternatives — like taking a scenic train instead of a short-haul flight — to reduce your impact.",
    color: "#1a7a5a", bg: "#ecfdf5", tag: "Green First",
  },
];

/* ─── Shared input style ───────────────────────────────────────── */
const inputBase = {
  background: "#f8faf8",
  border: "1.5px solid #e5e7eb",
  color: "#1f2937",
  fontSize: "0.9rem",
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  width: "100%",
};
function onFocusGreen(e)  { e.target.style.borderColor = "#4aab74"; }
function onBlurGrey(e)    { e.target.style.borderColor = "#e5e7eb"; }

/* ─── Places Autocomplete Input ─────────────────────────────────
   Attaches Google Places Autocomplete to a plain <input>.
   Calls onPlaceSelect({ name, address, lat, lng }) when user picks.
─────────────────────────────────────────────────────────────── */
function PlaceAutocompleteInput({ placeholder, value, onTextChange, onPlaceSelect }) {
  const inputRef = useRef(null);
  const acRef    = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((google) => {
      if (cancelled || !inputRef.current || acRef.current) return;
      const ac = new google.maps.places.Autocomplete(inputRef.current, {
        types:  ["(cities)"],
        fields: ["name", "formatted_address", "geometry", "place_id"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place?.geometry) {
          const obj = {
            name:    place.name,
            address: place.formatted_address,
            lat:     place.geometry.location.lat(),
            lng:     place.geometry.location.lng(),
          };
          onTextChange(place.name);
          onPlaceSelect(obj);
        }
      });
      acRef.current = ac;
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => { onTextChange(e.target.value); onPlaceSelect(null); }}
      onFocus={onFocusGreen}
      onBlur={onBlurGrey}
      style={{
        ...inputBase,
        paddingLeft: "2.5rem", paddingRight: "1rem",
        paddingTop: "0.875rem", paddingBottom: "0.875rem",
        borderRadius: "0.875rem", boxSizing: "border-box",
      }}
      autoComplete="off"
    />
  );
}

export function HomePage() {
  const navigate    = useNavigate();
  const { updateTrip } = useTrip();

  const [form, setForm] = useState({
    from: "", to: "",
    departure: "", returnDate: "",
    budget: 2000, travelers: 2,
  });
  const [budgetDisplay, setBudgetDisplay] = useState(2000);

  /* Selected place objects from Google Places */
  const [fromPlace, setFromPlace] = useState(null);
  const [toPlace,   setToPlace]   = useState(null);

  const budgetPct = ((budgetDisplay - 200) / 9800) * 100;

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from || !form.to) return;
    setSubmitting(true);

    let fp = fromPlace;
    let tp = toPlace;

    /* ── Geocode fallback: if user typed but never clicked an autocomplete
       suggestion, resolve coordinates from the plain text ── */
    if (!fp || !tp) {
      try {
        const google   = await loadGoogleMaps();
        const geocoder = new google.maps.Geocoder();
        const geocodeText = (address) =>
          new Promise((res) =>
            geocoder.geocode({ address }, (results, status) => {
              if (status === "OK" && results[0]) {
                const loc = results[0].geometry.location;
                res({
                  name:    results[0].address_components[0]?.long_name ?? address,
                  address: results[0].formatted_address,
                  lat:     loc.lat(),
                  lng:     loc.lng(),
                });
              } else {
                res(null);
              }
            })
          );
        if (!fp) fp = await geocodeText(form.from);
        if (!tp) tp = await geocodeText(form.to);
      } catch { /* ignore — will fall back to null distance */ }
    }

    const distanceKm = (fp && tp)
      ? Math.round(haversineKm(fp.lat, fp.lng, tp.lat, tp.lng))
      : null;

    const tripData = {
      from:       form.from,
      to:         form.to,
      fromPlace:  fp,
      toPlace:    tp,
      distanceKm,
      departure:  form.departure,
      returnDate: form.returnDate,
      travelers:  form.travelers,
      budget:     budgetDisplay,
    };

    updateTrip(tripData);
    setSubmitting(false);
    navigate("/plan-trip", { state: tripData });
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════
          HERO  — full-viewport, background behind navbar
          ═══════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Background image — covers entire viewport incl. behind navbar */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <img
            src={HERO_IMAGE}
            alt="Scenic mountain landscape"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(160deg, rgba(10,30,15,0.74) 0%, rgba(20,50,30,0.56) 50%, rgba(0,0,0,0.44) 100%)",
            }}
          />
        </div>

        {/* Eco particles — clipped to hero bounds */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                position: "absolute",
                borderRadius: "50%",
                opacity: 0.2,
                width: `${20 + i * 15}px`,
                height: `${20 + i * 15}px`,
                background: "rgba(74,171,116,0.6)",
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Content — pt-20 to clear fixed navbar, z above particles */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: "80rem",       /* 7xl */
            margin: "0 auto",
            padding: "5rem 1.5rem 3rem",
          }}
        >
          {/* ── Hero text block ── */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            {/* Eco pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                background: "rgba(74,171,116,0.2)",
                border: "1px solid rgba(74,171,116,0.4)",
                marginBottom: "1.5rem",
              }}
            >
              <Leaf style={{ width: "1rem", height: "1rem", color: "#86efac" }} />
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "rgba(187,247,208,0.95)",
                  letterSpacing: "0.01em",
                }}
              >
                Travel consciously. Explore responsibly.
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2.6rem, 6.5vw, 5rem)",
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#ffffff",
                marginBottom: "1.25rem",
              }}
            >
              Plan Your{" "}
              <span style={{ color: "#4aab74" }}>Sustainable</span>
              <br />
              Dream Journey
            </h1>

            {/* Subtitle — explicit center alignment */}
            <p
              style={{
                textAlign: "center",
                fontSize: "1.1rem",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.82)",
                maxWidth: "38rem",
                margin: "0 auto",
              }}
            >
              Discover the world's most beautiful destinations while tracking your
              carbon footprint and making eco-conscious travel choices every step of the way.
            </p>
          </div>

          {/* ── Search Form Card ── */}
          <div
            style={{
              maxWidth: "68rem",
              margin: "0 auto",
              borderRadius: "1.5rem",
              padding: "2rem 2.5rem",
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 70px rgba(0,0,0,0.28)",
            }}
          >
            <form onSubmit={handleSubmit}>
              {/* Row 1 — FROM / TO */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                {/* FROM */}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", color: "#6b7280", marginBottom: "0.4rem", fontFamily: "'Inter', sans-serif" }}>
                    FROM
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#2d7a4f", pointerEvents: "none", zIndex: 1 }} />
                    <PlaceAutocompleteInput
                      placeholder="Departure city or airport"
                      value={form.from}
                      onTextChange={(v) => setForm((f) => ({ ...f, from: v }))}
                      onPlaceSelect={setFromPlace}
                    />
                  </div>
                </div>

                {/* TO */}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", color: "#6b7280", marginBottom: "0.4rem", fontFamily: "'Inter', sans-serif" }}>
                    TO
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#2d7a4f", pointerEvents: "none", zIndex: 1 }} />
                    <PlaceAutocompleteInput
                      placeholder="Where do you want to go?"
                      value={form.to}
                      onTextChange={(v) => setForm((f) => ({ ...f, to: v }))}
                      onPlaceSelect={setToPlace}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2 — DEPARTURE / RETURN / TRAVELLERS / BUDGET */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                {/* DEPARTURE */}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", color: "#6b7280", marginBottom: "0.4rem", fontFamily: "'Inter', sans-serif" }}>
                    DEPARTURE
                  </label>
                  <div style={{ position: "relative" }}>
                    <Calendar style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#2d7a4f", pointerEvents: "none" }} />
                    <input
                      type="date"
                      value={form.departure}
                      onChange={(e) => setForm({ ...form, departure: e.target.value })}
                      onFocus={onFocusGreen}
                      onBlur={onBlurGrey}
                      style={{ ...inputBase, paddingLeft: "2.5rem", paddingRight: "0.75rem", paddingTop: "0.875rem", paddingBottom: "0.875rem", borderRadius: "0.875rem" }}
                    />
                  </div>
                </div>

                {/* RETURN */}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", color: "#6b7280", marginBottom: "0.4rem", fontFamily: "'Inter', sans-serif" }}>
                    RETURN
                  </label>
                  <div style={{ position: "relative" }}>
                    <Calendar style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#2d7a4f", pointerEvents: "none" }} />
                    <input
                      type="date"
                      value={form.returnDate}
                      onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                      onFocus={onFocusGreen}
                      onBlur={onBlurGrey}
                      style={{ ...inputBase, paddingLeft: "2.5rem", paddingRight: "0.75rem", paddingTop: "0.875rem", paddingBottom: "0.875rem", borderRadius: "0.875rem" }}
                    />
                  </div>
                </div>

                {/* TRAVELLERS */}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", color: "#6b7280", marginBottom: "0.4rem", fontFamily: "'Inter', sans-serif" }}>
                    TRAVELLERS
                  </label>
                  <div style={{ position: "relative" }}>
                    <Users style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#2d7a4f", pointerEvents: "none" }} />
                    <ChevronDown style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#9ca3af", pointerEvents: "none" }} />
                    <select
                      value={form.travelers}
                      onChange={(e) => setForm({ ...form, travelers: Number(e.target.value) })}
                      onFocus={onFocusGreen}
                      onBlur={onBlurGrey}
                      style={{
                        ...inputBase,
                        paddingLeft: "2.5rem",
                        paddingRight: "2rem",
                        paddingTop: "0.875rem",
                        paddingBottom: "0.875rem",
                        borderRadius: "0.875rem",
                        appearance: "none",
                        WebkitAppearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      {[1,2,3,4,5,6,7,8].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? "Person" : "People"}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* BUDGET */}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", color: "#6b7280", marginBottom: "0.4rem", fontFamily: "'Inter', sans-serif" }}>
                    BUDGET: ${budgetDisplay.toLocaleString()}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.5rem" }}>
                    <DollarSign style={{ width: "1rem", height: "1rem", flexShrink: 0, color: "#2d7a4f" }} />
                    <input
                      type="range"
                      min={200}
                      max={10000}
                      step={100}
                      value={budgetDisplay}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setBudgetDisplay(v);
                        setForm({ ...form, budget: v });
                      }}
                      style={{
                        flex: 1,
                        background: `linear-gradient(to right, #2d7a4f ${budgetPct}%, #e5e7eb ${budgetPct}%)`,
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                    <span>$200</span>
                    <span>$10k+</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "0.875rem",
                  border: "none",
                  background: "linear-gradient(135deg, #2d7a4f 0%, #4aab74 100%)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(45,122,79,0.35)",
                  transition: "opacity 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "scale(1.01)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                {submitting ? (
                  <>
                    <svg style={{ width: "1.2rem", height: "1.2rem", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                    Locating cities…
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </>
                ) : (
                  <>
                    <Leaf style={{ width: "1.2rem", height: "1.2rem" }} />
                    Plan My Sustainable Trip
                    <ArrowRight style={{ width: "1.2rem", height: "1.2rem" }} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Scroll hint */}
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <div className="animate-bounce" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", color: "rgba(255,255,255,0.55)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>Explore more</span>
              <ChevronDown style={{ width: "1.25rem", height: "1.25rem" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS STRIP
          ═══════════════════════════════════════════════ */}
      <section style={{ padding: "3.5rem 1.5rem", background: "linear-gradient(135deg, #2d7a4f, #4aab74)" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1.5rem",
              textAlign: "center",
              color: "#fff",
            }}
          >
            {STATS.map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ opacity: 0.8 }}>{s.icon}</div>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.875rem", opacity: 0.82, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES — "How It Works"
          ═══════════════════════════════════════════════ */}
      <section style={{ padding: "5rem 1.5rem", background: "#f8faf8" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span
              style={{
                display: "inline-block",
                padding: "0.375rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: 600,
                background: "#e8f5ee",
                color: "#2d7a4f",
                marginBottom: "1rem",
              }}
            >
              How It Works
            </span>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 700,
                color: "#1a2e1a",
                marginBottom: "1rem",
              }}
            >
              Smart Travel, Lighter Footprint
            </h2>
            <p style={{ maxWidth: "36rem", margin: "0 auto", color: "#6b7280", lineHeight: 1.75, textAlign: "center" }}>
              WayPoint combines real-time pricing with carbon data to help you make informed,
              sustainable choices — without sacrificing the adventure.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#fff",
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  transition: "box-shadow 0.3s, transform 0.3s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div
                  style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: f.bg,
                    color: f.color,
                    marginBottom: "1.25rem",
                  }}
                >
                  {f.icon}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    background: f.bg,
                    color: f.color,
                    marginBottom: "0.75rem",
                  }}
                >
                  {f.tag}
                </span>
                <h3 style={{ color: "#1a2e1a", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.625rem" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "#6b7280" }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          POPULAR ECO DESTINATIONS
          ═══════════════════════════════════════════════ */}
      <section style={{ padding: "5rem 1.5rem", background: "#fff" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2.5rem" }}>
            <div>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.375rem 1rem",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  background: "#e8f5ee",
                  color: "#2d7a4f",
                  marginBottom: "0.75rem",
                }}
              >
                Popular Right Now
              </span>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  fontWeight: 700,
                  color: "#1a2e1a",
                }}
              >
                Top Eco Destinations
              </h2>
            </div>
            <button
              onClick={() => navigate("/plan-trip")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#2d7a4f",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "gap 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.gap = "0.625rem")}
              onMouseLeave={(e) => (e.currentTarget.style.gap = "0.375rem")}
            >
              View all destinations <ArrowRight style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            {POPULAR_DESTINATIONS.map((d) => (
              <div
                key={d.name}
                onClick={() => navigate("/plan-trip")}
                style={{
                  borderRadius: "1.5rem",
                  padding: "1.5rem",
                  background: d.color,
                  cursor: "pointer",
                  transition: "box-shadow 0.3s, transform 0.3s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <MapPin style={{ width: "1.25rem", height: "1.25rem", color: "#2d7a4f" }} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.25rem 0.625rem",
                      borderRadius: "9999px",
                      background: "rgba(255,255,255,0.82)",
                    }}
                  >
                    <Leaf style={{ width: "0.75rem", height: "0.75rem", color: "#2d7a4f" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d7a4f" }}>{d.eco}</span>
                  </div>
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.125rem" }}>{d.name}</h3>
                <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.75rem" }}>{d.country}</p>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.625rem",
                    borderRadius: "9999px",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    background: "rgba(255,255,255,0.72)",
                    color: "#374151",
                  }}
                >
                  {d.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA BANNER
          ═══════════════════════════════════════════════ */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div
          style={{
            maxWidth: "52rem",
            margin: "0 auto",
            borderRadius: "1.5rem",
            padding: "4rem",
            textAlign: "center",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #1a3a2a 0%, #2d7a4f 60%, #4aab74 100%)",
            boxShadow: "0 20px 60px rgba(45,122,79,0.3)",
          }}
        >
          <div style={{ position: "absolute", top: "-2.5rem", right: "-2.5rem", width: "12rem", height: "12rem", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: "-4rem", left: "-2.5rem", width: "14rem", height: "14rem", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <TreePine style={{ width: "3rem", height: "3rem", margin: "0 auto 1.25rem", opacity: 0.9 }} />
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              Ready to Travel Sustainably?
            </h2>
            <p style={{ textAlign: "center", fontSize: "0.95rem", lineHeight: 1.75, opacity: 0.85, maxWidth: "32rem", margin: "0 auto 2rem" }}>
              Join 2.4 million travellers who choose WayPoint to plan unforgettable journeys
              with a conscience. Your next adventure starts here.
            </p>
            <button
              onClick={() => navigate("/plan-trip")}
              style={{
                padding: "0.875rem 2.5rem",
                borderRadius: "0.875rem",
                border: "none",
                background: "#fff",
                color: "#2d7a4f",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                boxShadow: "0 8px 25px rgba(0,0,0,0.18)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Start Planning Now →
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════ */}
      <footer style={{ padding: "3rem 1.5rem", background: "#1a2e1a" }}>
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <img
              src={logoImg}
              alt="WayPoint"
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#fff", fontWeight: 700 }}>
              WayPoint
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
            © 2026 WayPoint. Helping travellers explore with care. 🌿
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.55)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Google Places Autocomplete dropdown polish ── */}
      <style>{`
        .pac-container {
          border-radius: 0.75rem !important;
          margin-top: 4px !important;
          border: 1.5px solid #e5e7eb !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.14) !important;
          font-family: 'Inter', sans-serif !important;
          overflow: hidden;
        }
        .pac-item {
          padding: 0.6rem 1rem !important;
          font-size: 0.875rem !important;
          cursor: pointer;
          border-top: 1px solid #f3f4f6 !important;
        }
        .pac-item:hover, .pac-item-selected {
          background: #f0fdf4 !important;
        }
        .pac-item-query { color: #1a2e1a !important; font-weight: 600; }
        .pac-matched    { color: #2d7a4f !important; }
        .pac-icon       { display: none !important; }
      `}</style>
    </>
  );
}
