import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Train, TreePine, Leaf, Download, Share2,
  CheckCircle2, MapPin, Users, Calendar,
  DollarSign, Wind, TrendingDown, Award,
  Loader2, Sparkles, Bus, Car, Plane,
} from "lucide-react";
import { useTrip } from "../context/TripContext";
import { generateItinerary } from "../services/openRouter";

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const ITINERARY = [
  {
    day: "Day 1", date: "Mon, 10 Mar",
    items: [
      { time: "08:00", label: "Eurostar – London St Pancras → Paris Gare du Nord", detail: "3h 34m · £89/person",       Icon: Train,         eco: true },
      { time: "12:00", label: "Check in – Le Marais Eco Hotel",                    detail: "Green certified accommodation · £85/night", Icon: MapPin, eco: true },
      { time: "14:00", label: "Louvre Museum Tour",                                detail: "3–4 hours · £17/person",                    Icon: CheckCircle2,  eco: true },
      { time: "19:00", label: "Local Farmers' Market Evening",                     detail: "2 hours · £12/person",                      Icon: CheckCircle2,  eco: true },
    ],
  },
  {
    day: "Day 2", date: "Tue, 11 Mar",
    items: [
      { time: "09:00", label: "City Cycling Tour",                    detail: "3 hours · £28/person",     Icon: CheckCircle2, eco: true },
      { time: "13:00", label: "Lunch at Vegan Bistro, Montmartre",    detail: "Plant-based · ~£18/person", Icon: CheckCircle2, eco: true },
      { time: "15:30", label: "Seine River Kayak Adventure",          detail: "3 hours · £45/person",     Icon: CheckCircle2, eco: true },
    ],
  },
  {
    day: "Day 3", date: "Wed, 12 Mar",
    items: [
      { time: "09:30", label: "Forest Hiking in Fontainebleau", detail: "Full day · Free entry",     Icon: TreePine, eco: true },
      { time: "18:00", label: "Return to Paris",                detail: "Regional train · ~£12",     Icon: Train,    eco: true },
    ],
  },
];

const COST_BREAKDOWN = [
  { name: "Transport",      value: 178, color: "#4aab74",  icon: "🚄" },
  { name: "Activities",     value: 102, color: "#2d7a4f",  icon: "🎭" },
  { name: "Accommodation",  value: 255, color: "#86efac",  icon: "🏨" },
  { name: "Food & Dining",  value: 108, color: "#a7f3d0",  icon: "🍽️" },
  { name: "Misc & Buffer",  value:  57, color: "#d1fae5",  icon: "✨" },
];

const DAILY_BUDGET = [
  { day: "Day 1", cost: 198 },
  { day: "Day 2", cost: 91 },
  { day: "Day 3", cost: 60 },
  { day: "Day 4–7", cost: 175 },
];

const CARBON_BARS = [
  { label: "Your Trip",          value: 12.4, max: 100, color: "#4aab74", badge: "You",    badgeColor: "#4aab74" },
  { label: "Average Trip",       value: 97.2, max: 100, color: "#f87171", badge: "Avg",    badgeColor: "#f87171" },
  { label: "Eco Target (2030)",  value: 20,   max: 100, color: "#fbbf24", badge: "Target", badgeColor: "#fbbf24" },
];

const CARBON_CATEGORIES = [
  { label: "Transport",     value: 4.2, icon: "🚄", pct: 34, color: "#4aab74" },
  { label: "Activities",    value: 1.4, icon: "🎭", pct: 11, color: "#86efac" },
  { label: "Food & Dining", value: 3.8, icon: "🍽️", pct: 31, color: "#fbbf24" },
  { label: "Accommodation", value: 3.0, icon: "🏨", pct: 24, color: "#a7f3d0" },
];

const CARBON_OFFSETS = [
  { label: "Plant 1 tree through Ecosia",         cost: 5,  co2: 22, icon: "🌳" },
  { label: "Fund solar panels in rural India",     cost: 12, co2: 50, icon: "☀️" },
  { label: "Support Amazonian rainforest",         cost: 8,  co2: 35, icon: "🌿" },
];

const ECO_TIPS = [
  "Carry a reusable water bottle and coffee cup",
  "Use public transport or cycling in Paris",
  "Choose local, seasonal food at restaurants",
  "Opt out of daily hotel towel washing",
  "Purchase carbon offsets for your flight",
];

