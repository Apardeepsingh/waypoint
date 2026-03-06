/* ─────────────────────────────────────────────────────────
   TripContext — global trip state shared across all pages.

   Stores:
   • Route info (from/to + coordinates + distance)
   • Search params (dates, travelers, budget)
   • Selected transport option (from PlanTripPage)
   • Saved/wishlisted activities (from ActivitiesPage)
   • AI-generated analysis (eco tip, route summary)
───────────────────────────────────────────────────────── */
import { createContext, useContext, useState, useCallback } from "react";

const TripContext = createContext(null);

const EMPTY = {
  from:              "",
  to:                "",
  fromPlace:         null,   // { name, address, lat, lng }
  toPlace:           null,
  distanceKm:        null,
  travelers:         2,
  departure:         "",
  returnDate:        "",
  budget:            2000,
  selectedTransport: null,   // full transport card object
  savedActivities:   [],     // array of activity objects
  aiAnalysis:        null,   // OpenRouter response for the route
  aiItinerary:       null,   // OpenRouter-generated day-by-day plan
};

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(EMPTY);

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
        : [...prev.savedActivities, activity],
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

  /* Reset everything */
  const clearTrip = useCallback(() => setTrip(EMPTY), []);

  return (
    <TripContext.Provider value={{
      trip,
      updateTrip,
      selectTransport,
      toggleActivity,
      setAiAnalysis,
      setAiItinerary,
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
