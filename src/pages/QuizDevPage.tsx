import { useState } from "react";
import { QuizModal } from "../components/quiz/QuizModal";
import "./QuizDevPage.css";

export default function QuizDevPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"quiz" | "admin">("quiz");

  return (
    <div className="quiz-dev-page">
      <header className="quiz-dev-header">
        <div className="quiz-dev-tabs" role="tablist" aria-label="Dev tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "quiz"}
            className={`quiz-dev-tab ${activeTab === "quiz" ? "active" : ""}`}
            onClick={() => setActiveTab("quiz")}
          >
            Quiz
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "admin"}
            className={`quiz-dev-tab ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            Admin
          </button>
        </div>
      </header>

      <main className="quiz-dev-content">
        <div className="quiz-dev-placeholder">
          <h2>Daily Quiz</h2>
          <p>
            {activeTab === "quiz"
              ? "Test the quiz experience as a guest user"
              : "Admin tools live inside the quiz modal for now"}
          </p>
          <button
            className="quiz-dev-open-btn"
            onClick={() => setIsModalOpen(true)}
          >
            Open Daily Quiz
          </button>
        </div>
      </main>

      <QuizModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
