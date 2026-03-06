import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TripProvider } from "./context/TripContext";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { PlanTripPage } from "./pages/PlanTripPage";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { SustainabilityPage } from "./pages/SustainabilityPage";
import { MyTripPage } from "./pages/MyTripPage";
import { AuthPage } from "./pages/AuthPage";

/* ── Guards unauthenticated users away from protected routes ── */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

function Layout() {
  const { pathname } = useLocation();
  const hideNavbar = pathname === "/auth";
  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/"               element={<HomePage />} />
        <Route path="/plan-trip"      element={<PlanTripPage />} />
        <Route path="/activities"     element={<ActivitiesPage />} />
        <Route path="/sustainability"  element={<SustainabilityPage />} />
        <Route path="/auth"           element={<AuthPage />} />
        {/* Protected — requires login */}
        <Route path="/my-trip" element={
          <ProtectedRoute><MyTripPage /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TripProvider>
          <Layout />
        </TripProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
