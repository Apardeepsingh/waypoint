import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Leaf, Eye, EyeOff, ArrowRight,
  Mail, Lock, User, CheckCircle2, Globe, AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/Untitled_Artwork.png";

/* ── tiny field wrapper ── */
function Field({ label, type = "text", placeholder, icon: Icon, value, onChange, extra }) {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === "password";
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontSize: "0.8rem",
        fontWeight: 600, color: "#374151",
        fontFamily: "'Inter',sans-serif", marginBottom: "0.375rem",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", left: "0.875rem", top: "50%",
          transform: "translateY(-50%)", pointerEvents: "none",
          color: "#9ca3af",
        }}>
          <Icon style={{ width: "1rem", height: "1rem" }} />
        </div>
        <input
          type={isPw ? (showPw ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            width: "100%", padding: "0.75rem 2.75rem 0.75rem 2.5rem",
            border: "1.5px solid #e5e7eb", borderRadius: "0.75rem",
            fontSize: "0.9rem", fontFamily: "'Inter',sans-serif",
            color: "#1a2e1a", background: "#fafafa",
            outline: "none", boxSizing: "border-box",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#4aab74";
            e.target.style.boxShadow = "0 0 0 3px rgba(74,171,116,0.15)";
            e.target.style.background = "#fff";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb";
            e.target.style.boxShadow = "none";
            e.target.style.background = "#fafafa";
          }}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            style={{
              position: "absolute", right: "0.875rem", top: "50%",
              transform: "translateY(-50%)", border: "none",
              background: "none", cursor: "pointer", color: "#9ca3af", padding: 0,
            }}
          >
            {showPw
              ? <EyeOff style={{ width: "1rem", height: "1rem" }} />
              : <Eye     style={{ width: "1rem", height: "1rem" }} />}
          </button>
        )}
      </div>
      {extra}
    </div>
  );
}

/* ── eco stats for left panel ── */
const STATS = [
  { value: "87%",   label: "avg carbon saved" },
  { value: "12k+",  label: "eco trips planned" },
  { value: "4.9★",  label: "traveller rating" },
];

const PERKS = [
  "Personalised eco travel plans",
  "Real-time carbon footprint tracking",
  "Verified sustainable partners",
  "Exclusive green destination guides",
];


