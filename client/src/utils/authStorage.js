/* ─────────────────────────────────────────────────────────
   Waypoint — localStorage Auth Storage Helpers
   
   Key schema:
     waypoint_accounts          → [{id, email}]  (index of all accounts)
     waypoint_active_user_id    → string UUID     (current session)
     waypoint_user_{id}         → full profile    (per-user)
     waypoint_trips_{id}        → saved trips     (per-user)
     waypoint_activities_{id}   → wishlisted acts (per-user)

   Each account is completely isolated by its UUID.
───────────────────────────────────────────────────────── */

const K = {
  ACCOUNTS:    "waypoint_accounts",
  ACTIVE:      "waypoint_active_user_id",
  USER:        (id) => `waypoint_user_${id}`,
  TRIPS:       (id) => `waypoint_trips_${id}`,
  ACTIVITIES:  (id) => `waypoint_activities_${id}`,
};

/* ── UUID generation ── */
export function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ── SHA-256 password hashing via Web Crypto API ── */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "waypoint_salt_2026");
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ── Account index ── */
export function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(K.ACCOUNTS) || "[]");
  } catch {
    return [];
  }
}

export function saveAccounts(accounts) {
  localStorage.setItem(K.ACCOUNTS, JSON.stringify(accounts));
}

/* ── Active session ── */
export function getActiveUserId() {
  return localStorage.getItem(K.ACTIVE) || null;
}

export function setActiveUserId(id) {
  localStorage.setItem(K.ACTIVE, id);
}

export function clearActiveUser() {
  localStorage.removeItem(K.ACTIVE);
}

/* ── Per-user profile ── */
export function getUserProfile(id) {
  try {
    return JSON.parse(localStorage.getItem(K.USER(id)));
  } catch {
    return null;
  }
}

export function saveUserProfile(id, profile) {
  localStorage.setItem(K.USER(id), JSON.stringify(profile));
}

/* ── Per-user trips ── */
export function getUserTrips(id) {
  try {
    return JSON.parse(localStorage.getItem(K.TRIPS(id)) || "[]");
  } catch {
    return [];
  }
}

export function saveUserTrips(id, trips) {
  localStorage.setItem(K.TRIPS(id), JSON.stringify(trips));
}

/* ── Per-user wishlisted activities ── */
export function getUserActivities(id) {
  try {
    return JSON.parse(localStorage.getItem(K.ACTIVITIES(id)) || "[]");
  } catch {
    return [];
  }
}

export function saveUserActivities(id, activities) {
  localStorage.setItem(K.ACTIVITIES(id), JSON.stringify(activities));
}
