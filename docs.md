# Waypoint — Sustainable Travel Website: Implementation Plan

A full-stack travel platform focused on **eco-conscious journeys**, helping users plan trips while tracking their carbon footprint, discovering sustainable activities, and understanding the environmental impact of their travel choices.

---

## Project Overview

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite), React Router, Vanilla CSS |
| Backend | Node.js + Express.js |
| Auth | Browser `localStorage` (AsyncStorage pattern) |
| API Integration | **OpenRouter API** (AI carbon analysis + eco-comparison), Transport/Travel API |
| State Management | React Context / useState + useEffect |

---

## Proposed Project Structure

```
WayPoint/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/            # Images, icons, fonts
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── EcoBadge.jsx
│   │   │   ├── TransportCard.jsx
│   │   │   ├── ActivityCard.jsx
│   │   │   └── SearchForm.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── PlanTripPage.jsx
│   │   │   ├── ActivitiesPage.jsx
│   │   │   ├── SustainabilityPage.jsx
│   │   │   ├── MyTripPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Auth state + localStorage
│   │   │   └── TripContext.jsx  # Trip/session state
│   │   ├── services/
│   │   │   └── api.js           # Axios API calls to backend
│   │   ├── utils/
│   │   │   └── carbon.js        # CO₂ calculation helpers
│   │   ├── index.css            # Global design tokens
│   │   ├── App.jsx              # Router setup
│   │   └── main.jsx
│   └── package.json
│
└── server/                    # Node + Express Backend
    ├── routes/
    │   ├── auth.js
    │   ├── trips.js
    │   ├── activities.js
    │   └── carbon.js
    ├── controllers/
    ├── middleware/
    │   └── auth.js              # JWT verification
    ├── config/
    │   └── .env                 # API keys
    ├── index.js                 # Entry point
    └── package.json
```

---

## Pages & Features

### 1. Home Page
Matches the Figma hero screen with the search form.

- **Hero Section**: Full-viewport background image, tagline "Plan Your Sustainable Dream Journey", subtext about carbon tracking
- **Search Form** (white card overlay):
  - `FROM` — departure city/airport (autocomplete)
  - `TO` — destination city
  - `DEPARTURE` + `RETURN` date pickers
  - `TRAVELLERS` dropdown
  - `BUDGET` slider ($200 – $10k+)
  - **"Plan My Sustainable Trip →"** CTA button (green)
- **Navigation**: Logo + Eco badge, links (Home, Plan Trip, Activities, Sustainability, My Trip), "Plan a Trip" button

---

### 2. Plan Trip Page
Matches the "Choose Your Journey" screen.

- **Header**: Route summary (London → Paris · 2 Travellers · 10–17 Mar), avg CO₂ badge, Filters button
- **Filter Tabs**: All Options | 💰 Cheapest | ⚡ Fastest | 🌿 Greenest
- **Eco Tip Banner**: AI-generated tip from OpenRouter (e.g. "Train saves 85.2 kg CO₂ — like planting 4 trees")
- **Transport Cards** (one per option):
  - Operator name & type (e.g. Eurostar High-Speed Train)
  - Departure time → Duration → Arrival time
  - **Eco Score bar** (green gradient) + CO₂/person label
  - Price + "Best Eco" / "Best Value" badge
  - "Select" button
  - "Show amenities ↓" expandable section
- Eco Score is ranked by OpenRouter AI from lowest → highest CO₂

---

### 3. Activities Page
Matches the "Activities & Experiences" screen.

- **Header**: Destination + date, subtitle "Curated eco-friendly experiences"
- **Category Filter Pills**: All | 🌿 Nature | 🏛 Culture | 🏛 Sightseeing | 🍽 Food | 🌄 Adventure
- **Sustainability Notice**: Green info bar about vetting process
- **Activity Cards** (grid layout):
  - Cover image with eco badge ("Excellent", "Featured")
  - Price tag overlay (bottom-right)
  - Category icon + duration
  - Title, description
  - Tags (UNESCO, Historic, Eco-Certified, etc.)
  - ❤️ Wishlist / save button

---

### 4. Sustainability Page
Matches the "Travel That Gives Back to the Planet" screen.

- **Hero with background image**: Tagline, subtext about CO₂ calculation
- **Impact Stats Row**:
  - 8% of global CO₂ from tourism
  - 90% of travellers want sustainable options
  - 60% emissions saved by choosing train over flight
  - 186K tonnes CO₂ saved by Waypoint users
- **Tabs**:
  - 📊 How We Calculate — OpenRouter-generated breakdown of carbon formula per transport mode
  - 🌱 Eco Travel Tips — AI-generated actionable tips
  - 🌍 Global Data — charts/facts

---

### 5. My Trip Page
Saved itinerary and eco summary.

- Requires login (protected route)
- Displays saved transport + activities selections
- Shows total CO₂ for the trip, trees equivalent, km-of-driving equivalent
- Allows editing / removing selections

---

### 6. Auth (Login / Sign Up) — Multi-Account Browser Support

Multiple users can create and switch accounts **within the same browser**. Each account is completely isolated.

**localStorage Structure:**
```
waypoint_accounts        → JSON array of all registered accounts in this browser
waypoint_active_user_id  → ID of the currently logged-in user

waypoint_user_{id}       → { id, name, email, passwordHash, createdAt }
waypoint_trips_{id}      → saved trips for that user
waypoint_activities_{id} → saved/wishlisted activities for that user
```

