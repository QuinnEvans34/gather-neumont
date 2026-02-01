import { BrowserRouter, Routes, Route } from "react-router-dom";
import GamePage from "./Game.tsx";
import QuizDevPage from "./pages/QuizDevPage.tsx";

import "./index.css";

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
