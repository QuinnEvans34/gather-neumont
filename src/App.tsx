import { BrowserRouter, Routes, Route } from "react-router-dom";
import QuizDevPage from "./pages/QuizDevPage.tsx";
import OverlayLayout from "./ui/OverlayLayout.tsx";
import { useAuth } from "./features/auth/AuthContext.tsx";
import LoginPage from "./pages/LoginPage";
import OnboardingLanding from "./pages/onboarding/Landing";
import ProfileStep from "./pages/onboarding/ProfileStep";
import AvatarStep from "./pages/onboarding/AvatarStep";
import MajorStep from "./pages/onboarding/MajorStep";

import "./index.css";

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
            <Route path="profile" element={<ProfileStep />} />
            <Route path="avatar" element={<AvatarStep />} />
            <Route path="major" element={<MajorStep />} />
          </Route>

          <Route path="admin" element={<AdminPage />} />
          <Route path="dev/quiz" element={<QuizDevPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
