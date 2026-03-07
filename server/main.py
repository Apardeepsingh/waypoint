import os
import json
import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

app = FastAPI(title="WayPoint Itinerary Planner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)


# ── Request / Response models ──────────────────────────────────────────────────

class ItineraryRequest(BaseModel):
    budget: float
    from_location: str
    date: str
    time: str
    location: str           # destination
    people: int


class ActivitiesRequest(BaseModel):
    location: str
    people: int
    budget_remaining: float


# ── CO2 formula helpers ────────────────────────────────────────────────────────
# Formula: (vehicle total CO2/km) ÷ (passenger capacity) × distance
#   car:    (102g ÷ number of people travelling together) × distance_km
#   bus:    (1000g ÷ 30) × distance_km
#   train:  (50g ÷ 200) × distance_km
#   ferry:  (200g ÷ 150) × distance_km
#   flight: (200g ÷ 150) × distance_km

def co2_per_person_kg(mode: str, distance_km: float, people: int) -> float:
    factors = {
        "car":    102.0 / max(people, 1),
        "bus":    1000.0 / 30,
        "train":  50.0 / 200,
        "ferry":  200.0 / 150,
        "flight": 200.0 / 150,
        # Human-powered modes — treated as effectively zero tailpipe emissions
        "bicycle": 0.0,
        "walking": 0.0,
    }
    g_per_km = factors.get(mode, 100.0)
    return round((g_per_km * distance_km) / 1000, 2)   # convert g → kg


# Price estimate per person per km (rough real-world proxies)
PRICE_PER_KM = {
    "driving":   0.05,   # car fuel + wear
    "transit":   0.08,   # rail/bus ticket
    "bicycling": 0.0,
    "walking":   0.0,
}

MODE_LABEL = {
    "driving":   "car",
    "transit":   "bus/train",
    "bicycling": "bicycle",
    "walking":   "walking",
}


# ── Google Maps helpers ────────────────────────────────────────────────────────

async def get_commute_options(from_location: str, to_location: str, people: int) -> list:
    """
    Query Google Maps Distance Matrix for all travel modes IN PARALLEL,
    then return the results. Using asyncio.gather cuts the sequential
    4-request chain (~4s) down to a single round-trip (~1s).
    """
    modes = ["driving", "transit", "bicycling", "walking"]

    async def fetch_mode(client: httpx.AsyncClient, mode: str):
        try:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/distancematrix/json",
                params={
                    "origins":      from_location,
                    "destinations": to_location,
                    "mode":         mode,
                    "units":        "metric",
                    "key":          GOOGLE_MAPS_API_KEY,
                },
                timeout=10,
            )
            data    = resp.json()
            element = data["rows"][0]["elements"][0]
            if element["status"] != "OK":
                return None

            distance_km   = round(element["distance"]["value"] / 1000, 1)
            duration_text = element["duration"]["text"]
            price         = round(PRICE_PER_KM[mode] * distance_km, 2)
            label         = MODE_LABEL[mode]
            co2           = co2_per_person_kg(
                "car" if mode == "driving" else "bus" if mode == "transit" else label,
                distance_km,
                people,
            )
            return {
                "mode":              label,
                "price_per_person":  price,
                "total_price":       round(price * people, 2),
                "distance_km":       distance_km,
                "duration":          duration_text,
                "co2_per_person_kg": co2,
                "total_co2_kg":      round(co2 * people, 2),
            }
        except Exception:
            return None

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[fetch_mode(client, m) for m in modes])

    return [r for r in results if r is not None]


async def get_activity_options(location: str) -> list:
    """
    Geocode the destination then search Google Places for top activities.
    """
    async with httpx.AsyncClient() as client:
        geo_resp = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": location, "key": GOOGLE_MAPS_API_KEY},
            timeout=10,
        )
        geo_data = geo_resp.json()
        if not geo_data.get("results"):
            raise HTTPException(status_code=400, detail=f"Could not geocode: {location}")

        lat = geo_data["results"][0]["geometry"]["location"]["lat"]
        lng = geo_data["results"][0]["geometry"]["location"]["lng"]

        activity_types = [
            "tourist_attraction",
            "museum",
            "park",
            "amusement_park",
            "art_gallery",
        ]

        activities = []
        seen = set()
        price_map = {0: 0, 1: 5, 2: 15, 3: 30, 4: 60}

        for activity_type in activity_types:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                params={
                    "location": f"{lat},{lng}",
                    "radius":   5000,
                    "type":     activity_type,
                    "key":      GOOGLE_MAPS_API_KEY,
                },
                timeout=10,
            )
            data = resp.json()
            for place in data.get("results", [])[:3]:
                name = place.get("name")
                if not name or name in seen:
                    continue
                seen.add(name)
                activities.append({
                    "name":             name,
                    "type":             activity_type.replace("_", " "),
                    "price_per_person": price_map.get(place.get("price_level", 0), 10),
                    "rating":           place.get("rating", "N/A"),
                    "vicinity":         place.get("vicinity", ""),
                })

    return activities[:10]


# ── OpenAI helpers ─────────────────────────────────────────────────────────────

