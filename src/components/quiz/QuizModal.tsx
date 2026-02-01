/**
 * QuizModal component - main modal for the daily quiz experience.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQuiz } from "../../hooks/useQuiz";
import type { Question } from "../../types/quiz.types";
import { QuizCards } from "./QuizCards";
import { WrittenResponse } from "./WrittenResponse";
import { QuizResult } from "./QuizResult";
import "./QuizModal.css";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

type Tab = "quiz" | "admin" | "questions";

type AdminTestResult = {
  correct: boolean;
  attemptNumber: number;
  pointsEarned: number;
  pointsBreakdown: {
    basePoints: number;
    attemptMultiplier: number;
    attemptNumber: number;
    baseAfterMultiplier: number;
    firstTryBonus: number;
    speedBonus: number;
    totalPoints: number;
  };
  explanation?: string;
  correctIndex?: number;
  correctIndices?: number[];
  acceptedAnswers?: string[];
};

export function QuizModal({ isOpen, onClose, isAdmin = false }: QuizModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("quiz");
  const [mode, setMode] = useState<"daily" | "test">("daily");
  const [adminQuestions, setAdminQuestions] = useState<Question[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [testQuestion, setTestQuestion] = useState<Question | null>(null);
  const [testState, setTestState] = useState<
    "idle" | "active" | "submitting" | "correct" | "incorrect"
  >("idle");
  const [testResult, setTestResult] = useState<AdminTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [sequenceIds, setSequenceIds] = useState<string[] | null>(null);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [sequenceMessage, setSequenceMessage] = useState<string | null>(null);
  const testStartRef = useRef<number | null>(null);
  const quiz = useQuiz();

  useEffect(() => {
    if (!isAdmin && activeTab !== "quiz") {
      setActiveTab("quiz");
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    let cancelled = false;
    const loadQuestions = async () => {
      setAdminLoading(true);
      setAdminError(null);
      try {
        const res = await fetch("/api/admin/questions");
        const data = (await res.json()) as { questions?: Question[] };
        if (!res.ok) {
          throw new Error("Failed to load questions");
        }
        if (!cancelled) {
          setAdminQuestions(data.questions ?? []);
          if (!selectedQuestionId && data.questions?.length) {
            setSelectedQuestionId(data.questions[0].id);
          }
        }
      } catch {
        if (!cancelled) {
          setAdminError("Failed to load admin questions");
        }
      } finally {
        if (!cancelled) {
          setAdminLoading(false);
        }
      }
    };
    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isAdmin]);

  const handleClose = useCallback(() => {
    // If quiz is in progress (active or incorrect) and not completed, confirm
    if (mode === "daily" && (quiz.state === "active" || quiz.state === "incorrect")) {
      const confirmed = window.confirm(
        "Leave without finishing today's quiz?"
      );
      if (!confirmed) return;
    }
    quiz.reset();
    onClose();
  }, [mode, quiz, onClose]);

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
      if (mode === "daily") {
        await quiz.submitAnswer(answer);
        return;
      }
      if (!testQuestion) return;
      setTestState("submitting");
      setTestError(null);
      const elapsed =
        testStartRef.current !== null ? Date.now() - testStartRef.current : 0;
      try {
        const res = await fetch("/api/admin/test/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: testQuestion.id,
            answer,
            elapsedMs: elapsed,
          }),
        });
        const data = (await res.json()) as AdminTestResult;
        if (!res.ok) {
          throw new Error("Failed to submit test answer");
        }
        setTestResult(data);
        setTestState(data.correct ? "correct" : "incorrect");
      } catch {
        setTestError("Failed to submit test answer");
        setTestState("active");
      }
    },
    [mode, quiz, testQuestion]
  );

  const orderedQuestions = useMemo(() => {
    const clone = [...adminQuestions];
    clone.sort((a, b) => {
      const matchA = /^q(\d+)$/.exec(a.id ?? "");
      const matchB = /^q(\d+)$/.exec(b.id ?? "");
      const aNum = matchA ? Number.parseInt(matchA[1], 10) : Number.MAX_SAFE_INTEGER;
      const bNum = matchB ? Number.parseInt(matchB[1], 10) : Number.MAX_SAFE_INTEGER;
      if (aNum !== bNum) return aNum - bNum;
      return String(a.id).localeCompare(String(b.id));
    });
    return clone;
  }, [adminQuestions]);

  const loadTestQuestion = useCallback(
    (id: string, newSequence?: string[] | null, nextIndex?: number) => {
      const target = adminQuestions.find((question) => question.id === id);
      if (!target) {
        setTestError("Question not found");
        return;
      }
      setMode("test");
      setActiveTab("quiz");
      setSelectedQuestionId(id);
      quiz.reset();
      setTestQuestion(target);
      setTestResult(null);
      setTestError(null);
      setSequenceMessage(null);
      setTestState("active");
      testStartRef.current = Date.now();
      setSequenceIds(newSequence ?? null);
      setSequenceIndex(nextIndex ?? 0);
    },
    [adminQuestions]
  );

  const handleLoadSelected = () => {
    if (!selectedQuestionId) return;
    setSequenceIds(null);
    loadTestQuestion(selectedQuestionId, null);
  };

  const handleStartSequence = () => {
    if (orderedQuestions.length === 0) return;
    const ids = orderedQuestions.map((question) => question.id);
    loadTestQuestion(ids[0], ids, 0);
  };

  const handleNextQuestion = () => {
    if (!testQuestion) return;
    const orderedIds = orderedQuestions.map((question) => question.id);
    let ids = sequenceIds ?? orderedIds;
    let nextIndex = 0;

    if (sequenceIds) {
      nextIndex = sequenceIndex + 1;
      if (nextIndex >= sequenceIds.length) {
        setSequenceMessage("End of sequence.");
        return;
      }
    } else {
      const currentIndex = ids.indexOf(testQuestion.id);
      if (currentIndex >= 0 && currentIndex < ids.length - 1) {
        nextIndex = currentIndex + 1;
      } else {
        setSequenceMessage("No next question in order.");
        return;
      }
    }

    const nextId = ids[nextIndex];
    loadTestQuestion(nextId, sequenceIds ?? null, nextIndex);
  };

  const handleLoadDaily = () => {
    setMode("daily");
    setTestQuestion(null);
    setTestResult(null);
    setTestError(null);
    setSequenceIds(null);
    setSequenceMessage(null);
    quiz.reset();
    setActiveTab("quiz");
  };

  if (!isOpen) return null;

  const renderQuizContent = () => {
    if (mode === "test") {
      if (!testQuestion) {
        return (
          <div className="quiz-loading">
            <p>Select a question in the Admin tab to begin test mode.</p>
          </div>
        );
      }

      const showIncorrect = testState === "incorrect";
      const isSubmitting = testState === "submitting";

      return (
        <>
          <div className="quiz-question">
            <p className="quiz-question-prompt">{testQuestion.prompt}</p>
            <p className="quiz-question-meta">
              <span>Difficulty: {"★".repeat(testQuestion.difficulty)}</span>
              <span>Base: {testQuestion.basePoints} pts</span>
            </p>
          </div>

          {(testQuestion.type === "mcq" || testQuestion.type === "select-all") &&
            testQuestion.choices && (
              <QuizCards
                choices={testQuestion.choices}
                type={testQuestion.type}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
                wrongIndex={undefined}
                wrongIndices={undefined}
                showIncorrect={showIncorrect}
                correctIndex={testQuestion.correctIndex}
                correctIndices={testQuestion.correctIndices}
                showCorrect
              />
            )}

          {testQuestion.type === "written" && (
            <WrittenResponse
              key={testQuestion.id}
              onSubmit={handleSubmit}
              disabled={isSubmitting}
              showIncorrect={showIncorrect}
              showCorrect
              acceptedAnswers={testQuestion.acceptedAnswers}
            />
          )}

          {testResult && (
            <div className="quiz-test-result">
              <p
                className={`quiz-feedback ${
                  testResult.correct ? "correct" : "incorrect"
                }`}
              >
                {testResult.correct
                  ? "Correct."
                  : "Incorrect (test mode)."}
              </p>
              <p className="quiz-test-points">
                Points: {testResult.pointsEarned}
              </p>
              <button
                className="quiz-submit-btn"
                onClick={handleNextQuestion}
              >
                Next Question
              </button>
              {sequenceMessage && (
                <p className="quiz-test-message">{sequenceMessage}</p>
              )}
            </div>
          )}

          {testError && (
            <p className="quiz-feedback error" style={{ marginTop: 12 }}>
              {testError}
            </p>
          )}
        </>
      );
    }

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
              key={quiz.question.id}
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
            {isAdmin && (
              <>
                <button
                  className={`quiz-modal-tab ${activeTab === "admin" ? "active" : ""}`}
                  onClick={() => setActiveTab("admin")}
                >
                  Admin
                </button>
                <button
                  className={`quiz-modal-tab ${
                    activeTab === "questions" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("questions")}
                >
                  Questions
                </button>
              </>
            )}
          </div>
          <button className="quiz-modal-close" onClick={handleClose}>
            ✕
          </button>
        </header>

        <div className="quiz-modal-body">
          {activeTab === "quiz" && renderQuizContent()}
          {activeTab === "admin" && isAdmin && (
            <div className="quiz-admin-panel">
              <div className="quiz-admin-row">
                <button
                  className="quiz-submit-btn quiz-admin-btn"
                  onClick={handleLoadDaily}
                >
                  Load Daily Quiz
                </button>
                <button
                  className="quiz-submit-btn quiz-admin-btn"
                  onClick={handleStartSequence}
                  disabled={adminLoading || orderedQuestions.length === 0}
                >
                  Start Sequence
                </button>
              </div>
              <div className="quiz-admin-row">
                <div className="quiz-admin-field">
                  <label htmlFor="admin-question-select">Question</label>
                  <input
                    id="admin-question-select"
                    list="admin-question-list"
                    value={selectedQuestionId}
                    onChange={(event) => setSelectedQuestionId(event.target.value)}
                    placeholder="q001"
                  />
                  <datalist id="admin-question-list">
                    {orderedQuestions.map((question) => (
                      <option key={question.id} value={question.id} />
                    ))}
                  </datalist>
                </div>
                <button
                  className="quiz-submit-btn quiz-admin-btn"
                  onClick={handleLoadSelected}
                  disabled={!selectedQuestionId || adminLoading}
                >
                  Load Selected Question
                </button>
              </div>
              {adminLoading && <p className="quiz-admin-status">Loading...</p>}
              {adminError && (
                <p className="quiz-feedback error">{adminError}</p>
              )}
            </div>
          )}
          {activeTab === "questions" && isAdmin && (
            <div className="quiz-admin-panel">
              <h3>Questions</h3>
              {adminLoading && <p className="quiz-admin-status">Loading...</p>}
              {adminError && (
                <p className="quiz-feedback error">{adminError}</p>
              )}
              <div className="quiz-admin-list">
                {orderedQuestions.map((question) => (
                  <button
                    key={question.id}
                    type="button"
                    className="quiz-admin-list-item"
                    onClick={() => {
                      setSelectedQuestionId(question.id);
                      loadTestQuestion(question.id, null);
                    }}
                  >
                    <span>{question.id}</span>
                    <span>{question.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
