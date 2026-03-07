import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf, Globe, TreePine, ArrowRight, CheckCircle2,
  ChevronDown, ChevronUp, Info, Plane, Train, Bus,
  Loader2, Sparkles,
} from "lucide-react";
import { useTrip } from "../context/TripContext";
import logoImg from "../assets/Untitled_Artwork.png";
import { getEcoTips, analyzeRoute, calculateCarbonRealtime } from "../services/openRouter";

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const SOLAR_IMAGE =
  "https://images.unsplash.com/photo-1614366502473-e54666693b44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1920";

const EMISSIONS_BY_MODE = [
  { mode: "Flight",       kg: 255, icon: "✈️", color: "#ef4444" },
  { mode: "Car (Petrol)", kg: 171, icon: "🚗", color: "#f97316" },
  { mode: "Car (EV)",     kg: 53,  icon: "⚡", color: "#fbbf24" },
  { mode: "Coach Bus",    kg: 27,  icon: "🚌", color: "#84cc16" },
  { mode: "Train",        kg: 14,  icon: "🚄", color: "#22c55e" },
  { mode: "Cycling",      kg: 0,   icon: "🚲", color: "#10b981" },
];

const METHODOLOGY = [
  {
    Icon: Plane,
    title: "Flight Emissions",
    steps: [
      "Distance calculated using great-circle routing",
      "Multiplied by ICAO emission factors",
      "Adjusted for average load factor (85%)",
      "Radiative forcing multiplier applied (×1.9)",
    ],
    iconColor: "#ef4444",
    iconBg: "#fef2f2",
  },
  {
    Icon: Train,
    title: "Rail Emissions",
    steps: [
      "Distance calculated per route",
      "Energy mix of national grid applied",
      "Efficiency factor per passenger-km used",
      "Updated quarterly from EEA data",
    ],
    iconColor: "#22c55e",
    iconBg: "#f0fdf4",
  },
  {
    Icon: Bus,
    title: "Road & Coach",
    steps: [
      "Route distance via mapping API",
      "Vehicle efficiency factor applied",
      "Fuel type (diesel/electric) considered",
      "Passenger count used for division",
    ],
    iconColor: "#f59e0b",
    iconBg: "#fffbeb",
  },
];

const FAQ = [
  {
    q: "How do we calculate carbon emissions?",
    a: "We use ICAO (International Civil Aviation Organization) methodology for flights, and the EEA (European Environment Agency) data for ground transport. Emissions account for fuel type, load factor, distance, and vehicle efficiency. We update our data quarterly to reflect the latest research.",
  },
  {
    q: "What makes an activity 'eco-certified'?",
    a: "Eco-certified activities meet strict criteria: they support local communities, minimise environmental impact, use sustainable materials, avoid single-use plastics, and are either carbon-neutral or actively carbon-negative. We partner only with verified third-party certification bodies.",
  },
  {
    q: "How do carbon offsets work?",
    a: "Carbon offsets fund verified projects that reduce CO₂ in the atmosphere, such as reforestation, renewable energy, or methane capture. While offsets don't eliminate your emissions, they counterbalance them. We only feature Gold Standard certified offset projects.",
  },
  {
    q: "Can I really make a difference by travelling sustainably?",
    a: "Absolutely. Tourism accounts for ~8% of global emissions. If all travellers chose lower-carbon transport and eco-friendly accommodation, global travel emissions could fall by up to 60%. Every choice matters — and WayPoint helps you make better ones.",
  },
  {
    q: "What is a carbon budget for a trip?",
    a: "A carbon budget is the maximum amount of CO₂ you're aiming to emit on a trip. The 2030 climate target suggests a personal annual carbon allowance of ~2.3 tonnes. A single return flight from London to New York emits about 1.7 tonnes — almost your entire allowance.",
  },
];

const ECO_TIPS = [
  { icon: "🚂", tip: "Take the train", detail: "Trains emit 6–10× less CO₂ than flights for the same route. Plus, they're often city-centre to city-centre." },
  { icon: "🌱", tip: "Choose eco-certified hotels", detail: "Green hotels use renewable energy, reduce waste, and source food locally — lowering your accommodation footprint by 30–60%." },
  { icon: "🍽️", tip: "Eat local and plant-based", detail: "Food accounts for ~20% of a trip's carbon. Choosing plant-based, seasonal, and local food can halve this." },
  { icon: "🎒", tip: "Pack light", detail: "Every extra 10 kg on a plane adds roughly 3 kg CO₂ per hour of flight. Pack only what you need." },
  { icon: "🚲", tip: "Walk, cycle, or use public transit", detail: "At your destination, choose human-powered or electric transport. Most cities have excellent cycle hire schemes." },
  { icon: "🏡", tip: "Stay longer, fly less", detail: "The biggest emissions come from getting there. Staying longer means your per-day footprint is much lower." },
];

const PLEDGES = [
  "Choose train over plane for trips under 700km",
  "Stay in eco-certified accommodation",
  "Offset all unavoidable flight emissions",
  "Avoid single-use plastics on trips",
  "Support local businesses and guides",
  "Pack lighter to reduce fuel consumption",
];

const TRAVEL_GROWTH = [
  { year: "2019", total: 1460, sustainable: 120 },
  { year: "2020", total: 380,  sustainable: 95  },
  { year: "2021", total: 810,  sustainable: 180 },
  { year: "2022", total: 1200, sustainable: 310 },
  { year: "2023", total: 1420, sustainable: 480 },
  { year: "2024", total: 1530, sustainable: 680 },
  { year: "2025", total: 1590, sustainable: 870 },
];

const GLOBAL_STATS = [
  { icon: "🌡️", title: "CLIMATE IMPACT",    value: "2.5°C", desc: "Projected warming from tourism alone if current trends continue unchecked.", color: "#ef4444", bg: "#fef2f2" },
  { icon: "✈️", title: "AVIATION EMISSIONS", value: "2.5%",  desc: "of global CO₂ come from aviation, but the sector is growing faster than any mitigation effort.", color: "#f97316", bg: "#fff7ed" },
  { icon: "🌿", title: "SUSTAINABLE TOURISM", value: "+47%", desc: "growth in eco-certified accommodation since 2020, driven by traveller demand.", color: "#22c55e", bg: "#f0fdf4" },
];

const TABS = [
  { id: "how",    label: "📊 How We Calculate" },
  { id: "tips",   label: "💡 Eco Travel Tips" },
  { id: "data",   label: "🌍 Global Data" },
  { id: "ai",     label: "✦ AI Carbon Analysis" },
  { id: "calc",   label: "⚡ Calculate with AI" },
];

const VEHICLE_OPTS = [
  { id: "car",       label: "Car",       emoji: "🚗" },
  { id: "bus",       label: "Bus",       emoji: "🚌" },
  { id: "train",     label: "Train",     emoji: "🚄" },
  { id: "flight",    label: "Flight",    emoji: "✈️" },
  { id: "motorbike", label: "Motorbike", emoji: "🏍️" },
];
const FUEL_OPTS = [
  { id: "petrol",   label: "Petrol / Diesel", emoji: "⛽" },
  { id: "electric", label: "Electric",        emoji: "⚡" },
  { id: "hybrid",   label: "Hybrid",          emoji: "🔋" },
];

const STATS = [
  { value: "8%",   label: "of global CO₂ comes from tourism",                    icon: "🌍" },
  { value: "90%",  label: "of travellers want sustainable options",               icon: "♻️" },
  { value: "60%",  label: "emissions saved by choosing train over flight",        icon: "🚄" },
  { value: "186K", label: "tonnes CO₂ saved by WayPoint users",                   icon: "🌿" },
];

