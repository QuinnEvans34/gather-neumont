import { useEffect, useState } from "react";
import { QuizModal } from "../components/quiz/QuizModal";
import "./QuizDevPage.css";

type AuthUser = {
  id: string;
  username: string;
  isAdmin: boolean;
};

type LeaderboardEntry = {
  rank: number;
  username: string;
  longestStreak: number;
  currentStreak: number;
  totalPoints: number;
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

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

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const res = await fetch("/api/leaderboard?limit=50");
      const data = (await res.json()) as { entries?: LeaderboardEntry[] };
      if (!res.ok) {
        setLeaderboardError("Failed to load leaderboard");
        return;
      }
      setLeaderboard(data.entries ?? []);
    } catch {
      setLeaderboardError("Failed to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
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
          <section className="quiz-dev-leaderboard">
            <div className="quiz-dev-leaderboard-header">
              <h3>Leaderboard</h3>
              <button
                type="button"
                className="quiz-dev-auth-btn"
                onClick={loadLeaderboard}
                disabled={leaderboardLoading}
              >
                {leaderboardLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {leaderboardError && (
              <p className="quiz-dev-auth-error" role="status">
                {leaderboardError}
              </p>
            )}
            {leaderboard.length === 0 ? (
              <p className="quiz-dev-leaderboard-empty">
                No leaderboard entries yet.
              </p>
            ) : (
              <div className="quiz-dev-leaderboard-table" role="table">
                <div className="quiz-dev-leaderboard-row quiz-dev-leaderboard-head" role="row">
                  <span>#</span>
                  <span>User</span>
                  <span>Longest</span>
                  <span>Current</span>
                  <span>Points</span>
                </div>
                {leaderboard.map((entry) => (
                  <div
                    className="quiz-dev-leaderboard-row"
                    key={`${entry.rank}-${entry.username}`}
                    role="row"
                  >
                    <span>{entry.rank}</span>
                    <span>{entry.username}</span>
                    <span>{entry.longestStreak}</span>
                    <span>{entry.currentStreak}</span>
                    <span>{entry.totalPoints}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <QuizModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
