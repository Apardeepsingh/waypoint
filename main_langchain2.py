import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
import os
import httpx

load_dotenv() 

app = FastAPI(title="Sustainable Itinerary Planner")

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")


class ItineraryRequest(BaseModel):
    budget: float
    from_location: str          # e.g "Bangor, UK"
    date: str                   # e.g "2026-03-15"
    time: str                   # e.g "09:00 AM"
    location: str               # destination e.g "London"
    people: int

class OptionAnalysis(BaseModel):
    option: str
    cost_per_person: str
    total_cost: str
    co2_per_person: str
    total_co2: str
    trade_off_reasoning: str

class ItineraryStep(BaseModel):
    step: int
    time: str
    activity: str
    type: str
    chosen_option: str
    cost_per_person: str
    total_cost: str
    co2_per_person: str
    total_co2: str
    options_considered: List[OptionAnalysis]
    decision_reason: str

class ItineraryResponse(BaseModel):
    itinerary: List[ItineraryStep]
    total_cost: str
    total_co2_emissions: str
    budget_remaining: str
    sustainability_rating: str
    trade_off_summary: str



async def get_commute_options(from_location: str, to_location: str, people: int) -> list:
   
    modes = ["driving", "transit", "bicycling", "walking"]

    # Rough price estimate per person per km
    price_per_km = {
        "driving": 0.05,
        "transit": 0.08,
        "bicycling": 0.0,
        "walking": 0.0,
    }

    mode_labels = {
        "driving": "car",
        "transit": "bus/train",
        "bicycling": "bicycle",
        "walking": "walking",
    }

    commute_options = []

    async with httpx.AsyncClient() as client:
        for mode in modes:
            try:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/distancematrix/json",
                    params={
                        "origins": from_location,
                        "destinations": to_location,
                        "mode": mode,
                        "units": "metric",
                        "key": GOOGLE_MAPS_API_KEY,
                    },
                    timeout=10,
                )
                data = resp.json()
                element = data["rows"][0]["elements"][0]

                if element["status"] == "OK":
                    distance_km = round(element["distance"]["value"] / 1000, 1)
                    duration_text = element["duration"]["text"]
                    price = round(price_per_km[mode] * distance_km, 2)

                    commute_options.append({
                        "mode": mode_labels[mode],
                        "price_per_person": price,
                        "distance_km": distance_km,
                        "duration": duration_text,
                    })
            except Exception:
                continue     # skip if mode not available (e.g. no transit route)

    return commute_options


async def get_activity_options(location: str) -> list:
    """
    Calls Google Places Nearby Search to find activities at destination.
    Returns activities with estimated prices.
    """
    async with httpx.AsyncClient() as client:

        # Step 1: Geocode the destination
        geo_resp = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": location, "key": GOOGLE_MAPS_API_KEY},
            timeout=10,
        )
        geo_data = geo_resp.json()
        if not geo_data["results"]:
            raise HTTPException(status_code=400, detail=f"Could not geocode: {location}")

        lat = geo_data["results"][0]["geometry"]["location"]["lat"]
        lng = geo_data["results"][0]["geometry"]["location"]["lng"]

        # Step 2: Search multiple activity types nearby
        activity_types = [
            "tourist_attraction",
            "museum",
            "park",
            "amusement_park",
            "art_gallery",
        ]

        activities = []
        seen = set()

        for activity_type in activity_types:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                params={
                    "location": f"{lat},{lng}",
                    "radius": 5000,                 # 5km radius
                    "type": activity_type,
                    "key": GOOGLE_MAPS_API_KEY,
                },
                timeout=10,
            )
            data = resp.json()

            for place in data.get("results", [])[:3]:   # top 3 per type
                name = place.get("name")
                if name in seen:
                    continue
                seen.add(name)

                # Estimate price from Google's price_level (0–4)
                price_level = place.get("price_level", 0)
                price_map = {0: 0, 1: 5, 2: 15, 3: 30, 4: 60}

                activities.append({
                    "name": name,
                    "type": activity_type.replace("_", " "),
                    "price_per_person": price_map.get(price_level, 10),
                    "rating": place.get("rating", "N/A"),
                })

    return activities[:8] 