/* ─────────────────────────────────────────
   SIMPLE AREA CHART (no recharts)
───────────────────────────────────────── */
function SimpleAreaChart({ data }) {
  const maxTotal = Math.max(...data.map((d) => d.total));
  const w = 700; const h = 200; const pad = { t: 20, b: 30, l: 40, r: 20 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;

  const toX = (i) => pad.l + (i / (data.length - 1)) * cw;
  const toY = (v) => pad.t + ch - (v / maxTotal) * ch;

  const totalPts  = data.map((d, i) => `${toX(i)},${toY(d.total)}`).join(" ");
  const sustPts   = data.map((d, i) => `${toX(i)},${toY(d.sustainable)}`).join(" ");
  const totalPoly = `${pad.l},${pad.t + ch} ${totalPts} ${pad.l + cw},${pad.t + ch}`;
  const sustPoly  = `${pad.l},${pad.t + ch} ${sustPts} ${pad.l + cw},${pad.t + ch}`;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "220px" }}>
        <defs>
          <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f3f4f6" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4aab74" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#dcfce7" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* grid lines */}
        {[0.25,0.5,0.75,1].map((f) => (
          <line key={f} x1={pad.l} y1={pad.t + ch * (1-f)} x2={pad.l+cw} y2={pad.t + ch * (1-f)} stroke="#f3f4f6" strokeWidth="1" />
        ))}
        {/* total area */}
        <polygon points={totalPoly} fill="url(#gt)" />
        <polyline points={totalPts} fill="none" stroke="#d1d5db" strokeWidth="1.5" />
        {/* sustainable area */}
        <polygon points={sustPoly} fill="url(#gs)" />
        <polyline points={sustPts} fill="none" stroke="#4aab74" strokeWidth="2" />
        {/* year labels */}
        {data.map((d, i) => (
          <text key={d.year} x={toX(i)} y={h - 8} textAnchor="middle" fontSize="11" fill="#9ca3af">{d.year}</text>
        ))}
        {/* dots */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.sustainable)} r="4" fill="#4aab74" stroke="#fff" strokeWidth="2" />
        ))}
        {/* legend */}
        <rect x={pad.l} y={6} width="12" height="12" fill="#d1d5db" rx="2" />
        <text x={pad.l + 16} y={16} fontSize="11" fill="#6b7280">Total Travel</text>
        <rect x={pad.l + 100} y={6} width="12" height="12" fill="#4aab74" rx="2" />
        <text x={pad.l + 116} y={16} fontSize="11" fill="#6b7280">Sustainable Travel</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
