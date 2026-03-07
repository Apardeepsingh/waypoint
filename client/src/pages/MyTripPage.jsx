import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Train, TreePine, Leaf, Download, Share2,
  CheckCircle2, MapPin, Users, Calendar,
  PoundSterling, Wind, TrendingDown, Award,
  Bus, Car, Plane, Bike, Footprints,
  BadgeCheck, Sparkles, Clock, AlertCircle, Plus,
} from "lucide-react";
import { useTrip } from "../context/TripContext";

/* ── safe number parser — strips £, kg, commas, spaces ── */
const n = (v) => parseFloat(String(v ?? "0").replace(/[^0-9.]/g, "")) || 0;

/* ── safe icon component helper ── */
function SafeIcon({ icon: Icon, size = "0.9rem", color, style: extra }) {
  if (!Icon || typeof Icon !== "function") return null;
  return <Icon style={{ width: size, height: size, color, flexShrink: 0, ...extra }} />;
}

/* ── transport icon by name ── */
function modeIcon(name) {
  const s = (name ?? "").toLowerCase();
  if (s.includes("train") || s.includes("rail") || s.includes("eurostar")) return Train;
  if (s.includes("bus") || s.includes("coach")) return Bus;
  if (s.includes("flight") || s.includes("air")) return Plane;
  if (s.includes("bicycle") || s.includes("cycle")) return Bike;
  if (s.includes("walk")) return Footprints;
  return Car;
}

/* ─────────────────────── Carbon offset options ── */
const CARBON_OFFSETS = [
  { label: "Plant 1 tree through Ecosia",     cost: 5,  co2: 22, icon: "🌳" },
  { label: "Fund solar panels in rural India", cost: 12, co2: 50, icon: "☀️" },
  { label: "Support Amazonian rainforest",     cost: 8,  co2: 35, icon: "🌿" },
];

