import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  hashPassword,
  generateId,
  getAccounts,
  saveAccounts,
  getActiveUserId,
  setActiveUserId,
  clearActiveUser,
  getUserProfile,
  saveUserProfile,
} from "../utils/authStorage";

/* ─────────────────────────────────────────
   Context
───────────────────────────────────────── */
const AuthContext = createContext(null);

/* ─────────────────────────────────────────
   Provider
───────────────────────────────────────── */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // full profile or null
  const [loading, setLoading] = useState(true);   // true until localStorage read

  /* Rehydrate session on first mount */
  useEffect(() => {
    const id = getActiveUserId();
    if (id) {
      const profile = getUserProfile(id);
      if (profile) setUser(profile);
    }
    setLoading(false);
  }, []);

  /* ── SIGN UP ──
     Creates a new isolated account under a fresh UUID.
     Throws a plain-English error string so the UI can display it directly. */
  const signup = useCallback(async ({ name, email, password }) => {
    const trimmedEmail = email.trim().toLowerCase();
    const accounts = getAccounts();

    if (accounts.find((a) => a.email === trimmedEmail)) {
      throw new Error("An account with this email already exists in this browser.");
    }

    const id           = generateId();
    const passwordHash = await hashPassword(password);
    const profile = {
      id,
      name:      name.trim(),
      email:     trimmedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    saveUserProfile(id, profile);
    saveAccounts([...accounts, { id, email: trimmedEmail }]);
    setActiveUserId(id);
    window.dispatchEvent(new Event("waypoint_user_changed"));

    /* Strip hash before exposing to UI */
    const safe = publicProfile(profile);
    setUser(safe);
    return safe;
  }, []);

  /* ── SIGN IN ──
     Looks up account by email, verifies hashed password. */
  const login = useCallback(async ({ email, password }) => {
    const trimmedEmail = email.trim().toLowerCase();
    const accounts = getAccounts();
    const account  = accounts.find((a) => a.email === trimmedEmail);

    if (!account) {
      throw new Error("No account found with this email. Please sign up first.");
    }

    const profile = getUserProfile(account.id);
    if (!profile) {
      throw new Error("Account data not found. Please sign up again.");
    }

    const passwordHash = await hashPassword(password);
    if (profile.passwordHash !== passwordHash) {
      throw new Error("Incorrect password. Please try again.");
    }

    setActiveUserId(account.id);
    window.dispatchEvent(new Event("waypoint_user_changed"));
    const safe = publicProfile(profile);
    setUser(safe);
    return safe;
  }, []);

  /* ── LOG OUT ──
     Clears active session; other accounts remain in localStorage intact. */
  const logout = useCallback(() => {
    clearActiveUser();
    setUser(null);
  }, []);

  /* ── Switch account (future-ready) ── */
  const switchAccount = useCallback((id) => {
    const profile = getUserProfile(id);
    if (!profile) return;
    setActiveUserId(id);
    setUser(publicProfile(profile));
  }, []);

  const value = {
    user,              // { id, name, email, createdAt } — no hash exposed
    loading,           // true while localStorage is being read
    isAuthenticated: !!user,
    allAccounts: getAccounts(),  // [{id, email}] — all browser accounts
    signup,
    login,
    logout,
    switchAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─────────────────────────────────────────
   Hook
───────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be called inside <AuthProvider>");
  return ctx;
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function publicProfile({ id, name, email, createdAt }) {
  return { id, name, email, createdAt };
}
