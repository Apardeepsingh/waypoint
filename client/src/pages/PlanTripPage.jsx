import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Leaf, ArrowRight, ChevronDown, ChevronUp,
  MapPin, Clock, Users, PoundSterling,
  CheckCircle2, AlertCircle, Info, Car, Train,
  Bus, Plane, Bike, Footprints, Sparkles, Filter,
  BadgeCheck,
} from "lucide-react";
import { useTrip } from "../context/TripContext";

/* ────────────────────────────────────────────────────────────── helpers ── */

function sustainabilityColors(rating) {
  if (!rating) return { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb" };
  const r = rating.toLowerCase();
  if (r === "high")   return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
  if (r === "medium") return { bg: "#fef9c3", text: "#92400e", border: "#fde68a" };
  return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
}

function modeIcon(name, size = "1rem") {
  const n = (name || "").toLowerCase();
  const s = { width: size, height: size };
  if (n.includes("train") || n.includes("rail") || n.includes("eurostar")) return <Train style={s} />;
  if (n.includes("bus") || n.includes("coach"))   return <Bus   style={s} />;
  if (n.includes("flight") || n.includes("air"))  return <Plane style={s} />;
  if (n.includes("bicycle") || n.includes("cycle")) return <Bike style={s} />;
  if (n.includes("walk"))                          return <Footprints style={s} />;
  return <Car style={s} />;
}

function co2Color(co2Str) {
  const kg = parseFloat(co2Str) || 0;
  if (kg === 0)  return "#16a34a";
  if (kg < 5)    return "#22c55e";
  if (kg < 20)   return "#84cc16";
  if (kg < 50)   return "#f59e0b";
  return "#ef4444";
}

const TYPE_COLORS = {
  "Commute":            { bg: "#dbeafe", text: "#1e40af" },
  "Tourist Attraction": { bg: "#fce7f3", text: "#9d174d" },
  "Activity":           { bg: "#ede9fe", text: "#5b21b6" },
  "Food":               { bg: "#ffedd5", text: "#9a3412" },
  "Accommodation":      { bg: "#dcfce7", text: "#166534" },
};
const typeStyle = (t) => TYPE_COLORS[t] ?? { bg: "#f3f4f6", text: "#374151" };

const FILTERS = [
  { id: "all",      label: "All Steps",   emoji: "📋" },
  { id: "commute",  label: "Commute",     emoji: "🚆" },
  { id: "activity", label: "Activities",  emoji: "🎯" },
  { id: "cheapest", label: "Lowest Cost", emoji: "💰" },
  { id: "greenest", label: "Lowest CO₂",  emoji: "🌿" },
];

/* ───────────────────────────────────────────────────── Summary bar ── */
function SummaryBar({ plan }) {
  const sc = sustainabilityColors(plan.sustainability_rating);

  /* Find the AI-chosen commute option name for the "based on" label */
  const commuteStep = plan.itinerary?.find((s) => s.type === "Commute");
  const chosenMode  = commuteStep?.chosen_option ?? null;

  const tiles = [
    {
      label:   "Group Total Cost",
      sub:     chosenMode ? `Via ${chosenMode} · all steps` : "All steps combined",
      value:   `£${plan.total_cost}`,
      icon:    <PoundSterling style={{ width: "1.25rem", height: "1.25rem" }} />,
      color:   "#2d7a4f",
      iconBg:  "#dcfce7",
      valColor:"#1a2e1a",
    },
    {
      label:   "Total CO₂ Emitted",
      sub:     chosenMode ? `Based on ${chosenMode}` : "Whole trip",
      value:   plan.total_co2_emissions,
      icon:    <Leaf style={{ width: "1.25rem", height: "1.25rem" }} />,
      color:   co2Color(plan.total_co2_emissions),
      iconBg:  "#f0fdf4",
      valColor: co2Color(plan.total_co2_emissions),
    },
    {
      label:   "Budget Remaining",
      sub:     `of £${(parseFloat(plan.total_cost || 0) + parseFloat(plan.budget_remaining || 0)).toFixed(2)} total budget`,
      value:   `£${plan.budget_remaining}`,
      icon:    <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem" }} />,
      color:   "#2d7a4f",
      iconBg:  "#dcfce7",
      valColor:"#2d7a4f",
    },
    {
      label:   "Sustainability",
      sub:     "Overall trip rating",
      value:   plan.sustainability_rating ?? "—",
      icon:    <Sparkles style={{ width: "1.25rem", height: "1.25rem" }} />,
      color:   sc.text,
      iconBg:  sc.bg,
      valColor: sc.text,
      bg:      sc.bg,
      border:  sc.border,
    },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: "0.875rem",
      marginBottom: "1.75rem",
    }}>
      {tiles.map((t) => (
        <div key={t.label} style={{
          background: t.bg ?? "#fff",
          borderRadius: "1rem",
          padding: "1.1rem 1.25rem",
          boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
          border: `1.5px solid ${t.border ?? "#f0f0f0"}`,
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
        }}>
          <div style={{
            width: "2.6rem", height: "2.6rem", flexShrink: 0,
            borderRadius: "0.75rem",
            background: t.iconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: t.color, marginTop: "0.1rem",
          }}>
            {t.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af",
              letterSpacing: "0.07em", fontFamily: "'Inter',sans-serif",
              textTransform: "uppercase", marginBottom: "0.2rem",
              whiteSpace: "nowrap",
            }}>
              {t.label}
            </p>
            <p style={{
              fontSize: "1.3rem", fontWeight: 800,
              color: t.valColor, fontFamily: "'Inter',sans-serif",
              lineHeight: 1.1, marginBottom: "0.2rem",
            }}>
              {t.value}
            </p>
            <p style={{
              fontSize: "0.65rem", color: "#9ca3af",
              fontFamily: "'Inter',sans-serif",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {t.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────── Single option row in accordion ── */
function OptionRow({ opt, isChosen, onBook }) {
  const co2c = co2Color(opt.co2_per_person);
  return (
    <div style={{
      borderRadius: "0.875rem",
      background: isChosen ? "#f0fdf4" : "#f9fafb",
      border: `1.5px solid ${isChosen ? "#86efac" : "#e5e7eb"}`,
      marginBottom: "0.625rem",
      overflow: "hidden",
    }}>
      {/* Option header */}
      <div style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{
          width: "2rem", height: "2rem", flexShrink: 0,
          borderRadius: "0.5rem",
          background: isChosen ? "#dcfce7" : "#f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isChosen ? "#166534" : "#6b7280",
        }}>
          {modeIcon(opt.option)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>
              {opt.option}
            </span>
            {isChosen && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "0.25rem",
                padding: "0.15rem 0.5rem", borderRadius: "9999px",
                background: "#166534", color: "#fff",
                fontSize: "0.65rem", fontWeight: 700, fontFamily: "'Inter',sans-serif",
              }}>
                <BadgeCheck style={{ width: "0.65rem", height: "0.65rem" }} />
                AI PICK
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.62rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", marginBottom: "0.1rem" }}>COST/PERSON</p>
            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif" }}>£{opt.cost_per_person}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.62rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", marginBottom: "0.1rem" }}>CO₂/PERSON</p>
            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: co2c, fontFamily: "'Inter',sans-serif" }}>{opt.co2_per_person}</p>
          </div>
          {/* Book button on every row */}
          {onBook && (
            <button
              onClick={() => onBook(opt)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "0.625rem",
                border: isChosen ? "none" : "1.5px solid #2d7a4f",
                background: isChosen
                  ? "linear-gradient(135deg, #2d7a4f, #4aab74)"
                  : "transparent",
                color: isChosen ? "#fff" : "#2d7a4f",
                fontSize: "0.78rem", fontWeight: 700,
                fontFamily: "'Inter',sans-serif",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isChosen) { e.currentTarget.style.background = "#2d7a4f"; e.currentTarget.style.color = "#fff"; }
              }}
              onMouseLeave={(e) => {
                if (!isChosen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#2d7a4f"; }
              }}
            >
              {isChosen ? "✓ Book (Recommended)" : "Book This"}
            </button>
          )}
        </div>
      </div>

      {/* Trade-off reasoning */}
      <div style={{ padding: "0 1rem 0.875rem 3.75rem" }}>
        <p style={{
          fontSize: "0.78rem", color: "#6b7280",
          lineHeight: 1.65, fontFamily: "'Inter',sans-serif",
        }}>
          {opt.trade_off_reasoning}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── Single itinerary card ── */
function ItineraryCard({ step, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const ts   = typeStyle(step.type);
  const co2c = co2Color(step.co2_per_person);
  const isCommute = step.type === "Commute";

  return (
    <div style={{
      borderRadius: "1.25rem",
      background: "#fff",
      boxShadow: "0 1px 8px rgba(0,0,0,0.07)",
      border: "1.5px solid #f0f0f0",
      marginBottom: "1rem",
      overflow: "hidden",
    }}>
      <div style={{ padding: "1.4rem 1.75rem 1.25rem" }}>

        {/* ── Header: step pill + type badge + time ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
          <div style={{
            width: "2.1rem", height: "2.1rem", flexShrink: 0,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2d7a4f, #4aab74)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.82rem", fontWeight: 800,
            fontFamily: "'Inter',sans-serif",
          }}>
            {step.step}
          </div>
          <span style={{
            padding: "0.22rem 0.75rem", borderRadius: "9999px",
            background: ts.bg, color: ts.text,
            fontSize: "0.72rem", fontWeight: 700, fontFamily: "'Inter',sans-serif",
          }}>
            {step.type}
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            fontSize: "0.78rem", color: "#9ca3af",
            fontFamily: "'Inter',sans-serif", marginLeft: "auto",
          }}>
            <Clock style={{ width: "0.75rem", height: "0.75rem" }} />
            {step.time}
          </span>
        </div>

        {/* Activity title */}
        <h3 style={{
          fontSize: "1.05rem", fontWeight: 700, color: "#1a2e1a",
          fontFamily: "'Inter',sans-serif", marginBottom: "1rem",
        }}>
          {step.activity}
        </h3>

        {/* ── Chosen option highlight strip ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 1.1rem",
          borderRadius: "0.875rem",
          background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)",
          border: "1.5px solid #86efac",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}>
          <div style={{
            width: "2.1rem", height: "2.1rem", flexShrink: 0,
            borderRadius: "0.625rem", background: "#dcfce7",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#166534",
          }}>
            {modeIcon(step.chosen_option, "1rem")}
          </div>
          <div>
            <p style={{ fontSize: "0.62rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", marginBottom: "0.1rem" }}>AI CHOSEN OPTION</p>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#166534", fontFamily: "'Inter',sans-serif" }}>
              {step.chosen_option}
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "1.25rem", marginLeft: "auto", flexWrap: "wrap" }}>
            {[
              { l: "Cost/Person",  v: `£${step.cost_per_person}`, c: "#1a2e1a" },
              { l: "Group Total",  v: `£${step.total_cost}`,      c: "#1a2e1a" },
              { l: "CO₂/Person",  v: step.co2_per_person,         c: co2c },
              { l: "Total CO₂",   v: step.total_co2,              c: co2c },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.6rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>{l}</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: c, fontFamily: "'Inter',sans-serif" }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Decision reason */}
        <div style={{
          display: "flex", gap: "0.625rem",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          background: "#f8fdf9",
          border: "1px solid #e8f5ee",
        }}>
          <AlertCircle style={{ width: "0.875rem", height: "0.875rem", color: "#4aab74", flexShrink: 0, marginTop: "0.15rem" }} />
          <p style={{
            fontSize: "0.8rem", color: "#374151",
            lineHeight: 1.65, fontFamily: "'Inter',sans-serif",
            fontStyle: "italic", margin: 0,
          }}>
            {step.decision_reason}
          </p>
        </div>
      </div>

      {/* ── Options accordion ── */}
      {step.options_considered?.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: "100%", padding: "0.7rem 1.75rem",
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: expanded ? "#f0fdf4" : "#fafafa",
              border: "none", borderTop: "1px solid #f0f0f0",
              cursor: "pointer",
              fontSize: "0.78rem", color: "#6b7280",
              fontFamily: "'Inter',sans-serif", fontWeight: 600,
              transition: "background 0.15s",
            }}
          >
            <Info style={{ width: "0.8rem", height: "0.8rem" }} />
            {expanded ? "Hide" : "View all"} {step.options_considered.length} transport options &amp; book
            {isCommute && !expanded && (
              <span style={{
                marginLeft: "0.5rem",
                padding: "0.1rem 0.5rem", borderRadius: "9999px",
                background: "#dcfce7", color: "#166534",
                fontSize: "0.65rem", fontWeight: 700,
              }}>
                Book here
              </span>
            )}
            {expanded
              ? <ChevronUp   style={{ width: "0.8rem", height: "0.8rem", marginLeft: "auto" }} />
              : <ChevronDown style={{ width: "0.8rem", height: "0.8rem", marginLeft: "auto" }} />
            }
          </button>

          {expanded && (
            <div style={{ padding: "1rem 1.75rem 1.5rem", background: "#fafafa" }}>
              {Array.isArray(step.options_considered) &&
                step.options_considered.map((opt, idx) => {
                  const optionLabel = opt?.option ?? "";
                  const chosenLabel = step?.chosen_option ?? "";
                  const isChosen =
                    typeof optionLabel === "string" &&
                    typeof chosenLabel === "string" &&
                    optionLabel.toLowerCase() === chosenLabel.toLowerCase();

                  return (
                    <OptionRow
                      key={optionLabel || idx}
                      opt={opt}
                      isChosen={isChosen}
                      /* only show Book button on Commute steps */
                      onBook={isCommute ? onBook : null}
                    />
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── Page ── */

export function PlanTripPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { trip, selectTransport } = useTrip();
  const plan = trip.tripPlan;

  const [activeFilter, setActiveFilter] = useState("all");

  /* ── No search yet ── */
  if (!location.state) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg,#f0fdf4,#ecfdf5)",
        gap: "1.25rem", padding: "2rem", textAlign: "center",
      }}>
        <div style={{
          width: "4.5rem", height: "4.5rem", borderRadius: "1.25rem",
          background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Leaf style={{ width: "2.25rem", height: "2.25rem", color: "#2d7a4f" }} />
        </div>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.9rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.5rem" }}>
            Plan Your Sustainable Trip
          </h2>
          <p style={{ color: "#6b7280", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem", maxWidth: "26rem", margin: "0 auto" }}>
            Enter your departure city, destination, budget and travel date on the home page to get your AI-powered eco itinerary.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "0.8rem 2.25rem", borderRadius: "0.875rem", border: "none",
            background: "linear-gradient(135deg,#2d7a4f,#4aab74)",
            color: "#fff", fontFamily: "'Inter',sans-serif",
            fontSize: "1rem", fontWeight: 700, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            boxShadow: "0 8px 25px rgba(45,122,79,0.3)",
          }}
        >
          <ArrowRight style={{ width: "1rem", height: "1rem" }} />
          Start Planning
        </button>
      </div>
    );
  }

  /* ── Loading (backend pending) ── */
  if (!plan) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg,#f0fdf4,#ecfdf5)",
        gap: "1.5rem", padding: "2rem",
      }}>
        <div style={{
          width: "4rem", height: "4rem", borderRadius: "50%",
          border: "4px solid #bbf7d0", borderTopColor: "#2d7a4f",
          animation: "spin 1s linear infinite",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.8rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.5rem" }}>
            Planning your sustainable trip…
          </h2>
          <p style={{ color: "#6b7280", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem" }}>
            Analysing transport options and carbon footprint for your journey.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "0.625rem 1.5rem", borderRadius: "0.75rem",
            border: "1.5px solid #d1d5db", background: "#fff",
            color: "#374151", fontFamily: "'Inter',sans-serif",
            fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
          }}
        >
          ← Back to search
        </button>
      </div>
    );
  }

  /* ── Book a specific transport option ── */
  const handleBook = (opt) => {
    selectTransport({
      id:        (opt.option ?? "").toLowerCase().replace(/\s+/g, "-"),
      title:     opt.option,
      type:      "Commute",
      emissions: parseFloat(opt.co2_per_person) || 0,
      price:     parseFloat(opt.cost_per_person) || 0,
      totalCost: parseFloat(opt.total_cost) || 0,
      totalCO2:  parseFloat(opt.total_co2) || 0,
    });
    navigate("/activities");
  };

  /* ── Filtered steps ── */
  const filteredSteps = useMemo(() => {
    if (!plan.itinerary) return [];
    const steps = [...plan.itinerary];
    if (activeFilter === "commute")  return steps.filter((s) => s.type === "Commute");
    if (activeFilter === "activity") return steps.filter((s) => s.type !== "Commute");
    if (activeFilter === "cheapest") return [...steps].sort((a, b) => parseFloat(a.cost_per_person) - parseFloat(b.cost_per_person));
    if (activeFilter === "greenest") return [...steps].sort((a, b) => parseFloat(a.co2_per_person) - parseFloat(b.co2_per_person));
    return steps;
  }, [plan.itinerary, activeFilter]);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f4", paddingBottom: "5rem" }}>

      {/* ── Green header ── */}
      <div style={{
        background: "linear-gradient(135deg,#1a3a2a 0%,#2d7a4f 55%,#4aab74 100%)",
        padding: "4.5rem 1.5rem 2.5rem",
        color: "#fff",
      }}>
        <div style={{ maxWidth: "76rem", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.3rem 0.875rem", borderRadius: "9999px",
            background: "rgba(255,255,255,0.15)", marginBottom: "0.875rem",
          }}>
            <Leaf style={{ width: "0.8rem", height: "0.8rem" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>AI-Powered Itinerary</span>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(1.9rem,4vw,3rem)",
            fontWeight: 700, marginBottom: "0.75rem",
          }}>
            Your Sustainable Trip Plan
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", opacity: 0.85, flexWrap: "wrap" }}>
            {trip.from && trip.to && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem" }}>
                <MapPin style={{ width: "0.9rem", height: "0.9rem" }} />
                {trip.from} → {trip.to}
              </span>
            )}
            {trip.travelers > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem" }}>
                <Users style={{ width: "0.9rem", height: "0.9rem" }} />
                {trip.travelers} {trip.travelers === 1 ? "person" : "people"}
              </span>
            )}
            {trip.budget && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem" }}>
                <PoundSterling style={{ width: "0.9rem", height: "0.9rem" }} />
                £{trip.budget} budget
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: "76rem", margin: "0 auto", padding: "2rem 1.5rem 0" }}>

        <SummaryBar plan={plan} />

        {/* Filter pills */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          flexWrap: "wrap", marginBottom: "1.5rem",
          padding: "0.75rem 1rem",
          background: "#fff",
          borderRadius: "1rem",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          border: "1px solid #f0f0f0",
        }}>
          <Filter style={{ width: "0.85rem", height: "0.85rem", color: "#9ca3af", flexShrink: 0 }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", fontFamily: "'Inter',sans-serif", marginRight: "0.25rem" }}>FILTER:</span>
          {FILTERS.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: "0.4rem 0.875rem",
                  borderRadius: "9999px",
                  border: `1.5px solid ${active ? "#2d7a4f" : "#e5e7eb"}`,
                  background: active ? "#2d7a4f" : "#fff",
                  color: active ? "#fff" : "#6b7280",
                  fontSize: "0.78rem", fontWeight: 600,
                  fontFamily: "'Inter',sans-serif",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: "0.3rem",
                }}
              >
                <span>{f.emoji}</span> {f.label}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>
            {filteredSteps.length} step{filteredSteps.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Itinerary cards */}
        {filteredSteps.map((step, i) => (
          <ItineraryCard key={step.step ?? i} step={step} onBook={handleBook} />
        ))}

        {/* Trade-off summary */}
        {plan.trade_off_summary && activeFilter === "all" && (
          <div style={{
            background: "#fff", borderRadius: "1.25rem",
            padding: "1.5rem 1.75rem",
            boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            border: "1.5px solid #f0f0f0",
            marginBottom: "1.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
              <div style={{
                width: "2rem", height: "2rem", borderRadius: "0.5rem",
                background: "#f0fdf4", display: "flex", alignItems: "center",
                justifyContent: "center", color: "#2d7a4f",
              }}>
                <AlertCircle style={{ width: "1rem", height: "1rem" }} />
              </div>
              <h3 style={{ fontWeight: 700, color: "#1a2e1a", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem" }}>
                AI Decision Summary
              </h3>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.75, fontFamily: "'Inter',sans-serif" }}>
              {plan.trade_off_summary}
            </p>
          </div>
        )}

        {/* Bottom CTA — quick-book the AI recommendation */}
        <div style={{
          background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)",
          borderRadius: "1.5rem", padding: "2rem 2.5rem",
          border: "1.5px solid #86efac", textAlign: "center",
        }}>
          <Sparkles style={{ width: "2rem", height: "2rem", color: "#2d7a4f", margin: "0 auto 0.75rem" }} />
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.4rem" }}>
            Ready to explore?
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", fontFamily: "'Inter',sans-serif", marginBottom: "1.5rem" }}>
            Book the AI-recommended option, or expand any Commute step above to choose a different transport.
          </p>
          <button
            onClick={() => {
              const commuteStep = plan.itinerary?.find((s) => s.type === "Commute");
              if (commuteStep) {
                handleBook({
                  option:          commuteStep.chosen_option,
                  co2_per_person:  commuteStep.co2_per_person,
                  cost_per_person: commuteStep.cost_per_person,
                  total_cost:      commuteStep.total_cost,
                  total_co2:       commuteStep.total_co2,
                });
              } else {
                navigate("/activities");
              }
            }}
            style={{
              padding: "0.9rem 2.5rem", borderRadius: "0.875rem", border: "none",
              background: "linear-gradient(135deg,#2d7a4f,#4aab74)",
              color: "#fff", fontSize: "1rem", fontWeight: 700,
              fontFamily: "'Inter',sans-serif", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              boxShadow: "0 8px 25px rgba(45,122,79,0.3)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 12px 35px rgba(45,122,79,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)";    e.currentTarget.style.boxShadow = "0 8px 25px rgba(45,122,79,0.3)"; }}
          >
            <Leaf style={{ width: "1.1rem", height: "1.1rem" }} />
            Book AI Recommendation &amp; Find Spots
            <ArrowRight style={{ width: "1.1rem", height: "1.1rem" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
