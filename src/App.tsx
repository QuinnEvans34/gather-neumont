import { BrowserRouter, Routes, Route } from "react-router-dom";
import GamePage from "./Game.tsx";
import QuizDevPage from "./pages/QuizDevPage.tsx";

import "./index.css";

function OnboardingGuard() {
  const auth = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const isAccountRoute = pathname === "/account" || pathname.startsWith("/account/");

  if ((auth.mode === "user" || auth.mode === "admin") && auth.profileComplete === false) {
    if (isAccountRoute) return <Outlet />;
    return <Navigate to="/onboarding/profile" replace />;
  }

  return <Outlet />;
}

function GameIndex() {
  // OverlayLayout always renders the game background; this just represents the "/" child route.
  return null;
}

function AdminPage() {
  const auth = useAuth();

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Admin</h1>
        <p>Auth mode: {auth.mode}</p>
        <p>Placeholder admin route.</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GamePage />} />
        <Route path="/dev/quiz" element={<QuizDevPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