const ECO_SCORES = [
  { label: "Transport",     score: 96 },
  { label: "Activities",    score: 98 },
  { label: "Accommodation", score: 88 },
];

const totalCost = COST_BREAKDOWN.reduce((s, c) => s + c.value, 0);

/* ─────────────────────────────────────────
   MINI DONUT CHART (SVG, no recharts)
───────────────────────────────────────── */
function DonutChart({ data, size = 200 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38, ir = size * 0.22;
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartTotal = total;
  let angle = -90;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * 360;
    const start = angle; angle += sweep;
    return { ...d, start, sweep };
  });
  function arc(cx, cy, r, startDeg, sweepDeg) {
    const s = (startDeg * Math.PI) / 180;
    const e = ((startDeg + sweepDeg) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = sweepDeg > 180 ? 1 : 0;
    const xi1 = cx + ir * Math.cos(s), yi1 = cy + ir * Math.sin(s);
    const xi2 = cx + ir * Math.cos(e), yi2 = cy + ir * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ir} ${ir} 0 ${large} 0 ${xi1} ${yi1} Z`;
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s) => (
        <path key={s.name} d={arc(cx, cy, r, s.start, s.sweep - 2)} fill={s.color} />
      ))}
      <text x={cx} y={cy - 6}  textAnchor="middle" fontSize="15" fontWeight="800" fill="#1a2e1a">£{chartTotal}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9ca3af">Total</text>
    </svg>
  );
}

/* ─────────────────────────────────────────
   MINI BAR CHART (SVG)
───────────────────────────────────────── */
function MiniBarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.cost));
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
        const bh = ((d.cost / maxVal) * (h - padB - 10));
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
      {[50, 100, 150, 200].map((v) => (
        <text key={v} x={padL - 4} y={(1 - v / maxVal) * (h - padB) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">£{v}</text>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
/* Transport icon map */
const TRANSPORT_ICONS = { train: Train, bus: Bus, car: Car, flight: Plane };

export function MyTripPage() {
  const navigate   = useNavigate();
  const { trip, setAiItinerary } = useTrip();

  /* ── AI itinerary state ── */
  const [itinerary,   setItinerary]   = useState(trip.aiItinerary ?? null);
  const [itinLoading, setItinLoading] = useState(false);
  const [itinError,   setItinError]   = useState("");

  /* Generate itinerary if not already cached */
  useEffect(() => {
    if (itinerary) return;                      // already have one
    if (!trip.from && !trip.to) return;         // no route yet
    setItinLoading(true);
    generateItinerary({
      from:              trip.from,
      to:                trip.to,
      departure:         trip.departure,
      returnDate:        trip.returnDate,
      travelers:         trip.travelers,
      selectedTransport: trip.selectedTransport,
      savedActivities:   trip.savedActivities,
      budget:            trip.budget,
    })
      .then((result) => {
        setItinerary(result);
        setAiItinerary(result);
      })
      .catch((err) => {
        if (err.message === "OPENROUTER_KEY_MISSING") {
          setItinError("key_missing");
        } else {
          setItinError(err.message);
        }
      })
      .finally(() => setItinLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── All dynamic values derived from TripContext ── */
  const from      = trip.from || "";
  const to        = trip.to   || "";
  const travelers = trip.travelers  ?? 2;
  const departure = trip.departure  ?? "";
  const returnDate= trip.returnDate ?? "";
  const budget    = trip.budget     ?? 2000;
  const transport = trip.selectedTransport;
  const activities= trip.savedActivities ?? [];
  const hasTrip   = !!(from && to && transport);

  /* Calculate nights */
  const nights = (() => {
    if (departure && returnDate) {
      const d = Math.round((new Date(returnDate) - new Date(departure)) / 86400000);
      return d > 0 ? d : 3;
    }
    return 3;
  })();

  /* Date display */
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  const dateLabel = departure
    ? returnDate
      ? `${fmtDate(departure)} – ${fmtDate(returnDate)}`
      : fmtDate(departure)
    : "";

  /* Dynamic cost breakdown */
  const transportCost   = transport ? transport.price * travelers : 0;
  const activitiesCost  = activities.reduce((s, a) => s + ((a.price ?? 0) * travelers), 0);
  const accommodationCost = Math.round(budget * 0.35 < transportCost ? transportCost * 0.6 : budget * 0.35);
  const foodCost          = Math.round(budget * 0.15);
  const miscCost          = Math.max(0, budget - transportCost - activitiesCost - accommodationCost - foodCost);

  const COST_BREAKDOWN_REAL = [
    { name: "Transport",     value: transportCost,    color: "#4aab74", icon: "🚄" },
    { name: "Activities",    value: activitiesCost,   color: "#2d7a4f", icon: "🎭" },
    { name: "Accommodation", value: accommodationCost, color: "#86efac", icon: "🏨" },
    { name: "Food & Dining", value: foodCost,          color: "#a7f3d0", icon: "🍽️" },
    { name: "Misc & Buffer", value: miscCost > 0 ? miscCost : Math.round(budget * 0.05), color: "#d1fae5", icon: "✨" },
  ];
  const totalCostDisplay = COST_BREAKDOWN_REAL.reduce((s, c) => s + c.value, 0);

  /* Dynamic carbon */
  const transportCO2  = transport ? (transport.emissions ?? 0) * travelers : 0;
  const activitiesCO2 = activities.reduce((s, a) => s + ((a.emissions ?? 0.2) * travelers), 0);
  const carbonDisplay = +(transportCO2 + activitiesCO2).toFixed(1);
  const AVG_TRIP_CO2  = 97.2;
  const savingPct     = carbonDisplay < AVG_TRIP_CO2
    ? Math.round(((AVG_TRIP_CO2 - carbonDisplay) / AVG_TRIP_CO2) * 100)
    : 0;

  /* Eco score letter */
  const ecoScore = transport?.ecoScore ?? 80;
  const ecoGrade = ecoScore >= 90 ? "A+" : ecoScore >= 75 ? "A" : ecoScore >= 60 ? "B" : "C";

  /* Dynamic eco scores per category */
  const ECO_SCORES_REAL = [
    { label: "Transport",     score: transport?.ecoScore ?? 80 },
    { label: "Activities",    score: activities.length ? Math.round(activities.reduce((s, a) => s + (a.eco_score ?? 85), 0) / activities.length) : 85 },
    { label: "Accommodation", score: 84 },
  ];

  /* Dynamic eco tips based on destination */
  const ECO_TIPS_REAL = [
    `Use local public transport in ${to || "your destination"} instead of taxis`,
    "Carry a reusable water bottle and coffee cup",
    "Choose locally-owned restaurants with seasonal menus",
    "Opt out of daily hotel towel washing",
    "Offset remaining carbon through a verified provider",
    `Explore ${to || "your destination"} by bike or on foot where possible`,
  ];

  /* Daily budget for bar chart — spread across nights */
  const DAILY_BUDGET_REAL = Array.from({ length: Math.min(nights, 5) }, (_, i) => ({
    day: i === 0 ? "Day 1" : i === nights - 1 ? `Day ${i + 1}` : `Day ${i + 1}`,
    cost: i === 0
      ? Math.round(transportCost + (activitiesCost + foodCost) / nights)
      : i === nights - 1
      ? Math.round(transportCost * 0.2 + foodCost / nights)
      : Math.round((activitiesCost + foodCost + accommodationCost) / Math.max(nights - 1, 1)),
  }));

  /* Carbon comparison bars */
  const CARBON_BARS_REAL = [
    { label: "Your Trip",         value: Math.max(carbonDisplay, 0.5), max: AVG_TRIP_CO2, color: "#4aab74", badge: "You",    badgeColor: "#4aab74" },
    { label: "Average Trip",      value: AVG_TRIP_CO2,                  max: AVG_TRIP_CO2, color: "#f87171", badge: "Avg",    badgeColor: "#f87171" },
    { label: "Eco Target (2030)", value: 20,                            max: AVG_TRIP_CO2, color: "#fbbf24", badge: "Target", badgeColor: "#fbbf24" },
  ];

  /* Carbon categories */
  const totalCO2 = Math.max(carbonDisplay, 0.1);
  const CARBON_CATEGORIES_REAL = [
    { label: "Transport",     value: +transportCO2.toFixed(1),  icon: "🚄", pct: Math.round((transportCO2 / totalCO2) * 100),  color: "#4aab74" },
    { label: "Activities",    value: +activitiesCO2.toFixed(1), icon: "🎭", pct: Math.round((activitiesCO2 / totalCO2) * 100), color: "#86efac" },
    { label: "Food & Dining", value: +(totalCO2 * 0.22).toFixed(1), icon: "🍽️", pct: 22, color: "#fbbf24" },
    { label: "Accommodation", value: +(totalCO2 * 0.15).toFixed(1), icon: "🏨", pct: 15, color: "#a7f3d0" },
  ];

  /* Build 3 fixed days from only what the user actually selected.
     Day 1 gets the transport + check-in; all days get a slice of
     the user's chosen activities. Nothing fake is ever injected. */
  const buildDynamicDays = () => {
    const NUM_DAYS  = 3;
    const actsPerDay = Math.max(1, Math.ceil(activities.length / NUM_DAYS));
    return Array.from({ length: NUM_DAYS }, (_, i) => {
      const dayActs = activities.slice(i * actsPerDay, (i + 1) * actsPerDay);
      const dayDate = departure
        ? fmtDate(new Date(new Date(departure).getTime() + i * 86400000))
        : `Day ${i + 1}`;

      const items = [];

      if (i === 0 && transport) {
        const TIcon = TRANSPORT_ICONS[transport.type] ?? CheckCircle2;
        items.push({
          time:   transport.departure ?? "08:00",
          label:  `${transport.company ?? ""} – ${from} → ${to}`,
          detail: `${transport.duration ?? ""} · £${transport.price}/person`,
          Icon:   TIcon,
          eco:    (transport.ecoScore ?? 50) >= 60,
        });
        items.push({
          time:   "13:00",
          label:  `Check in – Eco Accommodation, ${to}`,
          detail: `Green certified · £${Math.round(accommodationCost / Math.max(nights, 1))}/night`,
          Icon:   MapPin,
          eco:    true,
        });
      }

      dayActs.forEach((a, j) => {
        const times = ["10:00", "14:00", "17:00"];
        items.push({
          time:   i === 0 ? ["15:00", "17:30"][j] ?? "15:00" : times[j] ?? "10:00",
          label:  a.title,
          detail: `${a.duration ?? "2–3 hours"} · ${a.price === 0 ? "Free" : `£${a.price}/person`}`,
          Icon:   CheckCircle2,
          eco:    true,
          actId:  a.id,
        });
      });

      return { day: `Day ${i + 1}`, date: dayDate, items, hasActivities: dayActs.length > 0 };
    });
  };

  const displayDays = itinerary?.days?.length
    ? itinerary.days.map((d) => ({
        day:           d.day,
        date:          d.date_label ?? d.date ?? "",
        hasActivities: true,
        items: d.items.map((item) => ({
          time:   item.time,
          label:  item.label,
          detail: item.detail,
          Icon:   TRANSPORT_ICONS[item.type] ?? CheckCircle2,
          eco:    item.eco !== false,
        })),
      }))
    : buildDynamicDays();

  const [activeTab,       setActiveTab]       = useState("itinerary");
  const [selectedOffset,  setSelectedOffset]  = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>

      {/* ══════════════════════════════════════
          HERO HEADER
         ══════════════════════════════════════ */}
      <div style={{
        paddingTop: "68px",
        background: "linear-gradient(135deg, #1a3a2a 0%, #2d7a4f 100%)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* decorative circles */}
        {[0,1,2,3,4,5].map((i) => (
          <div key={i} style={{
            position: "absolute",
            width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
            borderRadius: "50%", background: "white", opacity: 0.07,
            top: `${i * 14}%`, left: `${i * 17}%`,
            pointerEvents: "none",
          }} />
        ))}

        <div style={{
          maxWidth: "72rem", margin: "0 auto",
          padding: "2rem 2rem 2.5rem",
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between",
          gap: "1.5rem", position: "relative", zIndex: 1,
        }}>
          {/* Left */}
          <div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.625rem" }}>
              {[
                { Icon: MapPin,   text: hasTrip ? `${from} → ${to}` : "No route planned" },
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

            <h1 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "clamp(1.75rem,3.5vw,2.6rem)",
              fontWeight: 700, color: "#fff",
              lineHeight: 1.15, marginBottom: "0.625rem",
            }}>
              Your Trip Summary
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Award style={{ width: "1.1rem", height: "1.1rem", color: "#86efac" }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#86efac", fontFamily: "'Inter',sans-serif" }}>
                {savingPct}% lower carbon footprint than the average trip!
              </span>
            </div>
          </div>

          {/* Right — 3 stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.875rem", flexShrink: 0 }}>
            {[
              { label: "Total Cost",    value: `£${totalCostDisplay.toLocaleString()}`, sub: `${travelers} people`, Icon: DollarSign },
              { label: "CO₂ Emissions", value: `${carbonDisplay} kg`,                  sub: `vs ${AVG_TRIP_CO2} kg avg`, Icon: Wind },
              { label: "Eco Score",     value: ecoGrade,                               sub: ecoScore >= 75 ? "Excellent rating" : "Good rating", Icon: Leaf },
            ].map(({ label, value, sub, Icon }) => (
              <div key={label} style={{
                padding: "1rem 1.125rem",
                borderRadius: "1rem",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                textAlign: "center", color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
              }}>
                <Icon style={{ width: "1.1rem", height: "1.1rem", opacity: 0.8, margin: "0 auto 0.5rem" }} />
                <p style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
                  {value}
                </p>
                <p style={{ fontSize: "0.68rem", opacity: 0.72, marginTop: "0.3rem", fontFamily: "'Inter',sans-serif" }}>
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CONTENT
         ══════════════════════════════════════ */}
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 2rem 4rem" }}>

        {/* ── No-trip empty state ── */}
        {!hasTrip && (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            background: "#fff", borderRadius: "1.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            marginBottom: "2rem",
          }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🗺️</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", color: "#1a2e1a", marginBottom: "0.75rem" }}>
              No trip planned yet
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "1.75rem", fontFamily: "'Inter',sans-serif", maxWidth: "28rem", margin: "0 auto 1.75rem" }}>
              Start by searching your route on the home page, choose a green transport option, then pick your eco activities.
            </p>
            <button
              onClick={() => navigate("/")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.875rem 2rem", borderRadius: "9999px",
                border: "none", background: "#2d7a4f", color: "#fff",
                fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                boxShadow: "0 4px 16px rgba(45,122,79,0.3)",
              }}
            >
              <Leaf style={{ width: "1rem", height: "1rem" }} />
              Plan a Sustainable Trip
            </button>
          </div>
        )}

        {/* ── All content below is only shown once a trip is booked ── */}
        {hasTrip && (<>

        {/* Tab nav */}
        <div style={{
          display: "inline-flex",
          background: "#fff",
          borderRadius: "1rem",
          padding: "0.375rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          marginBottom: "2rem",
          gap: "0.25rem",
        }}>
          {[
            { id: "itinerary", label: "📅 Itinerary" },
            { id: "costs",     label: "💰 Costs" },
            { id: "carbon",    label: "🌿 Carbon" },
          ].map(({ id, label }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: "0.6rem 1.375rem",
                borderRadius: "0.75rem", border: "none",
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

        {/* ══════════ ITINERARY TAB ══════════ */}
        {activeTab === "itinerary" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 22rem", gap: "1.5rem", alignItems: "start" }}>

            {/* Left — day cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* AI loading / source badge */}
              {itinLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem 1.25rem", borderRadius: "1rem", background: "#e8f5ee", border: "1px solid #bbf7d0" }}>
                  <Loader2 style={{ width: "1rem", height: "1rem", color: "#2d7a4f", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "0.875rem", color: "#166534", fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Gemini AI is building your personalised itinerary…</span>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              )}
              {itinerary && !itinLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.875rem", borderRadius: "9999px", background: "#e8f5ee", border: "1px solid #bbf7d0", width: "fit-content" }}>
                  <Sparkles style={{ width: "0.8rem", height: "0.8rem", color: "#2d7a4f" }} />
                  <span style={{ fontSize: "0.72rem", color: "#166534", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>AI-generated itinerary · Gemini Flash</span>
                </div>
              )}
              {itinError === "key_missing" && (
                <div style={{ padding: "0.75rem 1rem", borderRadius: "0.875rem", background: "#fff7ed", border: "1px solid #fed7aa", fontSize: "0.8rem", color: "#92400e", fontFamily: "'Inter',sans-serif" }}>
                  ⚠️ Add <code>VITE_OPENROUTER_API_KEY</code> to enable AI itinerary. Showing sample plan.
                </div>
              )}

              {displayDays.map((day) => (
                <div key={day.day} style={{
                  background: "#fff", borderRadius: "1.25rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden",
                }}>
                  {/* Day header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0.75rem 1.5rem",
                    background: "#f8faf8", borderBottom: "1px solid #e5e7eb",
                  }}>
                    <div style={{
                      width: "2rem", height: "2rem", borderRadius: "0.625rem",
                      background: "#e8f5ee", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Calendar style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>{day.day}</p>
                      <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>{day.date}</p>
                    </div>
                  </div>

                  {/* Timeline items */}
                  <div style={{ padding: "0.5rem 1rem 0.75rem" }}>
                    {/* Empty day — prompt to add activities */}
                    {day.items.length === 0 && (
                      <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: "0.5rem", padding: "1.5rem 1rem", textAlign: "center",
                      }}>
                        <span style={{ fontSize: "1.5rem" }}>📍</span>
                        <p style={{ fontSize: "0.82rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                          No activities planned for this day yet
                        </p>
                        <button
                          onClick={() => navigate("/activities")}
                          style={{
                            fontSize: "0.78rem", fontWeight: 600, color: "#2d7a4f",
                            background: "#e8f5ee", border: "1px solid #bbf7d0",
                            borderRadius: "9999px", padding: "0.3rem 0.875rem",
                            cursor: "pointer", fontFamily: "'Inter',sans-serif",
                          }}
                        >
                          + Add Activities
                        </button>
                      </div>
                    )}
                    {day.items.map((item, idx) => {
                      const { Icon } = item;
                      const isLast = idx === day.items.length - 1;
                      return (
                        <div key={idx} style={{
                          display: "flex", alignItems: "flex-start",
                          gap: "0.875rem", padding: "0.625rem 0",
                          position: "relative",
                        }}>
                          {/* Vertical connector line */}
                          {!isLast && (
                            <div style={{
                              position: "absolute",
                              left: "1.5rem", top: "2.25rem",
                              width: "1px", height: "calc(100% - 0.5rem)",
                              background: "#e5e7eb", zIndex: 0,
                            }} />
                          )}

                          {/* Icon circle + time */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", width: "3rem", flexShrink: 0, zIndex: 1 }}>
                            <div style={{
                              width: "2rem", height: "2rem", borderRadius: "50%",
                              background: "#e8f5ee", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Icon style={{ width: "0.8rem", height: "0.8rem", color: "#2d7a4f" }} />
                            </div>
                            <span style={{ fontSize: "0.65rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
                              {item.time}
                            </span>
                          </div>

                          {/* Label + detail */}
                          <div style={{ flex: 1, paddingTop: "0.25rem" }}>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a2e1a", fontFamily: "'Inter',sans-serif", marginBottom: "0.15rem" }}>
                              {item.label}
                            </p>
                            <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                              {item.detail}
                            </p>
                          </div>

                          {/* Eco badge */}
                          {item.eco && (
                            <span style={{
                              flexShrink: 0, padding: "0.2rem 0.6rem",
                              borderRadius: "9999px", background: "#e8f5ee",
                              color: "#2d7a4f", fontSize: "0.68rem", fontWeight: 700,
                              fontFamily: "'Inter',sans-serif",
                              display: "inline-flex", alignItems: "center", gap: "0.2rem",
                            }}>
                              🌿 Eco
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right — sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Eco Score card */}
              <div style={{
                borderRadius: "1.25rem", padding: "1.5rem",
                background: "linear-gradient(135deg,#e8f5ee,#f0fdf4)",
                border: "1.5px solid #bbf7d0",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.125rem" }}>
                  <Award style={{ width: "1.1rem", height: "1.1rem", color: "#2d7a4f" }} />
                  <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif", fontSize: "1rem" }}>Eco Score</h3>
                </div>
                <div style={{
                  textAlign: "center",
                  fontSize: "4rem", fontWeight: 800,
                  fontFamily: "'Playfair Display',serif",
                  color: "#2d7a4f", lineHeight: 1,
                  marginBottom: "0.625rem",
                }}>
                  {ecoGrade}
                </div>
                <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#4b5563", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif", lineHeight: 1.55 }}>
                  {ecoScore >= 90 ? "Your trip ranks in the top 5% of sustainable journeys" : ecoScore >= 75 ? "Your trip is significantly greener than average" : "Consider greener transport to improve your score"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {ECO_SCORES_REAL.map(({ label, score }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#4b5563", width: "7.5rem", flexShrink: 0, fontFamily: "'Inter',sans-serif" }}>
                        {label}
                      </span>
                      <div style={{ flex: 1, height: "7px", borderRadius: "9999px", background: "#bbf7d0" }}>
                        <div style={{ height: "100%", borderRadius: "9999px", width: `${score}%`, background: "#2d7a4f" }} />
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d7a4f", width: "1.75rem", textAlign: "right", fontFamily: "'Inter',sans-serif" }}>
                        {score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sustainability Tips */}
              <div style={{
                borderRadius: "1.25rem", padding: "1.375rem",
                background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              }}>
                <h3 style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  fontWeight: 700, color: "#1a2e1a", marginBottom: "0.875rem",
                  fontFamily: "'Inter',sans-serif", fontSize: "0.95rem",
                }}>
                  <Leaf style={{ width: "0.9rem", height: "0.9rem", color: "#2d7a4f" }} />
                  Sustainability Tips
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.625rem", listStyle: "none", padding: 0, margin: 0 }}>
                  {ECO_TIPS_REAL.map((tip) => (
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
                  { label: "Download PDF", Icon: Download, bg: "#2d7a4f", color: "#fff"   },
                ].map(({ label, Icon, bg, color }) => (
                  <button key={label} style={{
                    flex: 1, padding: "0.75rem 0.5rem",
                    borderRadius: "0.875rem", border: "none",
                    background: bg, color,
                    fontSize: "0.8rem", fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Inter',sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                    transition: "opacity 0.15s",
                  }}
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

        {/* ══════════ COSTS TAB ══════════ */}
        {activeTab === "costs" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

            {/* Donut chart card */}
            <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif" }}>
                Cost Breakdown
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                <DonutChart data={COST_BREAKDOWN_REAL} size={180} />
                <div style={{ flex: 1, minWidth: "10rem" }}>
                  {COST_BREAKDOWN_REAL.map((item) => (
                    <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "0.75rem", height: "0.75rem", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8rem", color: "#4b5563", fontFamily: "'Inter',sans-serif" }}>
                          {item.icon} {item.name}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>£{item.value}</p>
                        <p style={{ fontSize: "0.65rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
                          {Math.round((item.value / totalCostDisplay) * 100)}%
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

            {/* Right side */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Bar chart */}
              <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "1rem", fontFamily: "'Inter',sans-serif" }}>
                  Per-Day Budget
                </h3>
                <MiniBarChart data={DAILY_BUDGET_REAL} />
              </div>

              {/* Budget summary */}
              <div style={{
                borderRadius: "1.25rem", padding: "1.5rem",
                background: "linear-gradient(135deg,#e8f5ee,#f0fdf4)",
                border: "1.5px solid #bbf7d0",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[
                    { label: "Per Person",    value: `£${Math.round(totalCostDisplay / Math.max(travelers, 1))}` },
                    { label: "Per Day",       value: `£${Math.round(totalCostDisplay / Math.max(nights, 1))}` },
                    { label: "Within Budget?",value: "✓ Yes" },
                    { label: "Budget Left",   value: "£300" },
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

        {/* ══════════ CARBON TAB ══════════ */}
        {activeTab === "carbon" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

              {/* Carbon comparison */}
              <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "1.5rem", fontFamily: "'Inter',sans-serif" }}>
                  Carbon Comparison
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {CARBON_BARS_REAL.map(({ label, value, color, badge }) => (
                    <div key={label}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{
                            padding: "0.15rem 0.5rem", borderRadius: "9999px",
                            background: `${color}25`, color,
                            fontSize: "0.7rem", fontWeight: 700, fontFamily: "'Inter',sans-serif",
                          }}>{badge}</span>
                          <span style={{ fontSize: "0.875rem", color: "#4b5563", fontWeight: 500, fontFamily: "'Inter',sans-serif" }}>{label}</span>
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>{value} kg CO₂</span>
                      </div>
                      <div style={{ height: "0.75rem", borderRadius: "9999px", background: "#f3f4f6" }}>
                        <div style={{ height: "100%", borderRadius: "9999px", width: `${value}%`, background: color, transition: "width 0.8s" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: "1.25rem", padding: "0.875rem 1rem",
                  borderRadius: "0.875rem", background: "#e8f5ee",
                  display: "flex", alignItems: "center", gap: "0.75rem",
                }}>
                  <TrendingDown style={{ width: "1.25rem", height: "1.25rem", color: "#2d7a4f", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#166534", fontFamily: "'Inter',sans-serif" }}>
                      You saved {(97.2 - 12.4).toFixed(1)} kg CO₂
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#4b5563", fontFamily: "'Inter',sans-serif" }}>
                      Equivalent to not driving 350 km or planting 4 trees
                    </p>
                  </div>
                </div>
              </div>

              {/* Carbon offset options */}
              <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "0.375rem", fontFamily: "'Inter',sans-serif" }}>
                  Carbon Offset Options
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif" }}>
                  Offset your remaining 12.4 kg CO₂ footprint by supporting one of these verified projects:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {CARBON_OFFSETS.map((o, idx) => (
                    <div key={o.label}
                      onClick={() => setSelectedOffset(selectedOffset === idx ? null : idx)}
                      style={{
                        borderRadius: "0.875rem", padding: "1rem",
                        border: `2px solid ${selectedOffset === idx ? "#4aab74" : "#e5e7eb"}`,
                        background: selectedOffset === idx ? "#e8f5ee" : "#fafafa",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
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
                  <button style={{
                    width: "100%", marginTop: "1rem", padding: "0.875rem",
                    borderRadius: "0.875rem", border: "none",
                    background: "linear-gradient(135deg,#2d7a4f,#4aab74)",
                    color: "#fff", fontSize: "0.875rem", fontWeight: 700,
                    cursor: "pointer", fontFamily: "'Inter',sans-serif",
                    transition: "opacity 0.15s",
                  }}
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
              <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontSize: "1rem", marginBottom: "1.25rem", fontFamily: "'Inter',sans-serif" }}>
                Emissions by Category
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
                {CARBON_CATEGORIES_REAL.map(({ label, value, icon, pct, color }) => (
                  <div key={label} style={{
                    borderRadius: "0.875rem", padding: "1.125rem",
                    background: "#f8faf8", textAlign: "center",
                  }}>
                    <span style={{ fontSize: "1.75rem" }}>{icon}</span>
                    <p style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "'Playfair Display',serif", color: "#1a2e1a", lineHeight: 1, margin: "0.5rem 0 0.15rem" }}>{value}</p>
                    <p style={{ fontSize: "0.65rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>kg CO₂</p>
                    <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#4b5563", marginTop: "0.375rem", fontFamily: "'Inter',sans-serif" }}>{label}</p>
                    <div style={{ height: "6px", borderRadius: "9999px", background: "#e5e7eb", marginTop: "0.5rem" }}>
                      <div style={{ height: "100%", borderRadius: "9999px", width: `${pct}%`, background: color }} />
                    </div>
                    <p style={{ fontSize: "0.65rem", color: "#9ca3af", marginTop: "0.25rem", fontFamily: "'Inter',sans-serif" }}>{pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Close hasTrip wrapper ── */}
        </>)}

        {/* ══════════════════════════════════════
            CTA BANNER
           ══════════════════════════════════════ */}
        <div style={{
          marginTop: "2rem",
          borderRadius: "1.5rem", padding: "3rem 2rem",
          textAlign: "center",
          background: "linear-gradient(135deg,#1a3a2a 0%,#2d7a4f 100%)",
          boxShadow: "0 20px 60px rgba(45,122,79,0.25)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-3rem", right: "-2rem", width: "12rem", height: "12rem", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: "-4rem", left: "-2rem", width: "14rem", height: "14rem", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <Leaf style={{ width: "2.5rem", height: "2.5rem", color: "#fff", opacity: 0.82, margin: "0 auto 1.125rem" }} />
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "clamp(1.5rem,3.5vw,2rem)",
              fontWeight: 700, color: "#fff", marginBottom: "0.625rem",
            }}>
              Ready to Book Your Eco Adventure?
            </h2>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.72)", marginBottom: "1.75rem", fontFamily: "'Inter',sans-serif" }}>
              Secure your sustainable trip to Paris with our verified eco-friendly partners.
            </p>
            <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button style={{
                padding: "0.875rem 2.25rem", borderRadius: "0.875rem",
                border: "none", background: "#fff", color: "#2d7a4f",
                fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                boxShadow: "0 6px 20px rgba(0,0,0,0.16)",
                transition: "transform 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Book Now — £{totalCostDisplay}
              </button>
              <button
                onClick={() => navigate("/sustainability")}
                style={{
                  padding: "0.875rem 2.25rem", borderRadius: "0.875rem",
                  border: "2px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff", fontSize: "1rem", fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Inter',sans-serif",
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              >
                <TreePine style={{ width: "1.1rem", height: "1.1rem" }} />
                Learn About Sustainability
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
