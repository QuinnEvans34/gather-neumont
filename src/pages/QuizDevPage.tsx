import { useEffect, useState } from "react";
import { QuizModal } from "../components/quiz/QuizModal";
import "./QuizDevPage.css";

type AuthUser = {
  id: string;
  username: string;
  isAdmin: boolean;
};

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function QuizDevPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"quiz" | "admin">("quiz");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [guestWarning, setGuestWarning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as { user: AuthUser | null };
        if (!cancelled) {
          setAuthUser(data.user);
          if (data.user?.username) {
            setUsernameInput(data.user.username);
          }
        }
      } catch {
        if (!cancelled) {
          setAuthUser(null);
        }
      }
    };

    loadAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authUser?.isAdmin && activeTab === "admin") {
      setActiveTab("quiz");
    }
  }, [authUser, activeTab]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = usernameInput.trim();
    if (trimmed.toLowerCase() === "guest") {
      setGuestWarning(true);
      setAuthError(null);
      return;
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setAuthError("Username must be 3-20 letters, numbers, or _");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = (await res.json()) as {
        user?: AuthUser;
        error?: string;
      };
      if (!res.ok || !data.user) {
        setAuthError(data.error ?? "Login failed");
        return;
      }
      setAuthUser(data.user);
      setUsernameInput(data.user.username);
    } catch {
      setAuthError("Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAuthUser(null);
    } catch {
      setAuthError("Logout failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestContinue = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors for guest flow
    }
    setAuthUser(null);
    setAuthError(null);
    setGuestWarning(false);
    sessionStorage.setItem("guestMode", "true");
    if (!sessionStorage.getItem("guestToken")) {
      sessionStorage.setItem("guestToken", `guest_${crypto.randomUUID()}`);
    }
  };

  const handleGuestChange = () => {
    setGuestWarning(false);
    setAuthError(null);
  };

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
          {authUser?.isAdmin && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "admin"}
              className={`quiz-dev-tab ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              Admin
            </button>
          )}
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
          <div className="quiz-dev-auth">
            {guestWarning ? (
              <div className="quiz-dev-auth-warning">
                <p>If you proceed as guest, none of your progress will be saved.</p>
                <p>Create an account to save your progress.</p>
                <div className="quiz-dev-auth-row">
                  <button
                    type="button"
                    className="quiz-dev-auth-btn"
                    onClick={handleGuestContinue}
                    disabled={authLoading}
                  >
                    Continue as Guest
                  </button>
                  <button
                    type="button"
                    className="quiz-dev-auth-btn"
                    onClick={handleGuestChange}
                    disabled={authLoading}
                  >
                    Change Username
                  </button>
                </div>
              </div>
            ) : authUser ? (
              <div className="quiz-dev-auth-row">
                <span className="quiz-dev-auth-status">
                  Logged in as <strong>{authUser.username}</strong>
                </span>
                <button
                  type="button"
                  className="quiz-dev-auth-btn"
                  onClick={handleLogout}
                  disabled={authLoading}
                >
                  Log out
                </button>
              </div>
            ) : (
              <form className="quiz-dev-auth-row" onSubmit={handleLogin}>
                <input
                  className="quiz-dev-auth-input"
                  type="text"
                  name="username"
                  value={usernameInput}
                  placeholder="Username"
                  autoComplete="username"
                  onChange={(event) => setUsernameInput(event.target.value)}
                  disabled={authLoading}
                />
                <button
                  type="submit"
                  className="quiz-dev-auth-btn"
                  disabled={authLoading}
                >
                  Log in
                </button>
              </form>
            )}
            {authError && (
              <p className="quiz-dev-auth-error" role="status">
                {authError}
              </p>
            )}
          </div>
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