/* ════════════════════════════════════════
   AUTH PAGE
═════════════════════════════════════════ */
export function AuthPage() {
  const navigate = useNavigate();
  const { login, signup, isAuthenticated } = useAuth();
  const [mode, setMode] = useState("signup"); // "signin" | "signup"

  /* Redirect if already logged in */
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  /* Sign-in form state */
  const [siEmail,    setSiEmail]    = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siLoading,  setSiLoading]  = useState(false);
  const [siError,    setSiError]    = useState("");

  /* Sign-up form state */
  const [suName,     setSuName]     = useState("");
  const [suEmail,    setSuEmail]    = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm,  setSuConfirm]  = useState("");
  const [suAgree,    setSuAgree]    = useState(false);
  const [suLoading,  setSuLoading]  = useState(false);
  const [suError,    setSuError]    = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSiError("");
    if (!siEmail || !siPassword) { setSiError("Please fill in all fields."); return; }
    setSiLoading(true);
    try {
      await login({ email: siEmail, password: siPassword });
      navigate("/");
    } catch (err) {
      setSiError(err.message);
    } finally {
      setSiLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSuError("");
    if (!suName || !suEmail || !suPassword || !suConfirm) { setSuError("Please fill in all fields."); return; }
    if (suPassword !== suConfirm) { setSuError("Passwords do not match."); return; }
    if (suPassword.length < 6)    { setSuError("Password must be at least 6 characters."); return; }
    if (!suAgree)                 { setSuError("Please accept the Terms of Service to continue."); return; }
    setSuLoading(true);
    try {
      await signup({ name: suName, email: suEmail, password: suPassword });
      navigate("/");
    } catch (err) {
      setSuError(err.message);
    } finally {
      setSuLoading(false);
    }
  };

  /* ─── error banner ─── */
  const ErrorBanner = ({ msg }) => !msg ? null : (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "0.5rem",
      padding: "0.75rem 1rem", borderRadius: "0.75rem",
      background: "#fef2f2", border: "1.5px solid #fecaca",
      marginBottom: "1rem",
    }}>
      <AlertCircle style={{ width: "1rem", height: "1rem", color: "#ef4444", flexShrink: 0, marginTop: "0.1rem" }} />
      <p style={{ fontSize: "0.8rem", color: "#dc2626", fontFamily: "'Inter',sans-serif", lineHeight: 1.5, margin: 0 }}>{msg}</p>
    </div>
  );

  /* ─── tab button ─── */
  const Tab = ({ id, label }) => {
    const active = mode === id;
    return (
      <button
        type="button"
        onClick={() => { setMode(id); setSiError(""); setSuError(""); }}
        style={{
          flex: 1, padding: "0.625rem",
          borderRadius: "0.625rem", border: "none",
          background: active ? "#2d7a4f" : "transparent",
          color: active ? "#fff" : "#6b7280",
          fontSize: "0.9rem", fontWeight: active ? 700 : 500,
          fontFamily: "'Inter',sans-serif", cursor: "pointer",
          boxShadow: active ? "0 4px 12px rgba(45,122,79,0.25)" : "none",
          transition: "all 0.18s",
        }}
      >
        {label}
      </button>
    );
  };

  /* ─── submit button ─── */
  const SubmitBtn = ({ loading, label }) => (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%", padding: "0.875rem",
        borderRadius: "0.875rem", border: "none",
        background: loading
          ? "#6b7280"
          : "linear-gradient(135deg,#2d7a4f,#4aab74)",
        color: "#fff", fontSize: "0.95rem", fontWeight: 700,
        fontFamily: "'Inter',sans-serif", cursor: loading ? "not-allowed" : "pointer",
        boxShadow: loading ? "none" : "0 6px 20px rgba(45,122,79,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.92"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >
      {loading ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Processing…
        </>
      ) : (
        <>{label} <ArrowRight style={{ width: "1rem", height: "1rem" }} /></>
      )}
    </button>
  );


  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f3f4f6" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .auth-form-panel { animation: fadeUp 0.38s ease forwards; }
        @media (max-width: 900px) {
          .auth-left-panel { display: none !important; }
          .auth-right-panel { width: 100% !important; padding: 2rem 1.5rem !important; }
        }
      `}</style>

      {/* ════ LEFT BRAND PANEL ════ */}
      <div className="auth-left-panel" style={{
        width: "46%", flexShrink: 0,
        background: "linear-gradient(160deg, #1a3a2a 0%, #2d7a4f 55%, #3a9460 100%)",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem 3rem 2.5rem",
        position: "relative", overflow: "hidden",
        minHeight: "100vh",
      }}>
        {/* decorative circles */}
        {[
          { w: 280, h: 280, top: "-8rem",  right: "-6rem",  op: 0.07 },
          { w: 200, h: 200, bottom: "5rem", left: "-4rem",   op: 0.06 },
          { w: 150, h: 150, top: "40%",    right: "-3rem",  op: 0.05 },
          { w: 100, h: 100, top: "25%",    left: "2rem",    op: 0.06 },
        ].map((c, i) => (
          <div key={i} style={{
            position: "absolute",
            width: `${c.w}px`, height: `${c.h}px`,
            borderRadius: "50%", background: "#fff",
            opacity: c.op, top: c.top, bottom: c.bottom,
            left: c.left, right: c.right,
            pointerEvents: "none",
          }} />
        ))}

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Link to="/" style={{
            display: "inline-flex", alignItems: "center",
            gap: "0.625rem", textDecoration: "none",
          }}>
            <img
              src={logoImg}
              alt="Waypoint logo"
              style={{
                width: "2.75rem",
                height: "2.75rem",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              }}
            />
            <span style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.5rem", fontWeight: 700, color: "#fff",
            }}>WayPoint</span>
            <span style={{
              padding: "0.2rem 0.625rem", borderRadius: "9999px",
              background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)",
              fontSize: "0.72rem", fontWeight: 600, color: "#d1fae5",
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
            }}>
              <Leaf style={{ width: "0.7rem", height: "0.7rem" }} /> Eco
            </span>
          </Link>
        </div>

        {/* Centre copy */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Globe style={{ width: "2.5rem", height: "2.5rem", color: "#86efac", marginBottom: "1.25rem" }} />
          <h2 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(1.75rem,2.8vw,2.4rem)",
            fontWeight: 700, color: "#fff",
            lineHeight: 1.25, marginBottom: "1rem",
          }}>
            Travel the world.<br />Leave only footprints.
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.72)", fontFamily: "'Inter',sans-serif", lineHeight: 1.7, marginBottom: "2rem", maxWidth: "26rem" }}>
            Join thousands of eco-conscious travellers building sustainable journeys one trip at a time.
          </p>

          {/* Perks list */}
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {PERKS.map((p) => (
              <li key={p} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "#86efac", flexShrink: 0 }} />
                <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.85)", fontFamily: "'Inter',sans-serif" }}>{p}</span>
              </li>
            ))}
          </ul>

          {/* Stats strip */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)",
            gap: "0.75rem",
          }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{
                padding: "0.875rem 0.625rem",
                borderRadius: "0.875rem",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                textAlign: "center",
              }}>
                <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.65)", marginTop: "0.25rem", fontFamily: "'Inter',sans-serif" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p style={{ position: "relative", zIndex: 1, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontFamily: "'Inter',sans-serif" }}>
          © 2026 WayPoint · Eco-Certified Travel Platform
        </p>
      </div>

      {/* ════ RIGHT FORM PANEL ════ */}
      <div className="auth-right-panel" style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center",
        padding: "2rem 3rem",
        overflowY: "auto",
      }}>
        <div className="auth-form-panel" key={mode} style={{ width: "100%", maxWidth: "26rem" }}>

          {/* Mode tabs */}
          <div style={{
            display: "flex", background: "#f3f4f6",
            borderRadius: "0.875rem", padding: "0.25rem",
            marginBottom: "2rem",
            boxShadow: "inset 0 1px 4px rgba(0,0,0,0.07)",
          }}>
            <Tab id="signin" label="Sign In" />
            <Tab id="signup" label="Sign Up" />
          </div>

          {/* ── SIGN IN FORM ── */}
          {mode === "signin" && (
            <>
              <div style={{ marginBottom: "1.75rem" }}>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.375rem" }}>
                  Welcome back
                </h1>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", fontFamily: "'Inter',sans-serif" }}>
                  Sign in to continue your eco journey
                </p>
              </div>

              <form onSubmit={handleSignIn}>
                <ErrorBanner msg={siError} />
                <Field label="Email address" type="email"     placeholder="you@example.com"  icon={Mail}  value={siEmail}    onChange={(e) => setSiEmail(e.target.value)} />
                <Field label="Password"      type="password"  placeholder="Enter your password" icon={Lock} value={siPassword} onChange={(e) => setSiPassword(e.target.value)}
                  extra={
                    <div style={{ textAlign: "right", marginTop: "0.375rem" }}>
                      <button type="button" style={{ fontSize: "0.78rem", color: "#2d7a4f", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600, padding: 0 }}>
                        Forgot password?
                      </button>
                    </div>
                  }
                />

                <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="checkbox" id="remember" style={{ accentColor: "#2d7a4f", width: "0.9rem", height: "0.9rem", cursor: "pointer" }} />
                  <label htmlFor="remember" style={{ fontSize: "0.8rem", color: "#4b5563", fontFamily: "'Inter',sans-serif", cursor: "pointer" }}>
                    Remember me for 30 days
                  </label>
                </div>

                <SubmitBtn loading={siLoading} label="Sign In" />
              </form>

              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#6b7280", fontFamily: "'Inter',sans-serif", marginTop: "1.25rem" }}>
                Don't have an account?{" "}
                <button type="button" onClick={() => setMode("signup")} style={{ color: "#2d7a4f", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                  Create one free
                </button>
              </p>
            </>
          )}

          {/* ── SIGN UP FORM ── */}
          {mode === "signup" && (
            <>
              <div style={{ marginBottom: "1.75rem" }}>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.375rem" }}>
                  Create your account
                </h1>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", fontFamily: "'Inter',sans-serif" }}>
                  Start planning sustainable journeys today
                </p>
              </div>

              <form onSubmit={handleSignUp}>
                <ErrorBanner msg={suError} />
                <Field label="Full name"      type="text"      placeholder="Jane Doe"             icon={User} value={suName}     onChange={(e) => setSuName(e.target.value)} />
                <Field label="Email address"  type="email"     placeholder="you@example.com"      icon={Mail} value={suEmail}    onChange={(e) => setSuEmail(e.target.value)} />
                <Field label="Password"       type="password"  placeholder="Create a password"   icon={Lock} value={suPassword} onChange={(e) => setSuPassword(e.target.value)} />
                <Field label="Confirm password" type="password" placeholder="Repeat your password" icon={Lock} value={suConfirm}  onChange={(e) => setSuConfirm(e.target.value)} />

                {/* password strength */}
                {suPassword.length > 0 && (
                  <div style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}>
                    {(() => {
                      const s = suPassword.length < 6 ? 0 : suPassword.length < 10 ? 1 : suPassword.length < 14 ? 2 : 3;
                      const labels = ["Too short", "Fair", "Good", "Strong"];
                      const colors = ["#f87171", "#fbbf24", "#4aab74", "#2d7a4f"];
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{ flex: 1, height: "5px", borderRadius: "9999px", background: "#e5e7eb", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "9999px", width: `${(s + 1) * 25}%`, background: colors[s], transition: "width 0.3s" }} />
                          </div>
                          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: colors[s], fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>{labels[s]}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <input type="checkbox" id="agree" checked={suAgree} onChange={(e) => setSuAgree(e.target.checked)}
                    style={{ accentColor: "#2d7a4f", width: "0.9rem", height: "0.9rem", cursor: "pointer", marginTop: "0.125rem", flexShrink: 0 }} />
                  <label htmlFor="agree" style={{ fontSize: "0.78rem", color: "#4b5563", fontFamily: "'Inter',sans-serif", lineHeight: 1.55, cursor: "pointer" }}>
                    I agree to the{" "}
                    <span style={{ color: "#2d7a4f", fontWeight: 600 }}>Terms of Service</span>
                    {" "}and{" "}
                    <span style={{ color: "#2d7a4f", fontWeight: 600 }}>Privacy Policy</span>
                  </label>
                </div>

                <SubmitBtn loading={suLoading} label="Create Account" />
              </form>

              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#6b7280", fontFamily: "'Inter',sans-serif", marginTop: "1.25rem" }}>
                Already have an account?{" "}
                <button type="button" onClick={() => setMode("signin")} style={{ color: "#2d7a4f", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                  Sign in instead
                </button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