export function SustainabilityPage() {
  const navigate  = useNavigate();
  const { trip }  = useTrip();

  const [activeTab, setActiveTab] = useState("how");
  const [openFaq,   setOpenFaq]   = useState(null);

  /* AI-powered eco tips */
  const [aiTips,     setAiTips]     = useState(null);
  const [tipsLoading,setTipsLoading]= useState(false);

  /* AI Carbon Analysis tab */
  const [aiCarbon,       setAiCarbon]       = useState(null);
  const [carbonLoading,  setCarbonLoading]  = useState(false);
  const [carbonError,    setCarbonError]    = useState("");
  const [carbonFetched,  setCarbonFetched]  = useState(false);

  /* Real-time AI Calculator tab */
  const [calcInputs, setCalcInputs] = useState({
    distance: "", vehicle: "car", passengers: 1, fuelType: "petrol", instruction: "",
  });
  const [calcResult,  setCalcResult]  = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError,   setCalcError]   = useState("");

  /* Shared fetch function — callable on first open AND on retry */
  const fetchCarbonAnalysis = () => {
    setCarbonFetched(true);
    setCarbonLoading(true);
    setCarbonError("");
    setAiCarbon(null);
    const from       = trip.from       || "London";
    const to         = trip.to         || "Paris";
    const distanceKm = trip.distanceKm || 341;
    const travelers  = trip.travelers  || 2;
    analyzeRoute({ from, to, distanceKm, travelers })
      .then((res) => setAiCarbon(res))
      .catch((err) => {
        if (err.message === "OPENAI_KEY_MISSING") {
          setCarbonError("key_missing");
        } else {
          console.error("[OpenAI] analyzeRoute failed:", err.message);
          setCarbonError(err.message ?? "failed");
        }
      })
      .finally(() => setCarbonLoading(false));
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    // AI Carbon Analysis no longer auto-fetches — user must confirm via button
  };

  const runCalc = () => {
    const km  = parseFloat(calcInputs.distance);
    const pax = parseInt(calcInputs.passengers, 10);
    if (!km || km <= 0 || !pax || pax < 1) return;
    setCalcLoading(true);
    setCalcError("");
    setCalcResult(null);
    calculateCarbonRealtime({
      distanceKm:      km,
      vehicleType:     calcInputs.vehicle,
      passengers:      pax,
      fuelType:        calcInputs.fuelType,
      userInstruction: calcInputs.instruction.trim(),
    })
      .then(setCalcResult)
      .catch((err) => setCalcError(err.message ?? "failed"))
      .finally(() => setCalcLoading(false));
  };

  useEffect(() => {
    if (aiTips) return;
    setTipsLoading(true);
    getEcoTips({ from: trip.from, to: trip.to || "your destination", travelers: trip.travelers })
      .then((res) => setAiTips(res?.tips ?? null))
      .catch(() => setAiTips(null))
      .finally(() => setTipsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayTips = aiTips ?? ECO_TIPS.map(t => ({ icon: t.icon, title: t.tip, detail: t.detail, category: "general" }));

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>

      {/* ══════════════════════════════════════
          HERO  — full-width with solar image overlay
         ══════════════════════════════════════ */}
      <div style={{
        paddingTop: "68px",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0f2d1a 0%, #1a4f2a 50%, #2d7a4f 100%)",
      }}>
        {/* Solar panel background image at 20% opacity */}
        <img
          src={SOLAR_IMAGE}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.2, pointerEvents: "none",
          }}
        />

        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: "52rem", margin: "0 auto",
          padding: "4rem 2rem 4.5rem",
          textAlign: "center",
        }}>
          {/* Pill badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 1.25rem", borderRadius: "9999px", marginBottom: "1.75rem",
            background: "rgba(74,171,116,0.25)", border: "1px solid rgba(74,171,116,0.4)",
          }}>
            <Globe style={{ width: "1rem", height: "1rem", color: "#86efac" }} />
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#bbf7d0", fontFamily: "'Inter',sans-serif" }}>
              Sustainability at WayPoint
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(2.2rem,5vw,3.5rem)",
            fontWeight: 700,
            lineHeight: 1.18,
            color: "#fff",
            marginBottom: "1.5rem",
          }}>
            Travel That Gives<br />
            <span style={{ color: "#86efac" }}>Back to the Planet</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: "0.95rem",
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.8)",
            maxWidth: "36rem",
            margin: "0 auto",
            textAlign: "center",
            fontFamily: "'Inter',sans-serif",
          }}>
            We believe incredible journeys and a healthy planet aren't mutually exclusive.
            Here's how we calculate your carbon footprint, and how you can travel smarter.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          STATS STRIP — solid green
         ══════════════════════════════════════ */}
      <div style={{ background: "#2d7a4f", padding: "2.5rem 2rem" }}>
        <div style={{
          maxWidth: "72rem", margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          gap: "1rem", textAlign: "center", color: "#fff",
        }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ padding: "0.5rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.375rem" }}>{s.icon}</div>
              <div style={{
                fontSize: "clamp(1.75rem,3vw,2.5rem)", fontWeight: 800,
                fontFamily: "'Playfair Display',serif", lineHeight: 1,
                marginBottom: "0.375rem",
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: "0.75rem", opacity: 0.82,
                lineHeight: 1.4, fontFamily: "'Inter',sans-serif",
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB CONTENT
         ══════════════════════════════════════ */}
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2.5rem 2rem 4rem" }}>

        {/* Tab nav */}
        <div style={{
          display: "inline-flex",
          background: "#fff",
          borderRadius: "1rem",
          padding: "0.375rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          marginBottom: "2.5rem",
          gap: "0.25rem",
        }}>
          {TABS.map(({ id, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: active ? "#2d7a4f" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "'Inter',sans-serif",
                  boxShadow: active ? "0 4px 12px rgba(45,122,79,0.28)" : "none",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── HOW WE CALCULATE ── */}
        {activeTab === "how" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* 3 Methodology cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
              {METHODOLOGY.map(({ Icon, title, steps, iconColor, iconBg }) => (
                <div key={title} style={{
                  background: "#fff", borderRadius: "1.25rem", padding: "1.75rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                }}>
                  <div style={{
                    width: "3rem", height: "3rem", borderRadius: "0.875rem",
                    background: iconBg, color: iconColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "1.125rem",
                  }}>
                    <Icon style={{ width: "1.4rem", height: "1.4rem" }} />
                  </div>
                  <h3 style={{
                    fontWeight: 700, color: "#1a2e1a", marginBottom: "0.875rem",
                    fontSize: "1rem", fontFamily: "'Inter',sans-serif",
                  }}>
                    {title}
                  </h3>
                  <ul style={{ display: "flex", flexDirection: "column", gap: "0.625rem", listStyle: "none", padding: 0, margin: 0 }}>
                    {steps.map((step) => (
                      <li key={step} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <CheckCircle2 style={{
                          width: "0.9rem", height: "0.9rem", color: iconColor,
                          flexShrink: 0, marginTop: "0.1rem",
                        }} />
                        <span style={{ fontSize: "0.8rem", color: "#4b5563", lineHeight: 1.55, fontFamily: "'Inter',sans-serif" }}>
                          {step}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* CO₂ Emissions horizontal bar chart */}
            <div style={{
              background: "#fff", borderRadius: "1.25rem",
              padding: "1.75rem 2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}>
              <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1.05rem", marginBottom: "0.375rem", fontFamily: "'Inter',sans-serif" }}>
                CO₂ Emissions by Transport Mode
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.5rem", fontFamily: "'Inter',sans-serif" }}>
                Grams of CO₂ per passenger-kilometre (lower is better)
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {EMISSIONS_BY_MODE.map((m) => {
                  const pct = m.kg === 0 ? 3.5 : (m.kg / 255) * 100;
                  const label = m.kg === 0 ? "0 g" : `${m.kg} g CO₂/km`;
                  return (
                    <div key={m.mode} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      {/* Emoji icon */}
                      <span style={{ fontSize: "1.2rem", width: "1.75rem", textAlign: "center", flexShrink: 0 }}>
                        {m.icon}
                      </span>
                      {/* Mode name */}
                      <span style={{
                        fontSize: "0.875rem", fontWeight: 500,
                        color: "#4b5563", width: "7rem", flexShrink: 0,
                        fontFamily: "'Inter',sans-serif",
                      }}>
                        {m.mode}
                      </span>
                      {/* Bar track */}
                      <div style={{
                        flex: 1, height: "2.25rem", borderRadius: "0.625rem",
                        background: "#f3f4f6", overflow: "hidden", position: "relative",
                      }}>
                        <div style={{
                          height: "100%", borderRadius: "0.625rem",
                          width: `${pct}%`, background: m.color,
                          display: "flex", alignItems: "center", paddingLeft: "0.75rem",
                          minWidth: "3.5rem",
                          transition: "width 0.8s ease",
                        }}>
                          <span style={{
                            fontSize: "0.75rem", fontWeight: 700, color: "#fff",
                            whiteSpace: "nowrap", fontFamily: "'Inter',sans-serif",
                          }}>
                            {label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p style={{ marginTop: "1.25rem", fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                * Data based on European average. Actual figures vary by route, airline, and occupancy.
              </p>
            </div>

            {/* FAQ accordion */}
            <div style={{
              background: "#fff", borderRadius: "1.25rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden",
            }}>
              <div style={{
                padding: "1.125rem 1.75rem",
                borderBottom: "1px solid #e5e7eb",
              }}>
                <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1.05rem", fontFamily: "'Inter',sans-serif" }}>
                  Frequently Asked Questions
                </h3>
              </div>
              {FAQ.map((faq, idx) => (
                <div key={idx} style={{ borderBottom: idx < FAQ.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    style={{
                      width: "100%", padding: "1.125rem 1.75rem",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
                      background: openFaq === idx ? "#f8faf8" : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                      transition: "background 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>
                      {faq.q}
                    </span>
                    {openFaq === idx
                      ? <ChevronUp style={{ width: "1.1rem", height: "1.1rem", color: "#2d7a4f", flexShrink: 0 }} />
                      : <ChevronDown style={{ width: "1.1rem", height: "1.1rem", color: "#9ca3af", flexShrink: 0 }} />
                    }
                  </button>
                  {openFaq === idx && (
                    <div style={{ padding: "0 1.75rem 1.25rem" }}>
                      <p style={{ fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.7, fontFamily: "'Inter',sans-serif" }}>
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ECO TRAVEL TIPS ── */}
        {activeTab === "tips" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* AI source badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              {tipsLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", borderRadius: "9999px", background: "#e8f5ee", border: "1px solid #bbf7d0" }}>
                  <Loader2 style={{ width: "0.875rem", height: "0.875rem", color: "#2d7a4f", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "0.78rem", color: "#166534", fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Generating tips for {trip.to || "your destination"}…</span>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              )}
              {aiTips && !tipsLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "9999px", background: "#e8f5ee", border: "1px solid #bbf7d0" }}>
                  <Sparkles style={{ width: "0.75rem", height: "0.75rem", color: "#2d7a4f" }} />
                  <span style={{ fontSize: "0.72rem", color: "#166534", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                    AI-generated for {trip.to || "eco travel"} · GPT-4o mini
                  </span>
                </div>
              )}
            </div>

            {/* Tip cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
              {tipsLoading
                ? [1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ borderRadius: "1.25rem", background: "#fff", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                      {[1,2,3].map(j => <div key={j} style={{ height: j===1?"2rem":"0.75rem", borderRadius: "0.5rem", marginBottom: "0.75rem", background: "linear-gradient(90deg,#f0f0f0 25%,#e0e8e0 50%,#f0f0f0 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s infinite" }} />)}
                      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
                    </div>
                  ))
                : displayTips.map((tip, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff", borderRadius: "1.25rem", padding: "1.75rem",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    transition: "box-shadow 0.2s, transform 0.2s", cursor: "default",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "1rem" }}>{tip.icon ?? "🌿"}</span>
                  <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "0.5rem", fontFamily: "'Inter',sans-serif" }}>
                    {tip.title ?? tip.tip}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.7, fontFamily: "'Inter',sans-serif" }}>
                    {tip.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Traveller pledge banner */}
            <div style={{
              borderRadius: "1.25rem", padding: "2rem",
              background: "linear-gradient(135deg,#e8f5ee,#f0fdf4)",
              border: "2px solid #bbf7d0",
            }}>
              <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                <div style={{
                  width: "3rem", height: "3rem", borderRadius: "0.875rem",
                  background: "#2d7a4f", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <Leaf style={{ width: "1.4rem", height: "1.4rem", color: "#fff" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1.05rem", marginBottom: "0.375rem", fontFamily: "'Inter',sans-serif" }}>
                    Take the WayPoint Traveller Pledge
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif" }}>
                    Join 180,000+ travellers who've pledged to travel more sustainably this year.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1.5rem" }}>
                    {PLEDGES.map((p) => (
                      <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <CheckCircle2 style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f", flexShrink: 0, marginTop: "0.15rem" }} />
                        <span style={{ fontSize: "0.8rem", color: "#374151", fontFamily: "'Inter',sans-serif" }}>{p}</span>
                      </div>
                    ))}
                  </div>
                  <button style={{
                    padding: "0.75rem 1.5rem", borderRadius: "0.75rem", border: "none",
                    background: "linear-gradient(135deg,#2d7a4f,#4aab74)",
                    color: "#fff", fontSize: "0.875rem", fontWeight: 700,
                    cursor: "pointer", fontFamily: "'Inter',sans-serif",
                    transition: "opacity 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Take the Pledge 🌿
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── GLOBAL DATA ── */}
        {activeTab === "data" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Area chart card */}
            <div style={{
              background: "#fff", borderRadius: "1.25rem",
              padding: "1.75rem 2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}>
              <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1.05rem", marginBottom: "0.25rem", fontFamily: "'Inter',sans-serif" }}>
                Global Sustainable Travel Growth
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif" }}>
                Millions of international tourist arrivals (total vs sustainable trips)
              </p>
              <SimpleAreaChart data={TRAVEL_GROWTH} />
            </div>

            {/* 3 stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
              {GLOBAL_STATS.map((s) => (
                <div key={s.title} style={{
                  background: "#fff", borderRadius: "1.25rem", padding: "1.75rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                }}>
                  <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.875rem" }}>{s.icon}</span>
                  <p style={{ fontSize: "0.68rem", fontWeight: 700, color: s.color, letterSpacing: "0.06em", marginBottom: "0.375rem", fontFamily: "'Inter',sans-serif" }}>
                    {s.title}
                  </p>
                  <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1a2e1a", fontFamily: "'Playfair Display',serif", lineHeight: 1, marginBottom: "0.625rem" }}>
                    {s.value}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.65, fontFamily: "'Inter',sans-serif" }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Data sources note */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
              padding: "1rem 1.25rem", borderRadius: "0.875rem",
              background: "#f8faf8", border: "1px solid #e5e7eb",
            }}>
              <Info style={{ width: "1.1rem", height: "1.1rem", color: "#9ca3af", flexShrink: 0, marginTop: "0.1rem" }} />
              <p style={{ fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.65, fontFamily: "'Inter',sans-serif" }}>
                <strong style={{ color: "#4b5563" }}>Data sources:</strong> UNWTO, ICAO, European Environment Agency,
                IPCC AR6 (2022), Our World in Data. Carbon emission factors are updated quarterly and reflect
                the best available peer-reviewed science.
              </p>
            </div>
          </div>
        )}

        {/* ── AI CARBON ANALYSIS ── */}
        {activeTab === "ai" && (() => {
          const hasTrip = !!(trip.selectedTransport || (trip.to && trip.distanceKm));
          return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* ── STATE 1: No trip booked yet ── */}
            {!hasTrip && (
              <div style={{
                textAlign: "center", padding: "4rem 2rem",
                background: "#fff", borderRadius: "1.5rem",
                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                border: "1px solid #e5e7eb",
              }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🗺️</div>
                <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "0.5rem", fontFamily: "'Inter',sans-serif" }}>
                  No trip booked yet
                </p>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", fontFamily: "'Inter',sans-serif", marginBottom: "1.75rem", maxWidth: "28rem", margin: "0 auto 1.75rem", lineHeight: 1.65 }}>
                  Book a trip first — choose your route, travel mode, and number of passengers — then come back here for a full AI carbon analysis.
                </p>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.625rem",
                    padding: "0.875rem 2rem", borderRadius: "0.875rem",
                    border: "none", background: "linear-gradient(135deg,#1a3a2a,#2d7a4f)",
                    color: "#fff", fontSize: "0.925rem", fontWeight: 700,
                    cursor: "pointer", fontFamily: "'Inter',sans-serif",
                    boxShadow: "0 6px 20px rgba(45,122,79,0.28)",
                  }}
                >
                  <Leaf style={{ width: "1rem", height: "1rem" }} />
                  Plan a Trip First
                  <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                </button>
              </div>
            )}

            {/* ── STATE 2: Trip booked, waiting for user to start analysis ── */}
            {hasTrip && !carbonFetched && !carbonLoading && (
              <div style={{
                borderRadius: "1.5rem", overflow: "hidden",
                boxShadow: "0 8px 32px rgba(45,122,79,0.15)",
                border: "1px solid #bbf7d0",
              }}>
                {/* Header */}
                <div style={{
                  background: "linear-gradient(135deg,#0f2318,#1a3a2a,#2d7a4f)",
                  padding: "1.5rem 2rem",
                  display: "flex", alignItems: "center", gap: "1rem",
                }}>
                  <div style={{
                    width: "2.75rem", height: "2.75rem", borderRadius: "50%",
                    background: "rgba(134,239,172,0.15)", border: "1px solid rgba(134,239,172,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Sparkles style={{ width: "1.1rem", height: "1.1rem", color: "#86efac" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.62rem", color: "rgba(134,239,172,0.7)", letterSpacing: "0.14em", fontWeight: 700, fontFamily: "'Inter',sans-serif", margin: "0 0 0.2rem" }}>
                      ✦ AI CARBON EFFICIENCY ANALYSIS
                    </p>
                    <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                      Ready to analyse your booked trip
                    </p>
                  </div>
                </div>

                {/* Trip summary */}
                <div style={{ background: "#f8fdf9", padding: "1.5rem 2rem", borderBottom: "1px solid #e8f5ee" }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#2d7a4f", letterSpacing: "0.1em", margin: "0 0 1rem", fontFamily: "'Inter',sans-serif" }}>
                    YOUR TRIP DETAILS
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.875rem" }}>
                    {[
                      { emoji: "📍", label: "Route", value: trip.from && trip.to ? `${trip.from} → ${trip.to}` : trip.to || trip.from || "–" },
                      { emoji: "📏", label: "Distance", value: trip.distanceKm ? `~${trip.distanceKm} km` : "–" },
                      { emoji: "🚦", label: "Travel Mode", value: trip.selectedTransport ? (trip.selectedTransport.type || trip.selectedTransport.title || trip.selectedTransport.company || "Selected") : "Not selected yet" },
                      { emoji: "👥", label: "Passengers", value: `${trip.travelers ?? 2} ${(trip.travelers ?? 2) === 1 ? "person" : "persons"}` },
                    ].map((item) => (
                      <div key={item.label} style={{
                        background: "#fff", borderRadius: "0.875rem",
                        border: "1px solid #e8f5ee", padding: "0.875rem 1rem",
                        display: "flex", alignItems: "center", gap: "0.625rem",
                      }}>
                        <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{item.emoji}</span>
                        <div>
                          <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", margin: "0 0 0.1rem", fontFamily: "'Inter',sans-serif" }}>
                            {item.label.toUpperCase()}
                          </p>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ background: "#fff", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a2e1a", margin: "0 0 0.25rem", fontFamily: "'Inter',sans-serif" }}>
                      AI will calculate CO₂ savings, tree equivalents, and per-mode insights
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                      Powered by GPT-4o mini · takes ~5 seconds
                    </p>
                  </div>
                  <button
                    onClick={fetchCarbonAnalysis}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.625rem",
                      padding: "0.875rem 1.75rem", borderRadius: "0.875rem",
                      border: "none", background: "linear-gradient(135deg,#1a3a2a,#2d7a4f)",
                      color: "#fff", fontSize: "0.925rem", fontWeight: 700,
                      cursor: "pointer", fontFamily: "'Inter',sans-serif",
                      boxShadow: "0 6px 20px rgba(45,122,79,0.28)", whiteSpace: "nowrap",
                    }}
                  >
                    <Sparkles style={{ width: "1rem", height: "1rem" }} />
                    Start Carbon Analysis
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {carbonLoading && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "1.25rem",
                padding: "4rem 2rem", borderRadius: "1.25rem",
                background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              }}>
                <div style={{
                  width: "3.5rem", height: "3.5rem", borderRadius: "50%",
                  background: "linear-gradient(135deg,#1a3a2a,#2d7a4f)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "aiPulse 1.8s ease-in-out infinite",
                }}>
                  <Sparkles style={{ width: "1.4rem", height: "1.4rem", color: "#86efac" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "1rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.375rem", fontFamily: "'Inter',sans-serif" }}>
                    OpenAI is analysing your route…
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#6b7280", fontFamily: "'Inter',sans-serif" }}>
                    {trip.distanceKm ? `~${trip.distanceKm} km` : "your route"} · {trip.travelers ?? 2} {(trip.travelers ?? 2) === 1 ? "person" : "persons"} · calculating trees saved, CO₂ avoided & per-mode insights
                  </p>
                </div>
                <style>{`@keyframes aiPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.12);opacity:0.8}}`}</style>
              </div>
            )}

            {/* Error states */}
            {carbonError === "key_missing" && !carbonLoading && (
              <div style={{ padding: "1.25rem 1.5rem", borderRadius: "1rem", background: "#fff7ed", border: "1px solid #fed7aa" }}>
                <p style={{ fontSize: "0.875rem", color: "#92400e", fontFamily: "'Inter',sans-serif" }}>
                  ⚠️ Add your <code>VITE_OPENAI_API_KEY</code> to <code>.env</code> to enable AI-powered carbon analysis.
                </p>
              </div>
            )}
            {carbonError && carbonError !== "key_missing" && !carbonLoading && (
              <div style={{
                padding: "1.5rem",
                borderRadius: "1.25rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>⚠️</span>
                  <div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#991b1b", fontFamily: "'Inter',sans-serif", margin: "0 0 0.375rem" }}>
                      Could not reach OpenAI
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "#b91c1c", fontFamily: "'Inter',sans-serif", margin: 0, lineHeight: 1.5 }}>
                      {carbonError.startsWith("OpenAI")
                        ? `API error: ${carbonError}`
                        : carbonError.startsWith("AI_PARSE_ERROR")
                        ? "OpenAI returned an unexpected format. Retrying usually fixes this."
                        : "Network or API issue. Check your internet connection and try again."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchCarbonAnalysis}
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 1.25rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    background: "#2d7a4f",
                    color: "#fff",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter',sans-serif",
                  }}
                >
                  <Sparkles style={{ width: "0.875rem", height: "0.875rem" }} />
                  Retry with OpenAI
                </button>
              </div>
            )}

            {/* ── AI Carbon Analysis Main Panel ── */}
            {aiCarbon && !carbonLoading && (() => {
              const insights  = aiCarbon.carbon_insights;
              const options   = aiCarbon.options ?? [];
              const treesSaved = insights?.trees_saved ?? Math.round((insights?.co2_saved_kg ?? 0) / 22);
              const co2SavedKg = insights?.co2_saved_kg ?? 0;
              const carKmEquiv = insights?.car_km_equivalent ?? Math.round(co2SavedKg / 0.171);
              const savingPct  = insights?.saving_pct ?? 0;
              const maxCo2     = Math.max(...options.map(o => o.co2_per_person ?? 0), 1);

              const modeIcon   = { train: "🚄", bus: "🚌", car: "🚗", carpool: "🚗", flight: "✈️" };
              const modeColor  = { train: "#2d7a4f", bus: "#b45309", carpool: "#ca8a04", flight: "#dc2626" };
              const modeBg     = { train: "#f0fdf4", bus: "#fffbeb", carpool: "#fefce8", flight: "#fef2f2" };
              const modeBorder = { train: "#bbf7d0", bus: "#fde68a", carpool: "#fef08a", flight: "#fecaca" };
              const barColor   = (id) => ({ train: "#16a34a", bus: "#d97706", carpool: "#ca8a04", flight: "#ef4444" }[id] ?? "#6b7280");

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                  {/* ─── 1. AI VERDICT BANNER ─── */}
                  <div style={{
                    borderRadius: "1.5rem", overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(45,122,79,0.22)",
                    border: "1px solid rgba(134,239,172,0.3)",
                  }}>
                    <div style={{
                      background: "linear-gradient(135deg,#0f2318 0%,#1a3a2a 50%,#2d7a4f 100%)",
                      padding: "1.5rem 1.75rem",
                      display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap",
                    }}>
                      <div style={{
                        width: "3rem", height: "3rem", borderRadius: "50%",
                        background: "rgba(134,239,172,0.15)", border: "1px solid rgba(134,239,172,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Sparkles style={{ width: "1.2rem", height: "1.2rem", color: "#86efac" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.62rem", color: "rgba(134,239,172,0.7)", letterSpacing: "0.14em", fontWeight: 700, fontFamily: "'Inter',sans-serif", margin: "0 0 0.25rem" }}>
                          ✦ AI CARBON ANALYSIS REPORT · GPT-4o mini
                        </p>
                        <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif", margin: 0, lineHeight: 1.4 }}>
                          {trip.distanceKm ? `~${trip.distanceKm} km route` : "Multi-mode route"}
                          {` · ${trip.travelers ?? 2} ${(trip.travelers ?? 2) === 1 ? "person" : "persons"}`}
                          {trip.selectedTransport ? ` · ${trip.selectedTransport.type || trip.selectedTransport.title}` : ""}
                        </p>
                      </div>
                      {savingPct > 0 && (
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                          <p style={{ fontSize: "2.5rem", fontWeight: 900, color: "#86efac", lineHeight: 1, fontFamily: "'Inter',sans-serif", margin: 0 }}>
                            {savingPct}%
                          </p>
                          <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", fontFamily: "'Inter',sans-serif", margin: "0.2rem 0 0", whiteSpace: "nowrap" }}>
                            lower carbon vs {insights?.worst_mode || "flight"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AI-generated route summary quote */}
                    {(aiCarbon.route_summary || insights?.headline) && (
                      <div style={{
                        background: "#f8fdf9", padding: "1.125rem 1.75rem",
                        borderBottom: "1px solid #e8f5ee",
                        display: "flex", gap: "0.875rem", alignItems: "flex-start",
                      }}>
                        <span style={{ fontSize: "1.25rem", lineHeight: 1, flexShrink: 0, marginTop: "0.1rem" }}>💬</span>
                        <p style={{
                          fontSize: "0.9rem", color: "#1a3a2a", fontStyle: "italic",
                          lineHeight: 1.65, fontFamily: "'Playfair Display',serif", margin: 0,
                          borderLeft: "3px solid #2d7a4f", paddingLeft: "0.875rem",
                        }}>
                          "{aiCarbon.route_summary || insights?.headline}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ─── 2. IMPACT METRICS ─── */}
                  {(treesSaved > 0 || co2SavedKg > 0 || carKmEquiv > 0) && (
                    <div>
                      <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.12em", margin: "0 0 0.75rem", fontFamily: "'Inter',sans-serif" }}>
                        AI-CALCULATED IMPACT · BEST VS WORST MODE
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.875rem" }}>
                        {[
                          { emoji: "🌳", value: treesSaved, unit: "trees planted",   sub: "CO₂ equivalent saved", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                          { emoji: "🌿", value: co2SavedKg, unit: "kg CO₂ avoided", sub: `choosing ${insights?.best_mode || "eco mode"}`, color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
                          { emoji: "🚗", value: carKmEquiv, unit: "km not driven",   sub: "car journey equivalent", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
                        ].map((s, i) => (
                          <div key={i} style={{
                            background: s.bg, borderRadius: "1.25rem",
                            padding: "1.25rem 1rem", border: `1px solid ${s.border}`,
                            textAlign: "center", boxShadow: "0 2px 8px rgba(45,122,79,0.08)",
                          }}>
                            <div style={{ fontSize: "1.75rem", lineHeight: 1, marginBottom: "0.4rem" }}>{s.emoji}</div>
                            <p style={{ fontSize: "2rem", fontWeight: 900, color: s.color, lineHeight: 1, fontFamily: "'Inter',sans-serif", margin: 0 }}>
                              {s.value}
                            </p>
                            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#374151", margin: "0.3rem 0 0.15rem", fontFamily: "'Inter',sans-serif" }}>
                              {s.unit}
                            </p>
                            <p style={{ fontSize: "0.65rem", color: "#6b7280", fontFamily: "'Inter',sans-serif", margin: 0, lineHeight: 1.4 }}>
                              {s.sub}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ─── 3. CO₂ COMPARISON BAR CHART ─── */}
                  {options.length > 0 && (
                    <div style={{
                      background: "#fff", borderRadius: "1.25rem",
                      border: "1px solid #e5e7eb", padding: "1.5rem",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                        <Sparkles style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f" }} />
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.12em", margin: 0, fontFamily: "'Inter',sans-serif" }}>
                          AI-GENERATED CO₂ COMPARISON · KG PER PERSON
                        </p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                        {options.sort((a,b) => (a.co2_per_person ?? 0) - (b.co2_per_person ?? 0)).map((o) => {
                          const pct    = Math.max(4, Math.round(((o.co2_per_person ?? 0) / maxCo2) * 100));
                          const isBest = o.id === insights?.best_mode;
                          const color  = barColor(o.id);
                          return (
                            <div key={o.id}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.35rem" }}>
                                <span style={{ fontSize: "1.1rem", flexShrink: 0, width: "1.4rem", textAlign: "center" }}>
                                  {modeIcon[o.id] ?? "🚆"}
                                </span>
                                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1f2937", fontFamily: "'Inter',sans-serif", flex: 1 }}>
                                  {o.operator ? `${o.operator} · ` : ""}{o.type ?? o.id}
                                </span>
                                {isBest && (
                                  <span style={{
                                    fontSize: "0.6rem", fontWeight: 700, color: "#fff",
                                    background: "#16a34a", padding: "0.15rem 0.5rem",
                                    borderRadius: "9999px", fontFamily: "'Inter',sans-serif",
                                    letterSpacing: "0.04em",
                                  }}>
                                    ✓ AI BEST PICK
                                  </span>
                                )}
                                <span style={{ fontSize: "0.8rem", fontWeight: 700, color, fontFamily: "'Inter',sans-serif", minWidth: "4.5rem", textAlign: "right" }}>
                                  {o.co2_per_person ?? "–"} kg CO₂
                                </span>
                              </div>
                              <div style={{ height: "0.5rem", background: "#f3f4f6", borderRadius: "9999px", overflow: "hidden" }}>
                                <div style={{
                                  height: "100%", width: `${pct}%`,
                                  background: `linear-gradient(90deg, ${color}99, ${color})`,
                                  borderRadius: "9999px",
                                  transition: "width 1s ease",
                                }} />
                              </div>
                              {o.eco_label && (
                                <p style={{ fontSize: "0.63rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", margin: "0.2rem 0 0", paddingLeft: "2rem" }}>
                                  {o.eco_label}{o.duration_display ? ` · ${o.duration_display}` : ""}{o.price_per_person_gbp ? ` · ~£${o.price_per_person_gbp}/person` : ""}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ─── 4. AI COMPARISON INSIGHT ─── */}
                  {insights?.comparison_sentence && (
                    <div style={{
                      background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                      borderRadius: "1.25rem", border: "1px solid #bbf7d0",
                      padding: "1.25rem 1.5rem",
                      display: "flex", alignItems: "flex-start", gap: "0.875rem",
                      boxShadow: "0 2px 8px rgba(45,122,79,0.08)",
                    }}>
                      <div style={{
                        width: "2rem", height: "2rem", borderRadius: "50%",
                        background: "#2d7a4f", display: "flex", alignItems: "center",
                        justifyContent: "center", flexShrink: 0,
                      }}>
                        <Leaf style={{ width: "0.875rem", height: "0.875rem", color: "#fff" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#2d7a4f", letterSpacing: "0.1em", margin: "0 0 0.35rem", fontFamily: "'Inter',sans-serif" }}>
                          AI CARBON INSIGHT
                        </p>
                        <p style={{ fontSize: "0.9rem", color: "#166534", lineHeight: 1.7, fontFamily: "'Inter',sans-serif", margin: 0 }}>
                          {insights.comparison_sentence}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ─── 5. PER-MODE AI FUN FACTS ─── */}
                  {options.some(o => o.fun_fact) && (
                    <div style={{
                      background: "#fff", borderRadius: "1.25rem",
                      border: "1px solid #e5e7eb", padding: "1.5rem",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <Sparkles style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f" }} />
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.12em", margin: 0, fontFamily: "'Inter',sans-serif" }}>
                          PER-MODE AI INSIGHTS
                        </p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.875rem" }}>
                        {options.filter(o => o.fun_fact).map((o) => {
                          const color  = modeColor[o.id]  ?? "#6b7280";
                          const bg     = modeBg[o.id]     ?? "#f8faf8";
                          const border = modeBorder[o.id] ?? "#e5e7eb";
                          const score  = o.eco_score ?? 0;
                          const scorePct = `${score}%`;
                          const scoreColor = score >= 75 ? "#16a34a" : score >= 45 ? "#d97706" : "#dc2626";
                          return (
                            <div key={o.id} style={{
                              background: bg, borderRadius: "1rem",
                              border: `1px solid ${border}`, padding: "1rem",
                              display: "flex", flexDirection: "column", gap: "0.625rem",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{modeIcon[o.id] ?? "🚆"}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: "0.7rem", fontWeight: 700, color, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Inter',sans-serif" }}>
                                    {o.type ?? o.id}
                                  </p>
                                  {o.operator && (
                                    <p style={{ fontSize: "0.65rem", color: "#9ca3af", margin: 0, fontFamily: "'Inter',sans-serif" }}>{o.operator}</p>
                                  )}
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <p style={{ fontSize: "1.1rem", fontWeight: 900, color: scoreColor, lineHeight: 1, margin: 0, fontFamily: "'Inter',sans-serif" }}>
                                    {score}
                                  </p>
                                  <p style={{ fontSize: "0.55rem", color: "#9ca3af", margin: 0, fontFamily: "'Inter',sans-serif" }}>ECO SCORE</p>
                                </div>
                              </div>
                              {/* Eco score bar */}
                              <div style={{ height: "0.3rem", background: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: scorePct, background: scoreColor, borderRadius: "9999px" }} />
                              </div>
                              {/* AI fun fact */}
                              <p style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.55, fontFamily: "'Inter',sans-serif", margin: 0 }}>
                                {o.fun_fact}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ─── 6. AI ECO RECOMMENDATION ─── */}
                  {aiCarbon.eco_tip && (
                    <div style={{
                      borderRadius: "1.25rem", overflow: "hidden",
                      border: "1px solid #bbf7d0",
                      boxShadow: "0 4px 20px rgba(45,122,79,0.12)",
                    }}>
                      <div style={{
                        background: "linear-gradient(90deg,#1a3a2a,#2d7a4f)",
                        padding: "0.625rem 1.25rem",
                        display: "flex", alignItems: "center", gap: "0.5rem",
                      }}>
                        <Sparkles style={{ width: "0.75rem", height: "0.75rem", color: "#86efac" }} />
                        <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#86efac", letterSpacing: "0.12em", margin: 0, fontFamily: "'Inter',sans-serif" }}>
                          AI ECO RECOMMENDATION
                        </p>
                      </div>
                      <div style={{ background: "#f8fdf9", padding: "1.125rem 1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "1.25rem", lineHeight: 1, flexShrink: 0 }}>🌱</span>
                        <p style={{ fontSize: "0.9rem", color: "#166534", lineHeight: 1.7, fontFamily: "'Inter',sans-serif", margin: 0 }}>
                          {aiCarbon.eco_tip}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ─── 7. SAVINGS HEADLINE ─── */}
                  {aiCarbon.savings_headline && (
                    <div style={{
                      padding: "1.5rem 2rem", borderRadius: "1.25rem",
                      background: "linear-gradient(135deg,#1a3a2a,#2d7a4f)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                      boxShadow: "0 6px 24px rgba(45,122,79,0.3)",
                    }}>
                      <span style={{ fontSize: "1.5rem" }}>🌍</span>
                      <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", textAlign: "center", fontFamily: "'Playfair Display',serif", margin: 0, lineHeight: 1.45 }}>
                        {aiCarbon.savings_headline}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
          );
        })()}

        {/* ══════════════════════════════════════
            CALCULATE WITH AI TAB
           ══════════════════════════════════════ */}
        {activeTab === "calc" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* ── Header ── */}
            <div style={{
              borderRadius: "1.5rem", overflow: "hidden",
              boxShadow: "0 8px 32px rgba(45,122,79,0.2)",
            }}>
              <div style={{
                background: "linear-gradient(135deg,#0f2318 0%,#1a3a2a 55%,#2d7a4f 100%)",
                padding: "1.75rem 2rem",
                display: "flex", alignItems: "center", gap: "1.25rem",
              }}>
                <div style={{
                  width: "3rem", height: "3rem", borderRadius: "50%",
                  background: "rgba(134,239,172,0.15)", border: "1px solid rgba(134,239,172,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Sparkles style={{ width: "1.25rem", height: "1.25rem", color: "#86efac" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.62rem", color: "rgba(134,239,172,0.7)", letterSpacing: "0.14em", fontWeight: 700, fontFamily: "'Inter',sans-serif", margin: "0 0 0.25rem" }}>
                    ⚡ REAL-TIME AI CARBON CALCULATOR
                  </p>
                  <p style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                    Enter your journey details — AI calculates your exact footprint
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", fontFamily: "'Inter',sans-serif", margin: "0.2rem 0 0" }}>
                    Get your carbon rating, offset plan, and personalised reduction tips instantly
                  </p>
                </div>
              </div>
            </div>

            {/* ── Input Form ── */}
            <div style={{
              background: "#fff", borderRadius: "1.25rem",
              border: "1px solid #e5e7eb", padding: "1.75rem 2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}>

              {/* Row 1: Distance + Passengers */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>

                {/* Distance */}
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", letterSpacing: "0.07em", display: "block", marginBottom: "0.5rem", fontFamily: "'Inter',sans-serif" }}>
                    TOTAL DISTANCE (KM) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number" min="1" placeholder="e.g. 350"
                      value={calcInputs.distance}
                      onChange={(e) => setCalcInputs(p => ({ ...p, distance: e.target.value }))}
                      style={{
                        width: "100%", padding: "0.875rem 1rem 0.875rem 1rem",
                        borderRadius: "0.75rem", border: "2px solid #e5e7eb",
                        fontSize: "1rem", fontFamily: "'Inter',sans-serif", fontWeight: 600,
                        outline: "none", boxSizing: "border-box", color: "#1f2937",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#2d7a4f")}
                      onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                    />
                    <span style={{
                      position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)",
                      fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", fontFamily: "'Inter',sans-serif",
                    }}>km</span>
                  </div>
                </div>

                {/* Passengers */}
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", letterSpacing: "0.07em", display: "block", marginBottom: "0.5rem", fontFamily: "'Inter',sans-serif" }}>
                    PASSENGERS <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      onClick={() => setCalcInputs(p => ({ ...p, passengers: Math.max(1, p.passengers - 1) }))}
                      style={{
                        width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem",
                        border: "2px solid #e5e7eb", background: "#f9fafb",
                        fontSize: "1.25rem", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", color: "#374151",
                        flexShrink: 0,
                      }}
                    >−</button>
                    <div style={{
                      flex: 1, textAlign: "center", padding: "0.875rem",
                      borderRadius: "0.75rem", border: "2px solid #e5e7eb",
                      background: "#f9fafb",
                    }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1f2937", fontFamily: "'Inter',sans-serif" }}>
                        {calcInputs.passengers}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", display: "block", marginTop: "0.1rem" }}>
                        {calcInputs.passengers === 1 ? "person" : "people"}
                      </span>
                    </div>
                    <button
                      onClick={() => setCalcInputs(p => ({ ...p, passengers: Math.min(50, p.passengers + 1) }))}
                      style={{
                        width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem",
                        border: "2px solid #e5e7eb", background: "#f9fafb",
                        fontSize: "1.25rem", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", color: "#374151",
                        flexShrink: 0,
                      }}
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Vehicle Type */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", letterSpacing: "0.07em", display: "block", marginBottom: "0.625rem", fontFamily: "'Inter',sans-serif" }}>
                  VEHICLE TYPE <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                  {VEHICLE_OPTS.map((v) => {
                    const sel = calcInputs.vehicle === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setCalcInputs(p => ({ ...p, vehicle: v.id }))}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.5rem",
                          padding: "0.625rem 1rem", borderRadius: "0.875rem",
                          border: `2px solid ${sel ? "#2d7a4f" : "#e5e7eb"}`,
                          background: sel ? "#f0fdf4" : "#f9fafb",
                          cursor: "pointer", fontSize: "0.85rem", fontWeight: sel ? 700 : 500,
                          color: sel ? "#166534" : "#374151",
                          fontFamily: "'Inter',sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontSize: "1.1rem" }}>{v.emoji}</span>
                        {v.label}
                        {sel && <span style={{ fontSize: "0.65rem", color: "#16a34a", fontWeight: 700 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fuel Type */}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", letterSpacing: "0.07em", display: "block", marginBottom: "0.625rem", fontFamily: "'Inter',sans-serif" }}>
                  FUEL / ENERGY TYPE <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                  {FUEL_OPTS.map((f) => {
                    const sel = calcInputs.fuelType === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setCalcInputs(p => ({ ...p, fuelType: f.id }))}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.5rem",
                          padding: "0.625rem 1.25rem", borderRadius: "0.875rem",
                          border: `2px solid ${sel ? "#2d7a4f" : "#e5e7eb"}`,
                          background: sel ? "#f0fdf4" : "#f9fafb",
                          cursor: "pointer", fontSize: "0.85rem", fontWeight: sel ? 700 : 500,
                          color: sel ? "#166534" : "#374151",
                          fontFamily: "'Inter',sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontSize: "1rem" }}>{f.emoji}</span>
                        {f.label}
                        {sel && <span style={{ fontSize: "0.65rem", color: "#16a34a", fontWeight: 700 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional instruction */}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", letterSpacing: "0.07em", display: "block", marginBottom: "0.5rem", fontFamily: "'Inter',sans-serif" }}>
                  ASK AI ANYTHING <span style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 500, letterSpacing: 0 }}>(optional)</span>
                </label>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", fontFamily: "'Inter',sans-serif", margin: "0 0 0.5rem" }}>
                  e.g. "How can I reduce my carbon on this journey?" · "What eco alternatives exist?" · "How many solar panels would offset this?"
                </p>
                <textarea
                  rows={3}
                  placeholder="Type your instruction or question here…"
                  value={calcInputs.instruction}
                  onChange={(e) => setCalcInputs(p => ({ ...p, instruction: e.target.value }))}
                  style={{
                    width: "100%", padding: "0.875rem 1rem",
                    borderRadius: "0.875rem", border: "2px solid #e5e7eb",
                    fontSize: "0.875rem", fontFamily: "'Inter',sans-serif",
                    outline: "none", resize: "vertical", color: "#374151",
                    boxSizing: "border-box", lineHeight: 1.6,
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2d7a4f")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              {/* Calculate button */}
              <button
                onClick={runCalc}
                disabled={calcLoading || !calcInputs.distance || calcInputs.distance <= 0}
                style={{
                  width: "100%", padding: "1rem", borderRadius: "0.875rem",
                  border: "none",
                  background: calcLoading || !calcInputs.distance
                    ? "#d1fae5"
                    : "linear-gradient(135deg,#1a3a2a,#2d7a4f)",
                  color: calcLoading || !calcInputs.distance ? "#6b7280" : "#fff",
                  fontSize: "1rem", fontWeight: 700, cursor: calcLoading || !calcInputs.distance ? "not-allowed" : "pointer",
                  fontFamily: "'Inter',sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
                  boxShadow: calcLoading || !calcInputs.distance ? "none" : "0 6px 20px rgba(45,122,79,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {calcLoading ? (
                  <>
                    <Loader2 style={{ width: "1.1rem", height: "1.1rem", animation: "spin 1s linear infinite" }} />
                    AI is calculating your footprint…
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: "1.1rem", height: "1.1rem" }} />
                    Calculate Carbon Footprint with AI
                  </>
                )}
              </button>

              {calcError && (
                <p style={{ fontSize: "0.8rem", color: "#dc2626", fontFamily: "'Inter',sans-serif", margin: "0.75rem 0 0", textAlign: "center" }}>
                  ⚠️ {calcError.startsWith("OpenAI") ? `API error: ${calcError}` : "Something went wrong. Please try again."}
                </p>
              )}
            </div>

            {/* ── Results ── */}
            {calcResult && !calcLoading && (() => {
              const r      = calcResult;
              const rColor = r.rating === "eco" ? "#16a34a" : r.rating === "moderate" ? "#d97706" : "#dc2626";
              const rBg    = r.rating === "eco" ? "#f0fdf4" : r.rating === "moderate" ? "#fffbeb" : "#fef2f2";
              const rBorder= r.rating === "eco" ? "#bbf7d0" : r.rating === "moderate" ? "#fde68a" : "#fecaca";
              const rEmoji = r.rating === "eco" ? "🌿" : r.rating === "moderate" ? "⚡" : "🔴";
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                  {/* Rating hero */}
                  <div style={{
                    borderRadius: "1.5rem", overflow: "hidden",
                    boxShadow: `0 8px 32px ${rColor}33`,
                    border: `2px solid ${rBorder}`,
                  }}>
                    <div style={{
                      background: rBg, padding: "2rem",
                      textAlign: "center",
                      borderBottom: `1px solid ${rBorder}`,
                    }}>
                      <div style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: "0.5rem" }}>{rEmoji}</div>
                      <p style={{ fontSize: "1.75rem", fontWeight: 900, color: rColor, fontFamily: "'Inter',sans-serif", margin: "0 0 0.375rem" }}>
                        {r.rating_label}
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                        {r.rating_reason}
                      </p>
                    </div>

                    {/* CO₂ metrics row */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                      background: "#fff",
                    }}>
                      {[
                        { label: "Total CO₂",     value: `${r.total_co2_kg ?? "–"} kg`,     sub: "for this journey", emoji: "💨" },
                        { label: "Per Person",     value: `${r.co2_per_person_kg ?? "–"} kg`, sub: "per traveller",    emoji: "👤" },
                        { label: "Trees to Offset",value: `${r.trees_to_offset ?? "–"}`,      sub: "trees needed",     emoji: "🌳" },
                      ].map((m, i) => (
                        <div key={i} style={{
                          padding: "1.25rem 1rem", textAlign: "center",
                          borderRight: i < 2 ? `1px solid ${rBorder}` : "none",
                        }}>
                          <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{m.emoji}</div>
                          <p style={{ fontSize: "1.4rem", fontWeight: 900, color: rColor, fontFamily: "'Inter',sans-serif", margin: 0, lineHeight: 1 }}>
                            {m.value}
                          </p>
                          <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#374151", margin: "0.25rem 0 0.1rem", fontFamily: "'Inter',sans-serif" }}>
                            {m.label}
                          </p>
                          <p style={{ fontSize: "0.62rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                            {m.sub}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculation breakdown */}
                  {r.breakdown && (
                    <div style={{
                      background: "#f8fafc", borderRadius: "1rem",
                      border: "1px solid #e2e8f0", padding: "1rem 1.25rem",
                      display: "flex", gap: "0.75rem", alignItems: "flex-start",
                    }}>
                      <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>🧮</span>
                      <div>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", margin: "0 0 0.3rem", fontFamily: "'Inter',sans-serif" }}>
                          AI CALCULATION BREAKDOWN
                        </p>
                        <p style={{ fontSize: "0.85rem", color: "#374151", fontFamily: "'Courier New',monospace", margin: 0, lineHeight: 1.6 }}>
                          {r.breakdown}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Equivalent */}
                  {r.equivalent && (
                    <div style={{
                      background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                      borderRadius: "1rem", border: "1px solid #bbf7d0",
                      padding: "1rem 1.25rem", display: "flex", gap: "0.75rem", alignItems: "center",
                    }}>
                      <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>🔍</span>
                      <div>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#2d7a4f", letterSpacing: "0.1em", margin: "0 0 0.2rem", fontFamily: "'Inter',sans-serif" }}>
                          THAT'S EQUIVALENT TO
                        </p>
                        <p style={{ fontSize: "0.9rem", color: "#166534", fontFamily: "'Inter',sans-serif", fontWeight: 600, margin: 0 }}>
                          {r.equivalent}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Eco alternatives + tips in 2 col */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

                    {/* Eco alternatives */}
                    {r.eco_alternatives?.length > 0 && (
                      <div style={{
                        background: "#fff", borderRadius: "1rem",
                        border: "1px solid #bbf7d0", padding: "1.25rem",
                        boxShadow: "0 2px 8px rgba(45,122,79,0.06)",
                      }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.875rem" }}>
                          <span style={{ fontSize: "1rem" }}>🔄</span>
                          <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#2d7a4f", letterSpacing: "0.1em", margin: 0, fontFamily: "'Inter',sans-serif" }}>
                            ECO ALTERNATIVES
                          </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {r.eco_alternatives.map((a, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                              <span style={{ fontSize: "0.8rem", color: "#16a34a", flexShrink: 0, marginTop: "0.1rem", fontWeight: 700 }}>✓</span>
                              <p style={{ fontSize: "0.82rem", color: "#374151", fontFamily: "'Inter',sans-serif", margin: 0, lineHeight: 1.5 }}>{a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reduction tips */}
                    {r.reduction_tips?.length > 0 && (
                      <div style={{
                        background: "#fff", borderRadius: "1rem",
                        border: "1px solid #fde68a", padding: "1.25rem",
                        boxShadow: "0 2px 8px rgba(217,119,6,0.06)",
                      }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.875rem" }}>
                          <span style={{ fontSize: "1rem" }}>💡</span>
                          <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#b45309", letterSpacing: "0.1em", margin: 0, fontFamily: "'Inter',sans-serif" }}>
                            REDUCTION TIPS
                          </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {r.reduction_tips.map((t, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#d97706", flexShrink: 0, marginTop: "0.15rem", minWidth: "1rem" }}>{i + 1}.</span>
                              <p style={{ fontSize: "0.82rem", color: "#374151", fontFamily: "'Inter',sans-serif", margin: 0, lineHeight: 1.5 }}>{t}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI answer to user instruction */}
                  {r.user_answer && (
                    <div style={{
                      borderRadius: "1.25rem", overflow: "hidden",
                      border: "1px solid rgba(134,239,172,0.4)",
                      boxShadow: "0 4px 20px rgba(45,122,79,0.1)",
                    }}>
                      <div style={{
                        background: "linear-gradient(90deg,#1a3a2a,#2d7a4f)",
                        padding: "0.75rem 1.25rem",
                        display: "flex", alignItems: "center", gap: "0.5rem",
                      }}>
                        <Sparkles style={{ width: "0.875rem", height: "0.875rem", color: "#86efac" }} />
                        <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#86efac", letterSpacing: "0.12em", margin: 0, fontFamily: "'Inter',sans-serif" }}>
                          AI RESPONSE TO YOUR QUESTION
                        </p>
                      </div>
                      <div style={{
                        background: "#f8fdf9", padding: "1.25rem 1.5rem",
                        display: "flex", gap: "0.875rem", alignItems: "flex-start",
                      }}>
                        <div style={{
                          width: "2rem", height: "2rem", borderRadius: "50%",
                          background: "linear-gradient(135deg,#1a3a2a,#2d7a4f)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <Sparkles style={{ width: "0.875rem", height: "0.875rem", color: "#86efac" }} />
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "#166534", lineHeight: 1.7, fontFamily: "'Inter',sans-serif", margin: 0 }}>
                          {r.user_answer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recalculate button */}
                  <button
                    onClick={() => setCalcResult(null)}
                    style={{
                      alignSelf: "center", padding: "0.625rem 1.75rem",
                      borderRadius: "0.75rem", border: "2px solid #e5e7eb",
                      background: "#fff", color: "#374151",
                      fontSize: "0.875rem", fontWeight: 600,
                      cursor: "pointer", fontFamily: "'Inter',sans-serif",
                    }}
                  >
                    ← Edit Journey & Recalculate
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══════════════════════════════════════
            CTA BANNER
           ══════════════════════════════════════ */}
        <div style={{
          marginTop: "2.5rem",
          borderRadius: "1.5rem",
          padding: "3.5rem 2rem",
          textAlign: "center",
          background: "linear-gradient(135deg,#1a3a2a 0%,#2d7a4f 100%)",
          boxShadow: "0 20px 60px rgba(45,122,79,0.25)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* decorative circles */}
          <div style={{ position: "absolute", top: "-3rem", right: "-3rem", width: "12rem", height: "12rem", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: "-4rem", left: "-3rem", width: "14rem", height: "14rem", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <TreePine style={{ width: "3rem", height: "3rem", color: "#fff", opacity: 0.85, margin: "0 auto 1.25rem" }} />
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "clamp(1.6rem,3.5vw,2.2rem)", fontWeight: 700,
              color: "#fff", marginBottom: "0.75rem",
            }}>
              Start Your Sustainable Journey
            </h2>
            <p style={{
              fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.7,
              maxWidth: "32rem", margin: "0 auto 2rem", textAlign: "center",
              fontFamily: "'Inter',sans-serif",
            }}>
              Apply everything you've learned and plan a trip that's good for you — and the planet.
            </p>
            <button
              onClick={() => navigate("/")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.625rem",
                padding: "0.875rem 2.25rem", borderRadius: "0.875rem",
                border: "none", background: "#fff", color: "#2d7a4f",
                fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                boxShadow: "0 8px 25px rgba(0,0,0,0.18)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Leaf style={{ width: "1.1rem", height: "1.1rem" }} />
              Plan a Sustainable Trip
              <ArrowRight style={{ width: "1.1rem", height: "1.1rem" }} />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FOOTER
         ══════════════════════════════════════ */}
      <footer style={{ padding: "3rem 2rem", background: "#1a2e1a" }}>
        <div style={{
          maxWidth: "72rem", margin: "0 auto",
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}>
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
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#fff", fontWeight: 700 }}>
              WayPoint
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", textAlign: "center", fontFamily: "'Inter',sans-serif" }}>
            © 2026 WayPoint. Committed to sustainable travel data & transparency. 🌿
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontFamily: "'Inter',sans-serif", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Responsive grid: 2-col on medium, 1-col on small */}
      <style>{`
        @media (max-width: 860px) {
          .sus-3col { grid-template-columns: repeat(2,1fr) !important; }
          .sus-stats { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 540px) {
          .sus-3col { grid-template-columns: 1fr !important; }
          .sus-stats { grid-template-columns: repeat(2,1fr) !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
