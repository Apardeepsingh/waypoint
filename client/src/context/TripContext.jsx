/* ─────────────────────────────────────────────────────────
   TripContext — global trip state shared across all pages.
   Persisted to localStorage under a per-user key so each
   account keeps its own in-progress trip across sessions.
───────────────────────────────────────────────────────── */
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const TripContext = createContext(null);

const EMPTY = {
  from:              "",
  to:                "",
  fromPlace:         null,
  toPlace:           null,
  distanceKm:        null,
  travelers:         2,
  departure:         "",
  time:              "09:00",
  returnDate:        "",
  budget:            2000,
  selectedTransport: null,
  savedActivities:   [],
  aiAnalysis:        null,
  aiItinerary:       null,
  carbonAnalysis:    null,
  /* Full AI itinerary plan returned by the Python backend (/api/itinerary) */
  tripPlan:          null,
};

/* ── Storage helpers ── */
function storageKey() {
  const uid = localStorage.getItem("waypoint_active_user_id") ?? "guest";
  return `waypoint_current_trip_${uid}`;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

function saveToStorage(trip) {
  try {
    const serialisable = {
      ...trip,
      selectedTransport: trip.selectedTransport
        ? { ...trip.selectedTransport, Icon: undefined }
        : null,
      savedActivities: (trip.savedActivities ?? []).map((a) => ({
        ...a,
        Icon: undefined,
      })),
    };
    localStorage.setItem(storageKey(), JSON.stringify(serialisable));
  } catch {
    /* quota exceeded — silently skip */
  }
}

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(trip);
  }, [trip]);

  /* Listen for user changes (login / logout / account switch).
     Both listeners are captured in named variables so both are
     properly removed on cleanup — fixes the memory leak. */
  useEffect(() => {
    const reload = () => setTrip(loadFromStorage());
    const onStorage = (e) => { if (e.key === "waypoint_active_user_id") reload(); };

    window.addEventListener("waypoint_user_changed", reload);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("waypoint_user_changed", reload);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const updateTrip = useCallback((updates) => {
    setTrip((prev) => ({ ...prev, ...updates }));
  }, []);

  const startNewTrip = useCallback((searchData) => {
    setTrip({ ...EMPTY, ...searchData });
  }, []);

  const selectTransport = useCallback((option) => {
    setTrip((prev) => ({
      ...prev,
      selectedTransport: option,
      aiItinerary:       null,
      carbonAnalysis:    null,
      savedActivities:   [],
    }));
  }, []);

  const toggleActivity = useCallback((activity) => {
    setTrip((prev) => ({
      ...prev,
      savedActivities: prev.savedActivities.find((a) => a.id === activity.id)
        ? prev.savedActivities.filter((a) => a.id !== activity.id)
        : [...prev.savedActivities, { ...activity, Icon: undefined }],
    }));
  }, []);

  const setAiAnalysis = useCallback((analysis) => {
    setTrip((prev) => ({ ...prev, aiAnalysis: analysis }));
  }, []);

  const setAiItinerary = useCallback((itinerary) => {
    setTrip((prev) => ({ ...prev, aiItinerary: itinerary }));
  }, []);

  const setCarbonAnalysis = useCallback((analysis) => {
    setTrip((prev) => ({ ...prev, carbonAnalysis: analysis }));
  }, []);

  /* Store the full itinerary plan returned by the Python backend */
  const setTripPlan = useCallback((plan) => {
    setTrip((prev) => ({ ...prev, tripPlan: plan }));
  }, []);

  const reloadForUser = useCallback(() => {
    setTrip(loadFromStorage());
  }, []);

  const clearTrip = useCallback(() => {
    setTrip(EMPTY);
    try { localStorage.removeItem(storageKey()); } catch { /* ignore */ }
  }, []);

  return (
    <TripContext.Provider value={{
      trip,
      updateTrip,
      startNewTrip,
      selectTransport,
      toggleActivity,
      setAiAnalysis,
      setAiItinerary,
      setCarbonAnalysis,
      setTripPlan,
      reloadForUser,
      clearTrip,
    }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be called inside <TripProvider>");
  return ctx;
}
