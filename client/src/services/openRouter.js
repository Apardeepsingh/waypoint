/* ─────────────────────────────────────────────────────────
   OpenRouter — Gemini 2.5 Flash Lite integration
   Model: google/gemini-2.5-flash-lite

   All prompts return structured JSON for easy consumption.
───────────────────────────────────────────────────────── */

const BASE  = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash-lite";

/* ── Core fetch wrapper ── */
async function ask(userPrompt, systemPrompt = "You are an eco travel AI assistant. Always respond with valid JSON only. No markdown, no explanation — just the JSON object.") {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key || key === "your_openrouter_key_here") {
    throw new Error("OPENROUTER_KEY_MISSING");
  }

  const res = await fetch(BASE, {
    method:  "POST",
    headers: {
      "Authorization":       `Bearer ${key}`,
      "Content-Type":        "application/json",
      "HTTP-Referer":        typeof window !== "undefined" ? window.location.origin : "https://waypoint.eco",
      "X-OpenRouter-Title":  "Waypoint Eco Travel",
    },
    body: JSON.stringify({
      model:    MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${txt}`);
  }

  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";

  /* Strip markdown code fences if present */
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function analyzeRoute({ from, to, distanceKm, travelers }) {
  const prompt = `
Analyze transport options for an eco-conscious trip:
- From: ${from}
- To: ${to}
- Distance: ~${distanceKm} km
- Travellers: ${travelers}

Return this JSON structure (no extra keys):
{
  "eco_tip": "One compelling sentence about the greenest choice for this specific route",
  "route_summary": "One sentence eco framing of this journey",
  "savings_headline": "e.g. 87% lower carbon than flying",
  "carbon_insights": {
    "best_mode": "train",
    "worst_mode": "flight",
    "co2_saved_kg": 82.5,
    "trees_saved": 4,
    "car_km_equivalent": 482,
    "headline": "Choosing the train saves the equivalent of planting 4 trees per person",
    "comparison_sentence": "The high-speed train produces 97% less CO₂ than flying — one of the cleanest journeys in Europe",
    "saving_pct": 97
  },
  "options": [
    {
      "id": "train",
      "operator": "Eurostar",
      "type": "High-Speed Train",
      "co2_per_person": 4.2,
      "eco_score": 96,
      "eco_label": "Eco-Friendly",
      "price_per_person_gbp": 89,
      "duration_display": "2h 15m",
      "badge": "Best Eco",
      "fun_fact": "One engaging, specific eco fact about taking this mode on this exact route"
    },
    {
      "id": "bus",
      "operator": "FlixBus",
      "type": "Express Coach",
      "co2_per_person": 9.2,
      "eco_score": 78,
      "eco_label": "Low Carbon",
      "price_per_person_gbp": 24,
      "duration_display": "6h 30m",
      "badge": "Best Value",
      "fun_fact": "One engaging, specific eco fact about taking this coach on this route"
    },
    {
      "id": "carpool",
      "operator": "BlaBlaCar",
      "type": "Shared Car",
      "co2_per_person": 14.5,
      "eco_score": 55,
      "eco_label": "Moderate Carbon",
      "price_per_person_gbp": 35,
      "duration_display": "3h 45m",
      "badge": null,
      "fun_fact": "One engaging fact about carpooling on this route"
    },
    {
      "id": "flight",
      "operator": "EasyJet",
      "type": "Short-Haul Flight",
      "co2_per_person": 86.7,
      "eco_score": 8,
      "eco_label": "Very High Carbon",
      "price_per_person_gbp": 142,
      "duration_display": "1h 35m",
      "badge": "Highest CO₂",
      "fun_fact": "One fact about the carbon cost of flying this short route"
    }
  ]
}
Use real-world emission factors and realistic prices for this specific route.
For carbon_insights: trees_saved = round(co2_saved_kg / 22), car_km_equivalent = round(co2_saved_kg / 0.171).`;

  return ask(prompt);
}

/* ═══════════════════════════════════════════════════════════
   2. ECO ACTIVITIES
   Called from ActivitiesPage when AI fallback is needed.
═══════════════════════════════════════════════════════════ */
export async function getEcoActivities({ destination, category = "all", count = 15 }) {
  const catInstr = category !== "all"
    ? `Focus specifically on ${category} activities.`
    : "Cover a diverse mix of nature, culture, food, adventure, and sightseeing.";

  const prompt = `
Suggest ${count} real eco-friendly activities and attractions in ${destination}. ${catInstr}
Prioritise low-carbon, sustainable, locally-owned, and highly-rated experiences.
Include a variety of price points (free, budget, and premium options).
Base these on REAL places and experiences that actually exist in or near ${destination}.

Return JSON:
{
  "activities": [
    {
      "id": "unique-slug",
      "title": "Activity name",
      "category": "nature|culture|sightseeing|food|adventure",
      "duration": "e.g. 3 hours",
      "price_gbp": 25,
      "emissions_kg": 0.2,
      "eco_score": 95,
      "description": "2-sentence engaging description",
      "eco_tags": ["Tag1", "Tag2", "Tag3"],
      "why_eco": "One sentence on why this is eco-friendly",
      "rating": 4.7,
      "reviews": 1240,
      "featured": false
    }
  ]
}`;
  return ask(prompt);
}

/* ═══════════════════════════════════════════════════════════
   3. ECO TIPS
   Called from SustainabilityPage for destination-specific tips.
═══════════════════════════════════════════════════════════ */
export async function getEcoTips({ from, to, travelers }) {
  const dest = to || "your destination";
  const prompt = `
Generate 6 specific, actionable eco travel tips for a trip from ${from || "home"} to ${dest} for ${travelers || 2} travellers.
Cover: sustainable transport within the destination, eco accommodation, local seasonal food, waste reduction, supporting local economy, carbon offsetting.

Return JSON:
{
  "destination": "${dest}",
  "tips": [
    {
      "icon": "single emoji",
      "title": "Short title (3-5 words)",
      "detail": "2 practical sentences. Be specific to ${dest}.",
      "category": "transport|food|accommodation|waste|local|offset"
    }
  ]
}`;
  return ask(prompt);
}

/* ═══════════════════════════════════════════════════════════
   4. DAY-BY-DAY ITINERARY
   Called from MyTripPage to generate a real itinerary.
═══════════════════════════════════════════════════════════ */
export async function generateItinerary({ from, to, departure, returnDate, travelers, selectedTransport, savedActivities, budget }) {
  const actNames = savedActivities?.length
    ? savedActivities.map((a) => a.title).join(", ")
    : "flexible — suggest eco-friendly options";

  const nights = (() => {
    if (departure && returnDate) {
      const d = Math.round((new Date(returnDate) - new Date(departure)) / 86400000);
      return d > 0 ? d : 3;
    }
    return 3;
  })();

  const prompt = `
Create a ${nights}-night eco travel itinerary:
- Route: ${from || "London"} → ${to || "Paris"}
- Departure: ${departure || "upcoming"}
- Nights: ${nights}
- Travellers: ${travelers || 2}
- Transport: ${selectedTransport?.type || selectedTransport?.title || "Train"}
- Budget: £${budget || 1000} total
- Activities to include: ${actNames}

Return JSON (dates relative to departure, use "Day 1", "Day 2" etc.):
{
  "days": [
    {
      "day": "Day 1",
      "date_label": "Mon, 10 Mar",
      "items": [
        {
          "time": "08:00",
          "label": "Item name",
          "detail": "duration · £price/person",
          "type": "transport|activity|accommodation|food",
          "eco": true
        }
      ]
    }
  ],
  "total_cost_gbp": 700,
  "carbon_kg_total": 12.4,
  "carbon_saved_pct": 87,
  "eco_highlights": ["highlight 1", "highlight 2", "highlight 3"]
}`;
  return ask(prompt);
}
