/**
 * QuizModal component - main modal for the daily quiz experience.
 */

import { useState, useCallback } from "react";
import { useQuiz } from "../../hooks/useQuiz";
import { QuizCards } from "./QuizCards";
import { WrittenResponse } from "./WrittenResponse";
import { QuizResult } from "./QuizResult";
import "./QuizModal.css";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "quiz" | "admin";

export function QuizModal({ isOpen, onClose }: QuizModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("quiz");
  const quiz = useQuiz();

  const handleClose = useCallback(() => {
    // If quiz is in progress (active or incorrect) and not completed, confirm
    if (quiz.state === "active" || quiz.state === "incorrect") {
      const confirmed = window.confirm(
        "Leave without finishing today's quiz?"
      );
      if (!confirmed) return;
    }
    quiz.reset();
    onClose();
  }, [quiz, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking the backdrop itself, not the panel
      if (e.target === e.currentTarget) {
        // Do nothing - clicking backdrop should not close
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (answer: unknown) => {
      await quiz.submitAnswer(answer);
    },
    [quiz]
  );

  if (!isOpen) return null;

  const renderQuizContent = () => {
    // Loading state
    if (quiz.state === "loading") {
      return (
        <div className="quiz-loading">
          <div className="quiz-loading-spinner" />
          <p>Loading today's quiz...</p>
        </div>
      );
    }

    // Error state
    if (quiz.state === "error") {
      return (
        <div className="quiz-loading">
          <p className="quiz-feedback error">{quiz.error}</p>
          <button
            className="quiz-submit-btn"
            onClick={quiz.startQuiz}
            style={{ marginTop: 16, width: "auto" }}
          >
            Try Again
          </button>
        </div>
      );
    }

    if (quiz.state === "completed") {
      return (
        <div className="quiz-loading">
          <p className="quiz-feedback">
            {quiz.lastResult?.message ?? "You already completed today's quiz."}
          </p>
        </div>
      );
    }

    // Idle state - show start button
    if (quiz.state === "idle") {
      return (
        <div className="quiz-loading">
          <p style={{ marginBottom: 16, color: "#ccc" }}>
            Ready to test your CS knowledge?
          </p>
          <button
            className="quiz-submit-btn"
            onClick={quiz.startQuiz}
            style={{ width: "auto", padding: "14px 40px" }}
          >
            Start Today's Quiz
          </button>
        </div>
      );
    }

    // Correct state - show result
    if (quiz.state === "correct" && quiz.lastResult && quiz.question) {
      return (
        <QuizResult
          question={quiz.question}
          pointsEarned={quiz.lastResult.pointsEarned ?? 0}
          pointsBreakdown={
            quiz.lastResult.pointsBreakdown ?? {
              basePoints: 0,
              attemptMultiplier: 1,
              attemptNumber: 1,
              baseAfterMultiplier: 0,
              firstTryBonus: 0,
              speedBonus: 0,
              totalPoints: 0,
            }
          }
          explanation={quiz.lastResult.explanation}
          correctIndex={quiz.lastResult.correctIndex}
          correctIndices={quiz.lastResult.correctIndices}
          acceptedAnswers={quiz.lastResult.acceptedAnswers}
          attemptNumber={quiz.attemptNumber}
        />
      );
    }

    // Active or incorrect state - show question
    if (quiz.question) {
      const isSubmitting = quiz.state === "submitting";
      const showIncorrect = quiz.state === "incorrect";

      return (
        <>
          <div className="quiz-question">
            <p className="quiz-question-prompt">{quiz.question.prompt}</p>
            <p className="quiz-question-meta">
              <span>Difficulty: {"★".repeat(quiz.question.difficulty)}</span>
              <span>Base: {quiz.question.basePoints} pts</span>
              {quiz.attemptNumber > 0 && (
                <span>Attempt #{quiz.attemptNumber}</span>
              )}
            </p>
          </div>

          {/* MCQ or Select-All */}
          {(quiz.question.type === "mcq" ||
            quiz.question.type === "select-all") &&
            quiz.question.choices && (
              <QuizCards
                choices={quiz.question.choices}
                type={quiz.question.type}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
                wrongIndex={quiz.lastResult?.feedback?.wrongIndex}
                wrongIndices={quiz.lastResult?.feedback?.selectedIndices}
                showIncorrect={showIncorrect}
              />
            )}

          {/* Written */}
          {quiz.question.type === "written" && (
            <WrittenResponse
              onSubmit={handleSubmit}
              disabled={isSubmitting}
              showIncorrect={showIncorrect}
            />
          )}

          {/* Feedback message */}
          {showIncorrect && (
            <p className="quiz-feedback incorrect">Incorrect. Try again.</p>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <div className="quiz-modal-backdrop" onClick={handleBackdropClick}>
      <div className="quiz-modal-panel">
        <header className="quiz-modal-header">
          <div className="quiz-modal-tabs">
            <button
              className={`quiz-modal-tab ${activeTab === "quiz" ? "active" : ""}`}
              onClick={() => setActiveTab("quiz")}
            >
              Quiz
            </button>
            <button
              className={`quiz-modal-tab ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              Admin
            </button>
          </div>
          <button className="quiz-modal-close" onClick={handleClose}>
            ✕
          </button>
        </header>

        <div className="quiz-modal-body">
          {activeTab === "quiz" && renderQuizContent()}
          {activeTab === "admin" && (
            <div className="quiz-admin-placeholder">
              <h3>Admin Panel</h3>
              <p>Question management coming in Commit 10</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
