import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Leaf, Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/Untitled_Artwork.png";

const NAV_LINKS = [
  { label: "Home",         path: "/" },
  { label: "Plan Trip",    path: "/plan-trip" },
  { label: "Activities",   path: "/activities" },
  { label: "Sustainability", path: "/sustainability" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  /* First name only for display */
  const firstName = user?.name?.split(" ")[0] ?? "";

  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  /* ─── shared link style factory ─── */
  const linkStyle = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "0.5rem 1rem",
    borderRadius: "9999px",
    fontSize: "0.9rem",
    fontWeight: active ? 600 : 400,
    color: active ? "#2d7a4f" : "#4a5568",
    background: active ? "#e8f5ee" : "transparent",
    textDecoration: "none",
    fontFamily: "'Inter', sans-serif",
    transition: "background 0.15s, color 0.15s",
    whiteSpace: "nowrap",
  });

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "0 2rem",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          {/* Logo image */}
          <img
            src={logoImg}
            alt="Waypoint logo"
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(45,122,79,0.25)",
            }}
          />

          {/* Brand name */}
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: "1.35rem",
              color: "#1a2e1a",
              lineHeight: 1,
            }}
          >
            Waypoint
          </span>

          {/* Eco pill */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.2rem 0.625rem",
              borderRadius: "9999px",
              background: "#e8f5ee",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#2d7a4f",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Leaf style={{ width: "0.75rem", height: "0.75rem" }} />
            Eco
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
          className="desktop-nav"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={linkStyle(isActive(link.path))}
              onMouseEnter={(e) => {
                if (!isActive(link.path)) {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.color = "#1a2e1a";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(link.path)) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#4a5568";
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Desktop right CTA ── */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}
          className="desktop-cta"
        >
          {isAuthenticated ? (
            <>
              {/* My Trip — ghost link */}
              <Link
                to="/my-trip"
                style={{
                  padding: "0.5rem 0.875rem",
                  fontSize: "0.9rem", fontWeight: 400,
                  color: "#4a5568", textDecoration: "none",
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: "9999px", transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1a2e1a")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4a5568")}
              >
                My Trip
              </Link>

              {/* User avatar pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.35rem 0.75rem 0.35rem 0.35rem",
                borderRadius: "9999px", background: "#e8f5ee",
                border: "1.5px solid #bbf7d0",
              }}>
                <div style={{
                  width: "1.75rem", height: "1.75rem", borderRadius: "50%",
                  background: "linear-gradient(135deg,#2d7a4f,#4aab74)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#fff", fontFamily: "'Inter',sans-serif" }}>
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2d7a4f", fontFamily: "'Inter',sans-serif" }}>
                  {firstName}
                </span>
              </div>

              {/* Log Out button */}
              <button
                onClick={handleLogout}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.55rem 1.1rem", borderRadius: "9999px",
                  background: "#2d7a4f", color: "#fff",
                  fontSize: "0.875rem", fontWeight: 600, border: "none",
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  boxShadow: "0 2px 12px rgba(45,122,79,0.28)",
                  transition: "background 0.15s, transform 0.15s", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#236040"; e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#2d7a4f"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <LogOut style={{ width: "0.875rem", height: "0.875rem" }} />
                Log Out
              </button>
            </>
          ) : (
            /* Not logged in — show Sign In pill */
            <Link
              to="/auth"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.55rem 1.375rem", borderRadius: "9999px",
                background: "#2d7a4f", color: "#fff",
                fontSize: "0.9rem", fontWeight: 600, textDecoration: "none",
                fontFamily: "'Inter', sans-serif",
                boxShadow: "0 2px 12px rgba(45,122,79,0.28)",
                transition: "background 0.15s, transform 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#236040"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#2d7a4f"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <User style={{ width: "0.875rem", height: "0.875rem" }} />
              Sign In
            </Link>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{
            display: "none",
            padding: "0.5rem",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "#4a5568",
            borderRadius: "0.5rem",
          }}
          className="mobile-toggle"
        >
          {mobileOpen
            ? <X style={{ width: "1.25rem", height: "1.25rem" }} />
            : <Menu style={{ width: "1.25rem", height: "1.25rem" }} />
          }
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div
          style={{
            padding: "0.75rem 1.5rem 1.25rem",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            background: "rgba(255,255,255,0.98)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              style={{
                ...linkStyle(isActive(link.path)),
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                display: "block",
              }}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                to="/my-trip"
                onClick={() => setMobileOpen(false)}
                style={{ padding: "0.75rem 1rem", fontSize: "0.9rem", color: "#4a5568", textDecoration: "none", fontFamily: "'Inter', sans-serif", display: "block" }}
              >
                My Trip
              </Link>
              {/* mobile user info */}
              <div style={{ padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, color: "#2d7a4f", fontFamily: "'Inter',sans-serif" }}>
                Signed in as {user?.name}
              </div>
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                  padding: "0.75rem", marginTop: "0.25rem", borderRadius: "9999px",
                  background: "#2d7a4f", color: "#fff", fontSize: "0.9rem",
                  fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", width: "100%",
                }}
              >
                <LogOut style={{ width: "0.875rem", height: "0.875rem" }} />
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                padding: "0.75rem", marginTop: "0.25rem", borderRadius: "9999px",
                background: "#2d7a4f", color: "#fff", fontSize: "0.9rem",
                fontWeight: 600, textDecoration: "none", fontFamily: "'Inter', sans-serif",
              }}
            >
              <User style={{ width: "0.875rem", height: "0.875rem" }} />
              Sign In
            </Link>
          )}
        </div>
      )}

      {/* Responsive styles: hide desktop nav on mobile */}
      <style>{`
        @media (max-width: 767px) {
          .desktop-nav  { display: none !important; }
          .desktop-cta  { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