**How It Works:**
- On **Sign Up**: a unique `user_id` (UUID) is generated → account added to `waypoint_accounts` array → user data stored under `waypoint_user_{id}`
- On **Login**: email/password matched against `waypoint_accounts` → `waypoint_active_user_id` set to matched user's ID
- On **Logout**: `waypoint_active_user_id` is cleared (accounts list remains so others can log back in)
- `AuthContext` exposes `{ user, login, logout, signup, isAuthenticated, allAccounts }`
- Protected routes redirect to login if no `waypoint_active_user_id` is found
- Each user's trip and activity data is stored under **their own unique key**, so accounts never share or overwrite each other's data

---

## Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Login + |
| GET | `/api/trips/search` | Search transport options (from, to, date, travellers) |
| POST | `/api/carbon/analyze` | Send options to OpenRouter → returns ranked CO₂ list + eco tip |
| GET | `/api/activities` | List activities by destination + category |
| POST | `/api/trips/save` | Save a trip to user's profile |
| GET | `/api/trips/my` | Get saved trips for logged-in user |

---

## External APIs (to be integrated via backend)

| API | Purpose |
|-----|---------|
| **OpenRouter API** | AI-powered CO₂ analysis — ranks transport modes by emissions, generates Eco Tip banners, explains calculations in plain language |
| **Amadeus Travel API** (or similar) | Flight + train + bus search results, schedules, and pricing |
| **Unsplash / Pexels API** | Activity and destination imagery |

### How OpenRouter Powers the Carbon Layer

The Express backend sends trip data to **OpenRouter** (model: `google/gemini-flash-1.5` or `mistralai/mistral-7b-instruct`) to:

1. **Rank transport options** by CO₂/person (lowest → highest) and assign Eco Scores
2. **Generate the Eco Tip banner** displayed on the Plan Trip page — e.g. *"Taking the train saves 85.2 kg CO₂ — equivalent to planting 4 trees or driving 340 km less"*
3. **Explain the methodology** in plain language for the Sustainability page's "How We Calculate" tab
4. **Suggest eco travel tips** tailored to the destination

**Example prompt flow (backend → OpenRouter):**
```
Route: London → Paris (340 km)
Options: Eurostar train, FlixBus coach, EasyJet flight
Travellers: 2
→ Returns: ranked options with kg CO₂/person, Eco Score 0-100, and eco tip text
```

> [!IMPORTANT]
> The OpenRouter API key must be stored in `server/config/.env` and **never** sent to the frontend. All OpenRouter calls are proxied through the Express backend.

---

## Carbon Footprint Calculation Logic

The base CO₂ formula (used as input to OpenRouter for verification and display):

```
CO₂ (kg) = distance_km × emission_factor × num_passengers
```

| Transport Mode | Emission Factor (kg CO₂/km/person) |
|----------------|--------------------------------------|
| ✈️ Flight (short-haul) | 0.255 |
| 🚂 High-speed Train | 0.006 |
| 🚌 Coach / Bus | 0.027 |
| 🚗 Car | 0.171 |
| 🚗 EV Car | 0.053 |

The **Eco Score** is a normalized 0–100 score relative to the flight baseline for the same route. OpenRouter AI uses these factors as context to generate human-readable comparisons.

---

## Design System

| Token | Value |
|-------|-------|
| Primary Green | `#2D6A4F` |
| Light Green | `#52B788` |
| Eco Pill BG | `#D8F3DC` |
| Background | `#F9FAF7` |
| Text Dark | `#1B2618` |
| Font | `Inter` (Google Fonts) |

Dark green navbar and page headers match the Figma design. Cards use white with subtle shadows and green accents.

---

## Verification Plan

### Manual Browser Testing (after implementation)
1. Open `http://localhost:5173` — verify Home page hero, search form, and navbar render correctly
2. Fill in search form and submit — verify redirect to Plan Trip page with transport cards
3. Click a transport card "Select" — verify it saves to My Trip
4. Navigate to Activities — verify category filter pills work
5. Navigate to Sustainability — verify stats and tabs render
6. Click "Plan a Trip" / "My Trip" without login — verify redirect to Login page
7. Sign up with email/password — verify user is created and stored in `localStorage`
8. Login — verify user session persists on page refresh
9. Logout — verify session is cleared and protected pages redirect

### API Endpoint Testing (Postman or curl)
```bash
# Test auth
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test User"}'

# Test carbon analysis via OpenRouter
curl -X POST http://localhost:3001/api/carbon/analyze \
  -H "Content-Type: application/json" \
  -d '{"from":"London","to":"Paris","distance":340,"travellers":2,"options":["train","bus","flight"]}'
```

### Carbon Calculation Accuracy Check
- London → Paris ≈ 340 km by Eurostar
- Expected: 340 × 0.006 = **4.08 kg CO₂/person** (matches Figma's "4.2 kg CO₂/person" ✓)
- Flight equivalent: 340 × 0.255 = **86.7 kg CO₂/person**
- OpenRouter tip: "Train saves ~82 kg CO₂" — matches Figma eco tip banner ✓

---

## Implementation Order (Phased)

```
Phase 1:  Project scaffold (Vite + React, Express server)
Phase 2:  Design system (CSS variables, fonts, base layout)
Phase 3:  Navbar + shared components
Phase 4:  Home page (hero + search form)
Phase 5:  Auth (Login/Signup UI + localStorage)
Phase 6:  Backend API setup + OpenRouter integration
Phase 7:  Plan Trip page (transport cards + OpenRouter eco scores)
Phase 8:  Activities page (grid + filters)
Phase 9:  Sustainability page (stats + OpenRouter-generated tabs)
Phase 10: My Trip page (protected, saved data)
Phase 11: Polish, animations, responsive design
```