ITINERARY_SYSTEM_PROMPT = """You are a sustainable travel itinerary planner and a smart decision-making engine.

── CO2 CALCULATION (always per person) ──────────────────────────────
Formula: (vehicle total CO2/km) ÷ (passenger capacity) × distance

Default vehicle stats:
- car:    (102g CO2/km ÷ number of people travelling together) × distance
- bus:    (1000g CO2/km ÷ 30 avg capacity) × distance
- train:  (50g CO2/km ÷ 200 avg capacity) × distance
- ferry:  (200g CO2/km ÷ 150 avg capacity) × distance
- flight: (200g CO2/km ÷ 150 avg capacity) × distance

── SMART TRADE-OFF REASONING ────────────────────────────────────────
Reason dynamically using these principles:

1. SUBSTANTIAL difference in BOTH cost and CO2 → pick the option that wins on both.
2. Big cost difference, small CO2 difference → favour the cheaper option.
   "Substantial" = more than 20% difference.
3. Big CO2 difference, small cost difference → favour the lower CO2 option.
4. Both cost and CO2 similar (within 10%) → pick based on practicality.
5. Budget pressure → shift weight towards cost savings.
6. One option blows the budget → eliminate it entirely.
7. Group size effect → shared transport gets better per-person as group grows.
8. Return journey → always include return trip; double the commute cost and CO2.

For EVERY option considered, show your full trade-off reasoning transparently.

── ITINERARY RULES ──────────────────────────────────────────────────
- Build full day: depart → activities → return
- Track running total cost and CO2 at each step
- If budget is tight, adjust remaining steps
- Optimize for: lowest total CO2 first, then lowest cost as tiebreaker
- Apply smart trade-off reasoning above, not rigid rules

── OUTPUT FORMAT ────────────────────────────────────────────────────
Respond with ONLY a valid JSON object exactly matching this structure (no markdown, no explanation):
{
  "itinerary": [
    {
      "step": 1,
      "time": "09:00 AM",
      "activity": "Depart for [destination]",
      "type": "Commute",
      "chosen_option": "Car",
      "cost_per_person": "21.37",
      "total_cost": "85.48",
      "co2_per_person": "10.90 kg",
      "total_co2": "43.60 kg",
      "options_considered": [
        {
          "option": "Car",
          "cost_per_person": "21.37",
          "total_cost": "85.48",
          "co2_per_person": "10.90 kg",
          "total_co2": "43.60 kg",
          "trade_off_reasoning": "..."
        }
      ],
      "decision_reason": "..."
    }
  ],
  "total_cost": "170.96",
  "total_co2_emissions": "87.20 kg",
  "budget_remaining": "29.04",
  "sustainability_rating": "Low",
  "trade_off_summary": "..."
}"""


ACTIVITIES_SYSTEM_PROMPT = """You are an eco-travel activity recommender.
Given a list of real places from Google Maps, select and rank the best spots for a group visit.
For each activity add an eco_note explaining its sustainability value.
Respond with ONLY valid JSON, no markdown, no explanation."""


async def call_openai_itinerary(payload: dict) -> dict:
    user_msg = f"""Plan the most sustainable and budget-smart itinerary for:

Budget: {payload['budget']} (total for the whole group, in GBP)
Date: {payload['date']}
Start Time: {payload['time']}
From: {payload['from_location']}
Destination: {payload['location']}
Number of People: {payload['people']}

Commute options (real data from Google Maps, price per person):
{json.dumps(payload['commute_options'], indent=2)}

Activity options (real data from Google Places, price per person):
{json.dumps(payload['activity_options'], indent=2)}

For each step:
- Analyse ALL available commute options with their CO2 and cost
- Apply smart trade-off reasoning to pick the best one
- Show why other options were rejected
- Track remaining budget after each step
- Include realistic activity selection from the provided options
- Always finish with a return journey step"""

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": ITINERARY_SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


async def call_openai_activities(location: str, places: list, people: int, budget_remaining: float) -> dict:
    user_msg = f"""Destination: {location}
Group size: {people} people
Remaining budget for activities: £{budget_remaining}

Available places from Google Maps:
{json.dumps(places, indent=2)}

Select the best 6-8 activities from this list. For each:
- Keep the real name and type from Google Maps
- Add an eco_note (1 sentence on why it's eco-friendly or low-impact)
- Estimate whether it fits within the budget
- Sort by eco score (most sustainable first)

Return JSON:
{{
  "activities": [
    {{
      "id": "slug-from-name",
      "title": "Place name",
      "category": "nature|culture|sightseeing|food|adventure",
      "type": "tourist attraction|museum|park|etc",
      "price_per_person": 0,
      "total_price": 0,
      "eco_note": "Why this is a good eco choice",
      "rating": 4.5,
      "vicinity": "Address or area",
      "eco_score": 85,
      "within_budget": true
    }}
  ]
}}"""

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": ACTIVITIES_SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.5,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/itinerary")
async def generate_itinerary(body: ItineraryRequest):
    try:
        if not GOOGLE_MAPS_API_KEY:
            raise HTTPException(status_code=500, detail="GOOGLE_MAPS_API_KEY not configured")
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

        # Fetch commute options and activity options IN PARALLEL
        commute_options, activity_options = await asyncio.gather(
            get_commute_options(body.from_location, body.location, body.people),
            get_activity_options(body.location),
        )
        if not commute_options:
            raise HTTPException(status_code=400, detail="No commute routes found for this journey")
        if not activity_options:
            raise HTTPException(status_code=400, detail="No activities found at destination")

        result = await call_openai_itinerary({
            "budget":          body.budget,
            "from_location":   body.from_location,
            "date":            body.date,
            "time":            body.time,
            "location":        body.location,
            "people":          body.people,
            "commute_options": commute_options,
            "activity_options": activity_options,
        })

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/activities")
async def get_activities(body: ActivitiesRequest):
    try:
        if not GOOGLE_MAPS_API_KEY:
            raise HTTPException(status_code=500, detail="GOOGLE_MAPS_API_KEY not configured")

        places = await get_activity_options(body.location)
        if not places:
            raise HTTPException(status_code=400, detail="No places found at destination")

        result = await call_openai_activities(
            body.location, places, body.people, body.budget_remaining
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
