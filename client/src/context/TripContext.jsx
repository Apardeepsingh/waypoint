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
  returnDate:        "",
  budget:            2000,
  selectedTransport: null,
  savedActivities:   [],
  aiAnalysis:        null,
  aiItinerary:       null,
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
    const parsed = JSON.parse(raw);
    /* Re-attach the Icon field (functions can't be serialised) — it will
       be re-resolved by PlanTripPage when the card is rebuilt. */
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function saveToStorage(trip) {
  try {
    /* Strip non-serialisable fields (Icon, React components) before saving */
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

  /* Persist every change to localStorage */
  useEffect(() => {
    saveToStorage(trip);
  }, [trip]);

  /* When active user changes (login / logout / account switch)
     reload the right data — listens to both the same-tab custom event
     and the cross-tab native storage event. */
  useEffect(() => {
    const reload = () => setTrip(loadFromStorage());
    window.addEventListener("waypoint_user_changed", reload);
    window.addEventListener("storage", (e) => {
      if (e.key === "waypoint_active_user_id") reload();
    });
    return () => {
      window.removeEventListener("waypoint_user_changed", reload);
    };
  }, []);

  /* Merge partial updates */
  const updateTrip = useCallback((updates) => {
    setTrip((prev) => ({ ...prev, ...updates }));
  }, []);

  /* Set the chosen transport option */
  const selectTransport = useCallback((option) => {
    setTrip((prev) => ({ ...prev, selectedTransport: option }));
  }, []);

  /* Toggle an activity in/out of the saved list */
  const toggleActivity = useCallback((activity) => {
    setTrip((prev) => ({
      ...prev,
      savedActivities: prev.savedActivities.find((a) => a.id === activity.id)
        ? prev.savedActivities.filter((a) => a.id !== activity.id)
        : [...prev.savedActivities, { ...activity, Icon: undefined }],
    }));
  }, []);

  /* Save AI analysis result */
  const setAiAnalysis = useCallback((analysis) => {
    setTrip((prev) => ({ ...prev, aiAnalysis: analysis }));
  }, []);

  /* Save AI itinerary result */
  const setAiItinerary = useCallback((itinerary) => {
    setTrip((prev) => ({ ...prev, aiItinerary: itinerary }));
  }, []);

  /* Reload trip data for a specific user (called on login) */
  const reloadForUser = useCallback(() => {
    setTrip(loadFromStorage());
  }, []);

  /* Reset everything */
  const clearTrip = useCallback(() => {
    setTrip(EMPTY);
    try { localStorage.removeItem(storageKey()); } catch { /* ignore */ }
  }, []);

  return (
    <TripContext.Provider value={{
      trip,
      updateTrip,
      selectTransport,
      toggleActivity,
      setAiAnalysis,
      setAiItinerary,
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