/* ─────────────────────── Mini SVG donut ── */
function DonutChart({ data, size = 200 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38, ir = size * 0.22;
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  let angle = -90;
  const slices = data.map((d) => {
    const sweep = ((d.value || 0) / total) * 360;
    const start = angle; angle += sweep;
    return { ...d, start, sweep };
  });
  function arc(cx, cy, r, ir, startDeg, sweepDeg) {
    const safe = Math.max(0.5, sweepDeg - 2);
    const s = (startDeg * Math.PI) / 180;
    const e = ((startDeg + safe) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const xi1 = cx + ir * Math.cos(s), yi1 = cy + ir * Math.sin(s);
    const xi2 = cx + ir * Math.cos(e), yi2 = cy + ir * Math.sin(e);
    const large = safe > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ir} ${ir} 0 ${large} 0 ${xi1} ${yi1} Z`;
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s) => (
        <path key={s.name} d={arc(cx, cy, r, ir, s.start, s.sweep)} fill={s.color} />
      ))}
      <text x={cx} y={cy - 6}  textAnchor="middle" fontSize="14" fontWeight="800" fill="#1a2e1a">
        £{Math.round(total)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9ca3af">Total</text>
    </svg>
  );
}

/* ─────────────────────── Mini bar chart ── */
function MiniBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.cost), 1);
  const w = 380, h = 160, padB = 28, padL = 40, barW = 48, gap = 16;
  const chartW = w - padL;
  const barTotal = data.length * barW + (data.length - 1) * gap;
  const startX = padL + (chartW - barTotal) / 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "160px" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={padL} y1={(1 - f) * (h - padB)} x2={w} y2={(1 - f) * (h - padB)} stroke="#f3f4f6" strokeWidth="1" />
      ))}
      {data.map((d, i) => {
        const bh = Math.max(4, (d.cost / maxVal) * (h - padB - 10));
        const x = startX + i * (barW + gap);
        const y = h - padB - bh;
        return (
          <g key={d.day}>
            <rect x={x} y={y} width={barW} height={bh} rx="5" fill="#4aab74" />
            <text x={x + barW / 2} y={h - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.day}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#2d7a4f">£{d.cost}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────── PAGE ── */
export function MyTripPage() {
  const navigate   = useNavigate();
  const { trip }   = useTrip();

  const plan       = trip.tripPlan;
  const transport  = trip.selectedTransport;
  const activities = trip.savedActivities ?? [];

  const from       = trip.from      || "";
  const to         = trip.to        || "";
  const travelers  = trip.travelers ?? 2;
  const departure  = trip.departure ?? "";
  const returnDate = trip.returnDate ?? "";
  const budget     = trip.budget    ?? 2000;

  const hasTrip = !!(from && to && (transport || plan));

  /* ── Date helpers ── */
  const nights = (() => {
    if (departure && returnDate) {
      const d = Math.round((new Date(returnDate) - new Date(departure)) / 86400000);
      return d > 0 ? d : 1;
    }
    return 1;
  })();
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  const dateLabel = departure
    ? (returnDate ? `${fmtDate(departure)} – ${fmtDate(returnDate)}` : fmtDate(departure))
    : "";

  /* ─────────────────────────────── Derive real numbers ── */
  /* Prefer AI plan data; fall back to estimates */
  const totalCostNum   = plan ? n(plan.total_cost)           : (transport ? n(transport.price) * travelers + activities.reduce((s, a) => s + n(a.price) * travelers, 0) : 0);
  const totalCO2Num    = plan ? n(plan.total_co2_emissions)  : (transport ? n(transport.emissions) * travelers : 0);
  const budgetRem      = plan ? n(plan.budget_remaining)     : Math.max(0, budget - totalCostNum);
  const sustainRating  = plan?.sustainability_rating ?? (totalCO2Num < 30 ? "High" : totalCO2Num < 70 ? "Medium" : "Low");

  const AVG_TRIP_CO2   = 97.2;
  const savingPct      = totalCO2Num < AVG_TRIP_CO2
    ? Math.round(((AVG_TRIP_CO2 - totalCO2Num) / AVG_TRIP_CO2) * 100)
    : 0;
  const ecoGrade       = sustainRating?.toLowerCase() === "high" ? "A"
    : sustainRating?.toLowerCase() === "medium" ? "B" : "C";

  /* ─────────────────── Cost breakdown data ── */
  /* Extract transport cost from the commute step if plan exists */
  const commuteStep     = plan?.itinerary?.find((s) => s.type === "Commute" || s.type === "commute");
  const transportCost   = commuteStep ? n(commuteStep.total_cost) : (transport ? n(transport.price) * travelers : 0);
  const activitiesCost  = activities.reduce((s, a) => s + n(a.price) * travelers, 0);
  const accommodationCost = Math.round(budget * 0.35 < transportCost ? transportCost * 0.6 : budget * 0.35);
  const foodCost        = Math.round(budget * 0.15);
  const totalCalc       = transportCost + activitiesCost + accommodationCost + foodCost;
  const miscCost        = Math.max(0, Math.round((plan ? n(plan.total_cost) : budget) - totalCalc));

  const COST_BREAKDOWN = [
    { name: "Transport",     value: transportCost,    color: "#4aab74", icon: "🚄" },
    { name: "Activities",    value: activitiesCost,   color: "#2d7a4f", icon: "🎭" },
    { name: "Accommodation", value: accommodationCost, color: "#86efac", icon: "🏨" },
    { name: "Food & Dining", value: foodCost,          color: "#a7f3d0", icon: "🍽️" },
    { name: "Misc & Buffer", value: miscCost > 0 ? miscCost : Math.round(budget * 0.05), color: "#d1fae5", icon: "✨" },
  ];
  const totalCostDisplay = plan ? Math.round(n(plan.total_cost)) : COST_BREAKDOWN.reduce((s, c) => s + c.value, 0);

  /* ─────────────────── Carbon data ── */
  const transportCO2  = commuteStep ? n(commuteStep.total_co2) : (transport ? n(transport.emissions) * travelers : 0);
  const activitiesCO2 = activities.reduce((s, a) => s + (n(a.emissions) || 0.2) * travelers, 0);
  const carbonDisplay = +(totalCO2Num || transportCO2 + activitiesCO2).toFixed(1);

  const CARBON_BARS = [
    { label: "Your Trip",         value: Math.max(carbonDisplay, 0.5), color: "#4aab74", badge: "You",    badgeColor: "#4aab74" },
    { label: "Average Trip",      value: AVG_TRIP_CO2,                  color: "#f87171", badge: "Avg",    badgeColor: "#f87171" },
    { label: "Eco Target (2030)", value: 20,                            color: "#fbbf24", badge: "Target", badgeColor: "#fbbf24" },
  ];

  const CARBON_CATS = [
    { label: "Transport",     value: +transportCO2.toFixed(1),  icon: "🚄", pct: Math.round((transportCO2 / Math.max(carbonDisplay, 0.1)) * 100),  color: "#4aab74" },
    { label: "Activities",    value: +activitiesCO2.toFixed(1), icon: "🎭", pct: Math.round((activitiesCO2 / Math.max(carbonDisplay, 0.1)) * 100), color: "#86efac" },
    { label: "Food & Dining", value: +(carbonDisplay * 0.22).toFixed(1), icon: "🍽️", pct: 22, color: "#fbbf24" },
    { label: "Accommodation", value: +(carbonDisplay * 0.15).toFixed(1), icon: "🏨", pct: 15, color: "#a7f3d0" },
  ];

  /* ─────────────────── Per-day budget data ── */
  const DAILY_BUDGET = Array.from({ length: Math.min(Math.max(1, nights), 5) }, (_, i) => ({
    day:  `Day ${i + 1}`,
    cost: i === 0
      ? Math.round(transportCost + (activitiesCost + foodCost) / nights)
      : Math.round((activitiesCost + foodCost + accommodationCost) / Math.max(nights - 1, 1)),
  }));

  /* ─────────────────── ECO scores & tips ── */
  const ecoScore = sustainRating?.toLowerCase() === "high" ? 85 : sustainRating?.toLowerCase() === "medium" ? 68 : 45;
  const ECO_SCORES = [
    { label: "Transport",     score: Math.min(99, Math.max(20, Math.round(100 - (transportCO2 / (AVG_TRIP_CO2 * 0.6)) * 80))) },
    { label: "Activities",    score: activities.length ? Math.round(activities.reduce((s, a) => s + (a.eco_score ?? 85), 0) / activities.length) : 85 },
    { label: "Accommodation", score: 84 },
  ];
  const ECO_TIPS = [
    `Use local public transport in ${to || "your destination"} instead of taxis`,
    "Carry a reusable water bottle and coffee cup",
    "Choose locally-owned restaurants with seasonal menus",
    "Opt out of daily hotel towel washing",
    "Offset remaining carbon through a verified provider",
    `Explore ${to || "your destination"} by bike or on foot where possible`,
  ];

  const [activeTab,      setActiveTab]      = useState("itinerary");
  const [selectedOffset, setSelectedOffset] = useState(null);

  /* ─────────────────── EMPTY STATE ── */
  if (!hasTrip) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0fdf4,#ecfdf5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.25rem", padding: "2rem", textAlign: "center" }}>
        <div style={{ width: "4.5rem", height: "4.5rem", borderRadius: "1.25rem", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Leaf style={{ width: "2.25rem", height: "2.25rem", color: "#2d7a4f" }} />
        </div>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.9rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.5rem" }}>
            No trip planned yet
          </h2>
          <p style={{ color: "#6b7280", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem", maxWidth: "26rem", margin: "0 auto" }}>
            Search a route, choose a transport option, then add eco activities — they'll all appear here.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "0.875rem 2.25rem", borderRadius: "0.875rem", border: "none",
            background: "linear-gradient(135deg,#2d7a4f,#4aab74)",
            color: "#fff", fontFamily: "'Inter',sans-serif",
            fontSize: "1rem", fontWeight: 700, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            boxShadow: "0 8px 25px rgba(45,122,79,0.3)",
          }}
        >
          <Leaf style={{ width: "1rem", height: "1rem" }} />
          Plan a Sustainable Trip
        </button>
      </div>
    );
  }

  /* ─────────────────── RENDER ── */
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>

      {/* ─── HERO ─── */}
      <div style={{
        paddingTop: "68px",
        background: "linear-gradient(135deg,#1a3a2a 0%,#2d7a4f 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {[0,1,2,3,4,5].map((i) => (
          <div key={i} style={{
            position: "absolute", width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
            borderRadius: "50%", background: "white", opacity: 0.07,
            top: `${i * 14}%`, left: `${i * 17}%`, pointerEvents: "none",
          }} />
        ))}
        <div style={{
          maxWidth: "72rem", margin: "0 auto", padding: "2rem 2rem 2.5rem",
          display: "flex", flexWrap: "wrap", alignItems: "center",
          justifyContent: "space-between", gap: "1.5rem", position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.625rem" }}>
              {[
                { Icon: MapPin,   text: `${from} → ${to}` },
                dateLabel ? { Icon: Calendar, text: dateLabel } : null,
                { Icon: Users,    text: `${travelers} Traveller${travelers !== 1 ? "s" : ""}` },
              ].filter(Boolean).map(({ Icon, text }, i, arr) => (
                <span key={text} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", fontFamily: "'Inter',sans-serif" }}>
                  <Icon style={{ width: "0.875rem", height: "0.875rem" }} />
                  {text}
                  {i < arr.length - 1 && <span style={{ opacity: 0.4, marginLeft: "0.25rem" }}>·</span>}
                </span>
              ))}
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,3.5vw,2.6rem)", fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: "0.625rem" }}>
              Your Trip Summary
            </h1>
            {savingPct > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Award style={{ width: "1.1rem", height: "1.1rem", color: "#86efac" }} />
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#86efac", fontFamily: "'Inter',sans-serif" }}>
                  {savingPct}% lower carbon footprint than the average trip!
                </span>
              </div>
            )}
          </div>

          {/* Header stat tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.875rem", flexShrink: 0 }}>
            {[
              { label: "Total Cost",     value: `£${totalCostDisplay.toLocaleString()}`, sub: `${travelers} people`,             Icon: PoundSterling },
              { label: "CO₂ Emissions",  value: `${carbonDisplay} kg`,                   sub: `vs ${AVG_TRIP_CO2} kg avg`,       Icon: Wind },
              { label: "Eco Score",      value: ecoGrade,                                 sub: ecoGrade === "A" ? "Excellent rating" : "Good rating", Icon: Leaf },
            ].map(({ label, value, sub, Icon }) => (
              <div key={label} style={{ padding: "1rem 1.125rem", borderRadius: "1rem", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", textAlign: "center", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Icon style={{ width: "1.1rem", height: "1.1rem", opacity: 0.8, margin: "0 auto 0.5rem" }} />
                <p style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: "0.68rem", opacity: 0.72, marginTop: "0.3rem", fontFamily: "'Inter',sans-serif" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 2rem 4rem" }}>

        {/* Tab nav */}
        <div style={{ display: "inline-flex", background: "#fff", borderRadius: "1rem", padding: "0.375rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "2rem", gap: "0.25rem" }}>
          {[
            { id: "itinerary", label: "📅 Itinerary" },
            { id: "costs",     label: "💰 Costs" },
            { id: "carbon",    label: "🌿 Carbon" },
          ].map(({ id, label }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: "0.6rem 1.375rem", borderRadius: "0.75rem", border: "none",
                background: active ? "#2d7a4f" : "transparent",
                color: active ? "#fff" : "#6b7280",
                fontSize: "0.875rem", fontWeight: active ? 600 : 500,
                cursor: "pointer", fontFamily: "'Inter',sans-serif",
                boxShadow: active ? "0 4px 12px rgba(45,122,79,0.28)" : "none",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* ═══ ITINERARY TAB ═══ */}
        {activeTab === "itinerary" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 22rem", gap: "1.5rem", alignItems: "start" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Source badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.875rem", borderRadius: "9999px", background: "#e8f5ee", border: "1px solid #bbf7d0", width: "fit-content" }}>
                <CheckCircle2 style={{ width: "0.8rem", height: "0.8rem", color: "#2d7a4f" }} />
                <span style={{ fontSize: "0.72rem", color: "#166534", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                  {plan ? "AI-Generated Itinerary" : "Your Booked Trip"}
                  {activities.length > 0 && ` · ${activities.length} spot${activities.length !== 1 ? "s" : ""} added`}
                </span>
              </div>

              {/* ── AI plan steps ── */}
              {plan?.itinerary && plan.itinerary.length > 0 ? (
                <div style={{ background: "#fff", borderRadius: "1.25rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ padding: "0.875rem 1.5rem", background: "#f8faf8", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{ width: "2rem", height: "2rem", borderRadius: "0.625rem", background: "#e8f5ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Sparkles style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>
                        {fmtDate(departure) || "Your Trip"} — AI Itinerary
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                        {plan.itinerary.length} steps · {from} → {to}
                      </p>
                    </div>
                  </div>

                  {/* Steps */}
                  <div style={{ padding: "0.5rem 1rem 0.75rem" }}>
                    {plan.itinerary.map((step, idx) => {
                      const isLast    = idx === plan.itinerary.length - 1;
                      const isCommute = step.type === "Commute" || step.type === "commute";
                      const isBooked  = transport && isCommute &&
                        (step.chosen_option ?? "").toLowerCase() === (transport.mode ?? transport.title ?? "").toLowerCase();
                      const StepIcon  = isCommute ? modeIcon(step.chosen_option) : CheckCircle2;

                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "0.75rem 0", position: "relative" }}>
                          {/* connector */}
                          {!isLast && (
                            <div style={{ position: "absolute", left: "1.5rem", top: "2.5rem", width: "1px", height: "calc(100% - 0.5rem)", background: "#e5e7eb", zIndex: 0 }} />
                          )}

                          {/* icon + time */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", width: "3rem", flexShrink: 0, zIndex: 1 }}>
                            <div style={{
                              width: "2rem", height: "2rem", borderRadius: "50%",
                              background: isBooked ? "#dcfce7" : "#e8f5ee",
                              border: isBooked ? "2px solid #86efac" : "2px solid transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <StepIcon style={{ width: "0.85rem", height: "0.85rem", color: "#2d7a4f" }} />
                            </div>
                            <span style={{ fontSize: "0.62rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>{step.time}</span>
                          </div>

                          {/* content */}
                          <div style={{ flex: 1, paddingTop: "0.2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.1rem" }}>
                              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>
                                {step.activity}
                              </p>
                              {isBooked && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", padding: "0.1rem 0.45rem", borderRadius: "9999px", background: "#166534", color: "#fff", fontSize: "0.62rem", fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>
                                  <BadgeCheck style={{ width: "0.6rem", height: "0.6rem" }} />
                                  Your Pick
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                              {step.chosen_option} · £{step.cost_per_person}/person · {step.co2_per_person} CO₂
                            </p>
                          </div>

                          {/* eco badge */}
                          <span style={{ flexShrink: 0, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "#e8f5ee", color: "#2d7a4f", fontSize: "0.68rem", fontWeight: 700, fontFamily: "'Inter',sans-serif", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                            🌿 Eco
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Fallback: show just the booked transport */
                transport && (
                  <div style={{ background: "#fff", borderRadius: "1.25rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ padding: "0.875rem 1.5rem", background: "#f8faf8", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "0.875rem" }}>
                      <Calendar style={{ width: "1rem", height: "1rem", color: "#2d7a4f" }} />
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>
                        {fmtDate(departure) || "Day 1"}
                      </p>
                    </div>
                    <div style={{ padding: "1rem 1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {(() => {
                            const TIcon = modeIcon(transport.title ?? transport.mode ?? "");
                            return <TIcon style={{ width: "0.85rem", height: "0.85rem", color: "#2d7a4f" }} />;
                          })()}
                        </div>
                        <div>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>
                            {transport.title ?? "Transport"} — {from} → {to}
                          </p>
                          <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                            £{transport.price}/person · {transport.emissions} kg CO₂/person
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* ── Saved activities section ── */}
              {activities.length > 0 && (
                <div style={{ background: "#fff", borderRadius: "1.25rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{ padding: "0.875rem 1.5rem", background: "#f8faf8", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{ width: "2rem", height: "2rem", borderRadius: "0.625rem", background: "#e8f5ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MapPin style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>
                        Your Saved Spots
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                        {activities.length} activit{activities.length !== 1 ? "ies" : "y"} added to itinerary
                      </p>
                    </div>
                  </div>
                  <div style={{ padding: "0.5rem 1rem 0.75rem" }}>
                    {activities.map((a, idx) => {
                      const isLast = idx === activities.length - 1;
                      const slotHour = 10 + idx * 2;
                      return (
                        <div key={a.id ?? idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "0.625rem 0", position: "relative" }}>
                          {!isLast && (
                            <div style={{ position: "absolute", left: "1.5rem", top: "2.25rem", width: "1px", height: "calc(100% - 0.5rem)", background: "#e5e7eb", zIndex: 0 }} />
                          )}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", width: "3rem", flexShrink: 0, zIndex: 1 }}>
                            <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "#e8f5ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem", color: "#2d7a4f" }} />
                            </div>
                            <span style={{ fontSize: "0.62rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                              {String(slotHour).padStart(2, "0")}:00
                            </span>
                          </div>
                          <div style={{ flex: 1, paddingTop: "0.25rem" }}>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a2e1a", fontFamily: "'Inter',sans-serif", marginBottom: "0.15rem" }}>
                              {a.title}
                            </p>
                            <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                              {a.duration ?? "2–3 hours"} · {a.price === 0 || !a.price ? "Free" : `£${a.price}/person`}
                            </p>
                            {a.eco_note && (
                              <p style={{ fontSize: "0.72rem", color: "#4aab74", fontFamily: "'Inter',sans-serif", marginTop: "0.15rem", fontStyle: "italic" }}>
                                🌿 {a.eco_note}
                              </p>
                            )}
                          </div>
                          <span style={{ flexShrink: 0, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "#e8f5ee", color: "#2d7a4f", fontSize: "0.68rem", fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>
                            🌿 Eco
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty activities prompt */}
              {activities.length === 0 && (
                <button
                  onClick={() => navigate("/activities")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    padding: "1rem", borderRadius: "1rem",
                    border: "1.5px dashed #86efac", background: "#f0fdf4",
                    color: "#2d7a4f", fontSize: "0.875rem", fontWeight: 600,
                    fontFamily: "'Inter',sans-serif", cursor: "pointer",
                  }}
                >
                  <Plus style={{ width: "1rem", height: "1rem" }} />
                  Add eco activities for {to || "your destination"}
                </button>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Eco score */}
              <div style={{ borderRadius: "1.25rem", padding: "1.5rem", background: "linear-gradient(135deg,#e8f5ee,#f0fdf4)", border: "1.5px solid #bbf7d0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.125rem" }}>
                  <Award style={{ width: "1.1rem", height: "1.1rem", color: "#2d7a4f" }} />
                  <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif", fontSize: "1rem" }}>Eco Score</h3>
                </div>
                <div style={{ textAlign: "center", fontSize: "4rem", fontWeight: 800, fontFamily: "'Playfair Display',serif", color: "#2d7a4f", lineHeight: 1, marginBottom: "0.625rem" }}>
                  {ecoGrade}
                </div>
                <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#4b5563", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif", lineHeight: 1.55 }}>
                  {ecoGrade === "A" ? "Your trip is significantly greener than average" : "Consider greener transport to improve your score"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {ECO_SCORES.map(({ label, score }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#4b5563", width: "7.5rem", flexShrink: 0, fontFamily: "'Inter',sans-serif" }}>{label}</span>
                      <div style={{ flex: 1, height: "7px", borderRadius: "9999px", background: "#bbf7d0" }}>
                        <div style={{ height: "100%", borderRadius: "9999px", width: `${Math.min(score, 100)}%`, background: "#2d7a4f" }} />
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d7a4f", width: "1.75rem", textAlign: "right", fontFamily: "'Inter',sans-serif" }}>{score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Trade-off summary (if available) */}
              {plan?.trade_off_summary && (
                <div style={{ borderRadius: "1.25rem", padding: "1.375rem", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.875rem", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem" }}>
                    <AlertCircle style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f" }} />
                    AI Decision Summary
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.65, fontFamily: "'Inter',sans-serif" }}>
                    {plan.trade_off_summary}
                  </p>
                </div>
              )}

              {/* Sustainability tips */}
              <div style={{ borderRadius: "1.25rem", padding: "1.375rem", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.875rem", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem" }}>
                  <Leaf style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f" }} />
                  Sustainability Tips
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.625rem", listStyle: "none", padding: 0, margin: 0 }}>
                  {ECO_TIPS.map((tip) => (
                    <li key={tip} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <CheckCircle2 style={{ width: "0.8rem", height: "0.8rem", color: "#2d7a4f", flexShrink: 0, marginTop: "0.15rem" }} />
                      <span style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.55, fontFamily: "'Inter',sans-serif" }}>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Share / Download */}
              <div style={{ display: "flex", gap: "0.625rem" }}>
                {[
                  { label: "Share",        Icon: Share2,   bg: "#e8f5ee", color: "#2d7a4f" },
                  { label: "Download PDF", Icon: Download, bg: "#2d7a4f", color: "#fff" },
                ].map(({ label, Icon, bg, color }) => (
                  <button key={label} style={{ flex: 1, padding: "0.75rem 0.5rem", borderRadius: "0.875rem", border: "none", background: bg, color, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", transition: "opacity 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.87")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <Icon style={{ width: "0.875rem", height: "0.875rem" }} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ COSTS TAB ═══ */}
        {activeTab === "costs" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

            {/* Donut */}
            <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif" }}>Cost Breakdown</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                <DonutChart data={COST_BREAKDOWN} size={180} />
                <div style={{ flex: 1, minWidth: "10rem" }}>
                  {COST_BREAKDOWN.map((item) => (
                    <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "0.75rem", height: "0.75rem", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8rem", color: "#4b5563", fontFamily: "'Inter',sans-serif" }}>{item.icon} {item.name}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>£{item.value}</p>
                        <p style={{ fontSize: "0.65rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                          {Math.round((item.value / Math.max(totalCostDisplay, 1)) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "0.625rem", marginTop: "0.375rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>Total</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2d7a4f", fontFamily: "'Playfair Display',serif" }}>£{totalCostDisplay.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "1rem", fontFamily: "'Inter',sans-serif" }}>Per-Day Budget</h3>
                <MiniBarChart data={DAILY_BUDGET} />
              </div>

              <div style={{ borderRadius: "1.25rem", padding: "1.5rem", background: "linear-gradient(135deg,#e8f5ee,#f0fdf4)", border: "1.5px solid #bbf7d0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[
                    { label: "Per Person",     value: `£${Math.round(totalCostDisplay / Math.max(travelers, 1))}` },
                    { label: "Budget Left",    value: `£${Math.max(0, Math.round(budgetRem)).toLocaleString()}` },
                    { label: "Within Budget?", value: totalCostDisplay <= budget ? "✓ Yes" : "✗ Over" },
                    { label: "Total Budget",   value: `£${budget}` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2d7a4f", fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{value}</p>
                      <p style={{ fontSize: "0.72rem", color: "#4b5563", marginTop: "0.25rem", fontFamily: "'Inter',sans-serif" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CARBON TAB ═══ */}
        {activeTab === "carbon" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

              {/* Carbon comparison */}
              <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "1.5rem", fontFamily: "'Inter',sans-serif" }}>Carbon Comparison</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {CARBON_BARS.map(({ label, value, color, badge }) => (
                    <div key={label}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", background: `${color}25`, color, fontSize: "0.7rem", fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>{badge}</span>
                          <span style={{ fontSize: "0.875rem", color: "#4b5563", fontFamily: "'Inter',sans-serif" }}>{label}</span>
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>{value} kg CO₂</span>
                      </div>
                      <div style={{ height: "0.75rem", borderRadius: "9999px", background: "#f3f4f6" }}>
                        <div style={{ height: "100%", borderRadius: "9999px", width: `${Math.min((value / AVG_TRIP_CO2) * 100, 100)}%`, background: color, transition: "width 0.8s" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "1.25rem", padding: "0.875rem 1rem", borderRadius: "0.875rem", background: "#e8f5ee", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <TrendingDown style={{ width: "1.25rem", height: "1.25rem", color: "#2d7a4f", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#166534", fontFamily: "'Inter',sans-serif" }}>
                      You saved {(AVG_TRIP_CO2 - carbonDisplay).toFixed(1)} kg CO₂
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#4b5563", fontFamily: "'Inter',sans-serif" }}>
                      Equivalent to not driving {Math.round((AVG_TRIP_CO2 - carbonDisplay) / 0.171)} km or planting {Math.max(1, Math.round((AVG_TRIP_CO2 - carbonDisplay) / 22))} tree{Math.round((AVG_TRIP_CO2 - carbonDisplay) / 22) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Carbon offsets */}
              <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "0.375rem", fontFamily: "'Inter',sans-serif" }}>Carbon Offset Options</h3>
                <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif" }}>
                  Offset your remaining {carbonDisplay} kg CO₂ footprint by supporting one of these verified projects:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {CARBON_OFFSETS.map((o, idx) => (
                    <div key={o.label}
                      onClick={() => setSelectedOffset(selectedOffset === idx ? null : idx)}
                      style={{ borderRadius: "0.875rem", padding: "1rem", border: `2px solid ${selectedOffset === idx ? "#4aab74" : "#e5e7eb"}`, background: selectedOffset === idx ? "#e8f5ee" : "#fafafa", cursor: "pointer", transition: "all 0.15s" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                          <span style={{ fontSize: "1.5rem" }}>{o.icon}</span>
                          <div>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>{o.label}</p>
                            <p style={{ fontSize: "0.72rem", color: "#6b7280", fontFamily: "'Inter',sans-serif" }}>Offsets {o.co2} kg CO₂</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#2d7a4f", fontFamily: "'Inter',sans-serif" }}>£{o.cost}</span>
                          {selectedOffset === idx && <CheckCircle2 style={{ width: "1.1rem", height: "1.1rem", color: "#2d7a4f" }} />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedOffset !== null && (
                  <button style={{ width: "100%", marginTop: "1rem", padding: "0.875rem", borderRadius: "0.875rem", border: "none", background: "linear-gradient(135deg,#2d7a4f,#4aab74)", color: "#fff", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Purchase Carbon Offset — £{CARBON_OFFSETS[selectedOffset].cost}
                  </button>
                )}
              </div>
            </div>

            {/* Emissions by category */}
            <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif" }}>Emissions by Category</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
                {CARBON_CATS.map(({ label, value, icon, pct, color }) => (
                  <div key={label} style={{ borderRadius: "0.875rem", padding: "1.125rem", background: "#f8faf8", textAlign: "center" }}>
                    <span style={{ fontSize: "1.75rem" }}>{icon}</span>
                    <p style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "'Playfair Display',serif", color: "#1a2e1a", lineHeight: 1, margin: "0.5rem 0 0.15rem" }}>{value}</p>
                    <p style={{ fontSize: "0.65rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>kg CO₂</p>
                    <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#4b5563", marginTop: "0.375rem", fontFamily: "'Inter',sans-serif" }}>{label}</p>
                    <div style={{ height: "6px", borderRadius: "9999px", background: "#e5e7eb", marginTop: "0.5rem" }}>
                      <div style={{ height: "100%", borderRadius: "9999px", width: `${Math.min(pct, 100)}%`, background: color }} />
                    </div>
                    <p style={{ fontSize: "0.65rem", color: "#9ca3af", marginTop: "0.25rem", fontFamily: "'Inter',sans-serif" }}>{pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── CTA BANNER ─── */}
        <div style={{ marginTop: "2rem", borderRadius: "1.5rem", padding: "3rem 2rem", textAlign: "center", background: "linear-gradient(135deg,#1a3a2a 0%,#2d7a4f 100%)", boxShadow: "0 20px 60px rgba(45,122,79,0.25)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-3rem", right: "-2rem", width: "12rem", height: "12rem", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: "-4rem", left: "-2rem", width: "14rem", height: "14rem", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <Leaf style={{ width: "2.5rem", height: "2.5rem", color: "#fff", opacity: 0.82, margin: "0 auto 1.125rem" }} />
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.5rem,3.5vw,2rem)", fontWeight: 700, color: "#fff", marginBottom: "0.625rem" }}>
              Ready to Book Your Eco Adventure?
            </h2>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.72)", marginBottom: "1.75rem", fontFamily: "'Inter',sans-serif" }}>
              {to ? `Secure your sustainable trip to ${to} with our verified eco-friendly partners.` : "Plan and secure your next sustainable journey."}
            </p>
            <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button style={{ padding: "0.875rem 2.25rem", borderRadius: "0.875rem", border: "none", background: "#fff", color: "#2d7a4f", fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 6px 20px rgba(0,0,0,0.16)", transition: "transform 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Book Now — £{totalCostDisplay.toLocaleString()}
              </button>
              <button
                onClick={() => navigate("/activities")}
                style={{ padding: "0.875rem 2.25rem", borderRadius: "0.875rem", border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "inline-flex", alignItems: "center", gap: "0.5rem", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              >
                <TreePine style={{ width: "1.1rem", height: "1.1rem" }} />
                {activities.length > 0 ? "Add More Activities" : "Browse Activities"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
