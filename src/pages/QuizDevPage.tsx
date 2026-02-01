import { useState } from "react";
import "./QuizDevPage.css";

type Tab = "quiz" | "admin";

export default function QuizDevPage() {
  const [activeTab, setActiveTab] = useState<Tab>("quiz");

  return (
    <div className="quiz-dev-page">
      <header className="quiz-dev-header">
        <h1>Quiz Dev Mode</h1>
        <nav className="quiz-dev-tabs">
          <button
            className={`quiz-dev-tab ${activeTab === "quiz" ? "active" : ""}`}
            onClick={() => setActiveTab("quiz")}
          >
            Quiz
          </button>
          <button
            className={`quiz-dev-tab ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            Admin
          </button>
        </nav>
      </header>

      <main className="quiz-dev-content">
        {activeTab === "quiz" && (
          <div className="quiz-dev-placeholder">
            <h2>Quiz Tab</h2>
            <p>Quiz functionality coming in Commit 5</p>
          </div>
        )}
        {activeTab === "admin" && (
          <div className="quiz-dev-placeholder">
            <h2>Admin Tab</h2>
            <p>Admin functionality coming in Commit 10</p>
          </div>
        )}
      </main>
    </div>
  );
}
