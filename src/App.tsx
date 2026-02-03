import { BrowserRouter, Routes, Route } from "react-router-dom";
import QuizDevPage from "./pages/QuizDevPage.tsx";
import OnboardingLanding from "./pages/OnboardingLanding.tsx";
import OverlayLayout from "./ui/OverlayLayout.tsx";

import "./index.css";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OverlayLayout />}>
          <Route path="onboarding" element={<OnboardingLanding />} />
          <Route path="dev/quiz" element={<QuizDevPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
