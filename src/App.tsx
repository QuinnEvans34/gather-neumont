import { BrowserRouter, Navigate, Outlet, Routes, Route } from "react-router-dom";
import QuizDevPage from "./pages/QuizDevPage.tsx";
import OnboardingLanding from "./pages/OnboardingLanding.tsx";
import OverlayLayout from "./ui/OverlayLayout.tsx";
import { useAuth } from "./features/auth/AuthContext.tsx";
import { useProfile } from "./features/profile/ProfileContext.tsx";

import "./index.css";

function OnboardingGuard() {
  const auth = useAuth();
  const profile = useProfile();

  const shouldForceProfile =
    (auth.mode === "user" || auth.mode === "admin") && !profile.isComplete();

  if (shouldForceProfile) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return <Outlet />;
}

function LoginPage() {
  const auth = useAuth();

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Login</h1>
        <p>Auth mode: {auth.mode}</p>
        <p>This is a placeholder login page. UI wiring comes next.</p>
      </div>
    </div>
  );
}

function OnboardingProfilePage() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Onboarding: Profile</h1>
        <p>Placeholder route.</p>
      </div>
    </div>
  );
}

function OnboardingAvatarPage() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Onboarding: Avatar</h1>
        <p>Placeholder route.</p>
      </div>
    </div>
  );
}

function OnboardingMajorPage() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Onboarding: Major</h1>
        <p>Placeholder route.</p>
      </div>
    </div>
  );
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
        <Route path="/" element={<OverlayLayout />}>
          <Route path="login" element={<LoginPage />} />

          <Route path="onboarding">
            <Route index element={<OnboardingLanding />} />
            <Route path="profile" element={<OnboardingProfilePage />} />

            {/* Simple guard for "proceed" routes while onboarding isn't complete */}
            <Route element={<OnboardingGuard />}>
              <Route path="avatar" element={<OnboardingAvatarPage />} />
              <Route path="major" element={<OnboardingMajorPage />} />
            </Route>
          </Route>

          <Route path="admin" element={<AdminPage />} />
          <Route path="dev/quiz" element={<QuizDevPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
