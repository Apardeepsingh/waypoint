import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf, Globe, TreePine, ArrowRight, CheckCircle2,
  ChevronDown, ChevronUp, Info, Plane, Train, Bus,
  Loader2, Sparkles,
} from "lucide-react";
import { useTrip } from "../context/TripContext";
import logoImg from "../assets/Untitled_Artwork.png";
import { getEcoTips, analyzeRoute } from "../services/openRouter";

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
    if (id === "ai" && !carbonFetched) {
      fetchCarbonAnalysis();
    }
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
        {activeTab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

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

            {/* Main panel */}
            {aiCarbon && !carbonLoading && (() => {
              const insights = aiCarbon.carbon_insights;
              const treesSaved = insights?.trees_saved ?? Math.round((insights?.co2_saved_kg ?? 0) / 22);
              const co2SavedKg = insights?.co2_saved_kg ?? 0;
              const carKmEquiv = insights?.car_km_equivalent ?? Math.round(co2SavedKg / 0.171);
              return (
                <>
                  {/* Header card */}
                  <div style={{ borderRadius: "1.25rem", overflow: "hidden", boxShadow: "0 4px 24px rgba(45,122,79,0.18)", border: "1px solid #bbf7d0" }}>
                    <div style={{
                      background: "linear-gradient(135deg,#1a3a2a 0%,#2d7a4f 100%)",
                      padding: "1.25rem 1.75rem",
                      display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
                    }}>
                      <Sparkles style={{ width: "1.1rem", height: "1.1rem", color: "#86efac", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", fontWeight: 700, fontFamily: "'Inter',sans-serif", margin: 0 }}>
                          OPENAI · CARBON EFFICIENCY ANALYSIS
                        </p>
                        <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif", margin: "0.15rem 0 0" }}>
                          {trip.distanceKm ? `~${trip.distanceKm} km` : "Multi-mode route"}
                          {trip.selectedTransport
                            ? ` · ${trip.selectedTransport.type || trip.selectedTransport.title || "Transport"}`
                            : insights?.best_mode ? ` · ${insights.best_mode.charAt(0).toUpperCase() + insights.best_mode.slice(1)}` : ""}
                          {` · ${trip.travelers ?? 2} ${(trip.travelers ?? 2) === 1 ? "person" : "persons"}`}
                        </p>
                      </div>
                      <span style={{
                        padding: "0.3rem 0.875rem", borderRadius: "9999px",
                        background: "rgba(255,255,255,0.15)", color: "#bbf7d0",
                        fontSize: "0.72rem", fontWeight: 700, fontFamily: "'Inter',sans-serif",
                        border: "1px solid rgba(255,255,255,0.22)", whiteSpace: "nowrap",
                      }}>
                        ✦ Powered by GPT-4o mini
                      </span>
                    </div>

                    <div style={{ background: "#fff", padding: "1.75rem" }}>

                      {/* Headline */}
                      {insights?.headline && (
                        <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "1.5rem", fontFamily: "'Inter',sans-serif", lineHeight: 1.5 }}>
                          💡 {insights.headline}
                        </p>
                      )}

                      {/* 3-stat grid */}
                      {(treesSaved > 0 || co2SavedKg > 0 || carKmEquiv > 0) && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                          {[
                            { emoji: "🌳", value: treesSaved, unit: "trees",   label: "CO₂ equivalent saved",   sub: `vs ${insights?.worst_mode || "highest-carbon"} · per person`, color: "#16a34a" },
                            { emoji: "🌿", value: co2SavedKg, unit: "kg CO₂", label: "avoided per person",      sub: `by choosing ${insights?.best_mode || "eco mode"}`,              color: "#15803d" },
                            { emoji: "🚗", value: carKmEquiv, unit: "km",     label: "car journey equivalent",  sub: "not driven this trip",                                           color: "#166534" },
                          ].map((s, i) => (
                            <div key={i} style={{
                              background: "#f0fdf4", borderRadius: "1.25rem",
                              padding: "1.5rem", border: "1px solid #bbf7d0", textAlign: "center",
                              boxShadow: "0 2px 8px rgba(45,122,79,0.08)",
                            }}>
                              <div style={{ fontSize: "2.25rem", lineHeight: 1, marginBottom: "0.5rem" }}>{s.emoji}</div>
                              <p style={{ fontSize: "2.25rem", fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: "'Inter',sans-serif", margin: 0 }}>
                                {s.value}
                              </p>
                              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", margin: "0.3rem 0 0", fontFamily: "'Inter',sans-serif" }}>
                                {s.unit}
                              </p>
                              <p style={{ fontSize: "0.72rem", color: "#6b7280", margin: "0.2rem 0 0", fontFamily: "'Inter',sans-serif", lineHeight: 1.4 }}>
                                {s.label}
                              </p>
                              <p style={{ fontSize: "0.68rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", margin: 0 }}>
                                {s.sub}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comparison sentence */}
                      {insights?.comparison_sentence && (
                        <div style={{
                          display: "flex", alignItems: "flex-start", gap: "0.75rem",
                          padding: "1rem 1.25rem", background: "#e8f5ee",
                          borderRadius: "1rem", border: "1px solid #bbf7d0",
                          marginBottom: aiCarbon.options?.some(o => o.fun_fact) ? "1.5rem" : 0,
                        }}>
                          <Leaf style={{ width: "1.1rem", height: "1.1rem", color: "#2d7a4f", flexShrink: 0, marginTop: "0.1rem" }} />
                          <p style={{ fontSize: "0.9rem", color: "#166534", fontFamily: "'Inter',sans-serif", lineHeight: 1.65, margin: 0 }}>
                            {insights.comparison_sentence}
                          </p>
                        </div>
                      )}

                      {/* Per-mode insights grid */}
                      {aiCarbon.options?.some(o => o.fun_fact) && (
                        <div>
                          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", margin: "0 0 0.875rem", fontFamily: "'Inter',sans-serif" }}>
                            PER-MODE AI INSIGHTS
                          </p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.875rem" }}>
                            {aiCarbon.options.filter(o => o.fun_fact).map((o) => {
                              const modeIcon  = { train: "🚄", bus: "🚌", car: "🚗", carpool: "🚗", flight: "✈️" }[o.id] ?? "🚆";
                              const modeColor = { train: "#2d7a4f", bus: "#b45309", car: "#16a34a", carpool: "#16a34a", flight: "#dc2626" }[o.id] ?? "#6b7280";
                              const modeBg    = { train: "#f0fdf4", bus: "#fffbeb", car: "#f0fdf4", carpool: "#f0fdf4",  flight: "#fef2f2" }[o.id] ?? "#f8faf8";
                              const modeBorder= { train: "#bbf7d0", bus: "#fde68a", car: "#bbf7d0", carpool: "#bbf7d0",  flight: "#fecaca" }[o.id] ?? "#e5e7eb";
                              return (
                                <div key={o.id} style={{
                                  display: "flex", alignItems: "flex-start", gap: "0.75rem",
                                  padding: "1rem 1.125rem", background: modeBg,
                                  borderRadius: "1rem", border: `1px solid ${modeBorder}`,
                                }}>
                                  <span style={{ fontSize: "1.5rem", flexShrink: 0, lineHeight: 1 }}>{modeIcon}</span>
                                  <div>
                                    <p style={{ fontSize: "0.7rem", fontWeight: 700, color: modeColor, margin: "0 0 0.3rem", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Inter',sans-serif" }}>
                                      {o.type ?? o.id}
                                    </p>
                                    <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.55, fontFamily: "'Inter',sans-serif", margin: 0 }}>
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

                  {/* Eco tip banner */}
                  {aiCarbon.eco_tip && (
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: "0.875rem",
                      padding: "1.125rem 1.5rem", borderRadius: "1.25rem",
                      background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                      border: "1px solid #e5e7eb",
                    }}>
                      <Leaf style={{ width: "1.25rem", height: "1.25rem", color: "#2d7a4f", flexShrink: 0, marginTop: "0.1rem" }} />
                      <div>
                        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", margin: "0 0 0.375rem", fontFamily: "'Inter',sans-serif" }}>
                          GEMINI ECO TIP
                        </p>
                        <p style={{ fontSize: "0.9rem", color: "#166534", lineHeight: 1.65, fontFamily: "'Inter',sans-serif", margin: 0 }}>
                          {aiCarbon.eco_tip}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Savings headline banner */}
                  {aiCarbon.savings_headline && (
                    <div style={{
                      padding: "1.25rem 1.75rem", borderRadius: "1.25rem",
                      background: "linear-gradient(135deg,#1a3a2a,#2d7a4f)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 20px rgba(45,122,79,0.25)",
                    }}>
                      <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", textAlign: "center", fontFamily: "'Playfair Display',serif", margin: 0 }}>
                        🌱 {aiCarbon.savings_headline}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}

            {/* No trip set — prompt */}
            {!carbonLoading && !carbonError && !aiCarbon && (
              <div style={{
                textAlign: "center", padding: "3.5rem 2rem",
                background: "#fff", borderRadius: "1.25rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌿</div>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.5rem", fontFamily: "'Inter',sans-serif" }}>
                  Plan a trip first to see your carbon analysis
                </p>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", fontFamily: "'Inter',sans-serif", marginBottom: "1.5rem" }}>
                  Go to the home page, enter your route, and come back here for a full AI-powered breakdown.
                </p>
              </div>
            )}
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
      `}</style>
    </div>
  );
}