# --- LLM ---
def get_chain():
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
    structured_llm = llm.with_structured_output(
        ItineraryResponse, 
        method="json_schema",
        include_raw=False
    )

    # --- Prompt ---
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a sustainable travel itinerary planner and a smart decision-making engine.

        ── CO2 CALCULATION (always per person) ──────────────────────────────
        Formula: (vehicle total CO2/km) ÷ (passenger capacity) × distance
        f
        Default vehicle stats:
        - car:      (102g CO2/km ÷ number of people travelling together)Xdistance
        - bus:      (1000g CO2/km ÷ 30 (avg capacity))Xdistance
        - train:    (50g CO2/km ÷ 200 (avg capacity))Xdistance
        - ferry:    (200g CO2/km ÷ 150 (avg capacity))Xdistance
        - flight:   (200g CO2/km ÷ 150 (avg capacity))Xdistance
        
        ── SMART TRADE-OFF REASONING (most important) ────────────────────────
        Never hardcode rules. Instead reason dynamically using these principles:

        1. SUBSTANTIAL difference in BOTH cost and CO2:
        → Pick the option that wins on both. Easy choice.

        2. Big cost difference, small CO2 difference:
        → Favour the cheaper option. Small CO2 sacrifice is worth significant savings.
        → "Substantial" CO2 difference = more than 20% difference in per-person CO2
        → "Substantial" cost difference = more than 20% difference in per-person cost

        3. Big CO2 difference, small cost difference:
        → Favour the lower CO2 option. Small extra cost is worth significant emission savings.

        4. Both cost and CO2 are similar (within 10% of each other):
        → Pick based on user experience / practicality for the group size and location.

        5. Budget pressure (remaining budget is tight):
        → Shift weight more towards cost savings, even if CO2 is slightly higher.

        6. One option blows the budget:
        → Eliminate it entirely, even if it has best CO2.

        7. Group size effect:
        → Shared transport (bus/train) becomes increasingly better per-person as group grows.
        → Private options (car) get better only if group fills the vehicle.

        8. Return journey:
        → Always include return trip. Double the commute cost and CO2.
        → If budget is tight after activities, consider if a cheaper return option exists.

        For EVERY option considered, show your full trade-off reasoning transparently
        so the user understands why each decision was made.

        ── ITINERARY RULES ───────────────────────────────────────────────────
        - Only pick from options the user provided
        - Build full day: depart → activities → return  
        - Track running total cost and CO2 at each step
        - If budget runs tight mid-itinerary, adjust remaining steps accordingly
        - Optimize for: lowest total CO2 first, then lowest cost as tiebreaker
        BUT apply smart trade-off reasoning above, not rigid rules"""),

        ("human", """Plan the most sustainable and budget-smart itinerary for:

        Budget: {budget} (total for the whole group)
        Date: {date}
        Start Time: {time}
        Destination: {location}
        Number of People: {people}

        Commute options (price per person): {commute_options}
        Activity options (price per person): {activity_options}

        For each step:
        - Analyse ALL available options with their CO2 and cost
        - Apply smart trade-off reasoning to pick the best one
        - Show why other options were rejected
        - Track remaining budget after each step""")
    ])

    return prompt | structured_llm



@app.post("/itinerary", response_model=ItineraryResponse)
async def generate_itinerary(body: ItineraryRequest):
    try:

        print("Fetching commute options...")
        # 1. Get real commute options from Google Maps Distance Matrix
        commute_options = await get_commute_options(
            body.from_location, body.location, body.people
        )
        print(f"Commute options: {commute_options}")

        if not commute_options:
            raise HTTPException(status_code=400, detail="No commute routes found")

        print("Fetching activity options...")
        # 2. Get real activities from Google Places
        activity_options = await get_activity_options(body.location)
        print(f"Activity options: {activity_options}")
        
        if not activity_options:
            raise HTTPException(status_code=400, detail="No activities found at destination")

        # 3. Pass everything to Gemini via LangChain
        chain = get_chain()
        response = chain.invoke({
            "budget": body.budget,
            "from_location": body.from_location,
            "date": body.date,
            "time": body.time,
            "location": body.location,
            "people": body.people,
            "commute_options": commute_options,
            "activity_options": activity_options,
        })

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

