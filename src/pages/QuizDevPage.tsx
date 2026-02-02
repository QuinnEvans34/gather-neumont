import { useEffect, useRef, useState } from "react";
import { QuizModal } from "../components/quiz/QuizModal";
import { DEMO_LEADERBOARD } from "../demo/demoLeaderboard";
import "./QuizDevPage.css";
import "../styles/quiz-ui.css";

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
  const [activeTab, setActiveTab] = useState<"quiz" | "leaderboard" | "admin">(
    "quiz"
  );
  const [modalInitialTab, setModalInitialTab] = useState<
    "quiz" | "admin" | "questions" | "schedule"
  >("quiz");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [guestWarning, setGuestWarning] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [leaderboardUsingDemo, setLeaderboardUsingDemo] = useState(false);
  const leaderboardScrollRef = useRef(false);
  const [leaderboardAnimNonce, setLeaderboardAnimNonce] = useState(0);
  const leaderboardLoadedRef = useRef(false);
  const [useDemoLeaderboard, setUseDemoLeaderboard] = useState(true);
  const [rankAnimActive, setRankAnimActive] = useState(false);
  const [rankAnimValue, setRankAnimValue] = useState(0);
  const [rankAnimDone, setRankAnimDone] = useState(false);
  const rankAnimRef = useRef<number | null>(null);
  const rankAnimDelayRef = useRef<number | null>(null);
  const rankAnimKeyRef = useRef<string | null>(null);

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
          const storedGuest = sessionStorage.getItem("guestMode") === "true";
          setGuestMode(storedGuest);
        }
      } catch {
        if (!cancelled) {
          setAuthUser(null);
          const storedGuest = sessionStorage.getItem("guestMode") === "true";
          setGuestMode(storedGuest);
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
    if (!trimmed || trimmed.toLowerCase() === "guest") {
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
      sessionStorage.removeItem("guestMode");
      setGuestMode(false);
      setActiveTab("quiz");
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
      sessionStorage.removeItem("guestMode");
      setGuestMode(false);
      setUsernameInput("");
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
    setGuestMode(true);
    if (!sessionStorage.getItem("guestToken")) {
      sessionStorage.setItem("guestToken", `guest_${crypto.randomUUID()}`);
    }
    setActiveTab("quiz");
  };

  const handleGuestChange = () => {
    setGuestWarning(false);
    setAuthError(null);
  };

  const handleOpenQuiz = () => {
    setModalInitialTab("quiz");
    setIsModalOpen(true);
  };

  const handleOpenAdminPanel = () => {
    setModalInitialTab("admin");
    setIsModalOpen(true);
  };

  const showMainUi = !!authUser || guestMode;
  const displayedLeaderboard = useDemoLeaderboard
    ? DEMO_LEADERBOARD
    : { entries: leaderboard };
  const entries = displayedLeaderboard.entries ?? [];
  const meUsername = authUser?.username;
  const myEntry = meUsername
    ? entries.find(
        (entry) => entry.username.toLowerCase() === meUsername.toLowerCase()
      )
    : undefined;
  const previewLeaderboard =
    entries.length > 0 ? entries : DEMO_LEADERBOARD.entries;
  const topStreak = previewLeaderboard[0];

  const loadLeaderboard = async () => {
    if (useDemoLeaderboard) {
      setLeaderboardUsingDemo(true);
      setLeaderboard(DEMO_LEADERBOARD.entries);
      leaderboardLoadedRef.current = true;
      return;
    }
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const res = await fetch("/api/leaderboard?limit=50");
      const data = (await res.json()) as { entries?: LeaderboardEntry[] };
      if (!res.ok) {
        setLeaderboardError("Failed to load leaderboard");
        setLeaderboardUsingDemo(true);
        setLeaderboard(DEMO_LEADERBOARD.entries);
        return;
      }
      if (!data.entries || data.entries.length === 0) {
        setLeaderboardUsingDemo(true);
        setLeaderboard(DEMO_LEADERBOARD.entries);
        leaderboardLoadedRef.current = true;
        return;
      }
      setLeaderboardUsingDemo(false);
      setLeaderboard(data.entries);
      leaderboardLoadedRef.current = true;
    } catch {
      setLeaderboardError("Failed to load leaderboard");
      setLeaderboardUsingDemo(true);
      setLeaderboard(DEMO_LEADERBOARD.entries);
      leaderboardLoadedRef.current = true;
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return String(rank);
  };

  useEffect(() => {
    if (activeTab !== "leaderboard") {
      return;
    }
    if (!leaderboardLoadedRef.current && !leaderboardLoading) {
      leaderboardScrollRef.current = false;
      loadLeaderboard();
    }
  }, [activeTab, leaderboardLoading, useDemoLeaderboard]);

  useEffect(() => {
    if (activeTab !== "leaderboard") {
      return;
    }
    if (!myEntry || leaderboardScrollRef.current) {
      return;
    }
    if (leaderboardAnimNonce === 0) {
      return;
    }
    const targetUsername = myEntry.username.toLowerCase();
    const el = document.querySelector(
      `[data-username="${targetUsername}"]`
    ) as HTMLElement | null;
    if (el) {
      leaderboardScrollRef.current = true;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeTab, myEntry, leaderboardAnimNonce]);

  useEffect(() => {
    if (activeTab !== "leaderboard") {
      return;
    }
    if (!myEntry) {
      setRankAnimActive(false);
      setRankAnimDone(false);
      return;
    }
    if (leaderboardAnimNonce === 0) {
      return;
    }

    const animKey = `leaderboard:${leaderboardAnimNonce}:${myEntry.username}:${myEntry.rank}`;
    if (rankAnimKeyRef.current === animKey) {
      return;
    }
    rankAnimKeyRef.current = animKey;
    setRankAnimActive(true);
    setRankAnimDone(false);
    setRankAnimValue(1);

    if (rankAnimRef.current) {
      window.cancelAnimationFrame(rankAnimRef.current);
      rankAnimRef.current = null;
    }
    if (rankAnimDelayRef.current) {
      window.clearTimeout(rankAnimDelayRef.current);
      rankAnimDelayRef.current = null;
    }

    rankAnimDelayRef.current = window.setTimeout(() => {
      const start = performance.now();
      const duration = 600;
      const target = Math.max(1, myEntry.rank);

      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        const value = Math.max(1, Math.round(target * progress));
        setRankAnimValue(value);
        if (progress < 1) {
          rankAnimRef.current = window.requestAnimationFrame(step);
        } else {
          setRankAnimValue(target);
          setRankAnimActive(false);
          setRankAnimDone(true);
        }
      };

      rankAnimRef.current = window.requestAnimationFrame(step);
    }, 200);

    return () => {
      if (rankAnimRef.current) {
        window.cancelAnimationFrame(rankAnimRef.current);
        rankAnimRef.current = null;
      }
      if (rankAnimDelayRef.current) {
        window.clearTimeout(rankAnimDelayRef.current);
        rankAnimDelayRef.current = null;
      }
    };
  }, [activeTab, myEntry, leaderboardAnimNonce]);

  const handleViewLeaderboard = () => {
    setActiveTab("leaderboard");
    setLeaderboardAnimNonce((prev) => prev + 1);
    leaderboardScrollRef.current = false;
    setIsModalOpen(false);
  };

  const getPodiumGroup = (rank: number) =>
    entries.filter((entry) => entry.rank === rank);

  const podiumGroups = {
    first: getPodiumGroup(1),
    second: getPodiumGroup(2),
    third: getPodiumGroup(3),
  };

  const renderPodiumGroup = (
    label: string,
    entries: LeaderboardEntry[],
    emptyLabel: string
  ) => {
    const visible = entries.slice(0, 3);
    const remaining = entries.length - visible.length;

    if (entries.length === 0) {
      return <p className="quiz-dev-podium-empty">{emptyLabel}</p>;
    }

    return (
      <div className="quiz-dev-podium-list">
        {visible.map((entry) => (
          <div className="quiz-dev-podium-entry" key={`${label}-${entry.username}`}>
            <span className="quiz-dev-podium-name">{entry.username}</span>
            <span className="quiz-dev-podium-meta">
              Streak: {entry.longestStreak} • {entry.totalPoints} pts
            </span>
          </div>
        ))}
        {remaining > 0 && (
          <span className="quiz-dev-podium-more">+{remaining} more</span>
        )}
      </div>
    );
  };

  useEffect(() => {
    return () => {
      if (rankAnimRef.current) {
        window.cancelAnimationFrame(rankAnimRef.current);
        rankAnimRef.current = null;
      }
      if (rankAnimDelayRef.current) {
        window.clearTimeout(rankAnimDelayRef.current);
        rankAnimDelayRef.current = null;
      }
    };
  }, []);

  return (
    <div className="quiz-dev-page quiz-ui">
      <div className="quiz-ui">
        {!showMainUi ? (
          <main className="quiz-dev-content">
            <div className="quiz-dev-placeholder">
              <h2>Daily Quiz</h2>
              <p>Sign in or continue as guest to access the quiz.</p>
              <div className="quiz-dev-auth">
                {guestWarning ? (
                  <div className="quiz-dev-auth-warning">
                    <p>
                      If you proceed as guest, none of your progress will be saved.
                    </p>
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
            </div>
          </main>
        ) : (
          <>
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
              aria-selected={activeTab === "leaderboard"}
              className={`quiz-dev-tab ${activeTab === "leaderboard" ? "active" : ""}`}
              onClick={() => setActiveTab("leaderboard")}
            >
              Leaderboard
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
            {activeTab === "quiz" && (
              <>
                <p>Test the quiz experience as a guest user.</p>
                <div className="quiz-dev-auth-row">
                  <span className="quiz-dev-auth-status">
                    {authUser ? (
                      <>
                        Logged in as <strong>{authUser.username}</strong>
                      </>
                    ) : (
                      "Guest mode active"
                    )}
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
                <button className="quiz-dev-open-btn" onClick={handleOpenQuiz}>
                  Open Daily Quiz
                </button>
                {topStreak && (
                  <div className="quiz-dev-streak-preview">
                    <span className="quiz-dev-streak-label">
                      Current Highest Streak
                    </span>
                    <div className="quiz-dev-streak-row">
                      <span className="quiz-dev-streak-user">
                        {getRankIcon(topStreak.rank)} {topStreak.username}
                      </span>
                      <span className="quiz-dev-streak-meta">
                        Streak: {topStreak.longestStreak} • {topStreak.totalPoints} pts
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
            {activeTab === "leaderboard" && (
              <section className="quiz-dev-leaderboard">
                <div className="quiz-dev-leaderboard-header">
                  <h3>Leaderboard</h3>
                  {(useDemoLeaderboard || leaderboardUsingDemo) && (
                    <span className="quiz-dev-demo-label">Demo data</span>
                  )}
                  <button
                    type="button"
                    className="quiz-dev-auth-btn"
                    onClick={loadLeaderboard}
                    disabled={leaderboardLoading}
                  >
                    {leaderboardLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <div className="quiz-dev-toggle-row">
                  <label className="quiz-dev-toggle">
                    <input
                      type="checkbox"
                      checked={useDemoLeaderboard}
                      onChange={(event) => {
                        setUseDemoLeaderboard(event.target.checked);
                        leaderboardLoadedRef.current = false;
                        leaderboardScrollRef.current = false;
                        if (event.target.checked) {
                          setLeaderboardUsingDemo(true);
                          setLeaderboard(DEMO_LEADERBOARD.entries);
                        } else {
                          setLeaderboardUsingDemo(false);
                          setLeaderboard([]);
                        }
                      }}
                    />
                    <span>Use demo leaderboard</span>
                  </label>
                </div>
                <div className="quiz-dev-leaderboard-summary">
                  {myEntry ? (
                    rankAnimActive && !rankAnimDone ? (
                      <div className="quiz-dev-rank-anim">
                        <span className="quiz-dev-rank-anim-text">
                          Finding your rank…
                        </span>
                        <div className="quiz-dev-rank-bar">
                          <div
                            className="quiz-dev-rank-bar-fill"
                            style={{
                              width: `${
                                myEntry.rank
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        (rankAnimValue / myEntry.rank) * 100
                                      )
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="quiz-dev-rank-count">
                          #{rankAnimValue}
                        </span>
                      </div>
                    ) : (
                      <div className="quiz-dev-your-position">
                        <span className="quiz-dev-your-position-title">
                          Your Position
                        </span>
                        <div className="quiz-dev-your-position-grid">
                          <div>
                            <span className="quiz-dev-your-position-label">
                              Your Rank
                            </span>
                            <span className="quiz-dev-your-position-value">
                              #{myEntry.rank}
                            </span>
                          </div>
                          <div>
                            <span className="quiz-dev-your-position-label">
                              Best Streak
                            </span>
                            <span className="quiz-dev-your-position-value">
                              Streak: {myEntry.longestStreak}
                            </span>
                          </div>
                          <div>
                            <span className="quiz-dev-your-position-label">
                              Points
                            </span>
                            <span className="quiz-dev-your-position-value">
                              {myEntry.totalPoints}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <p className="quiz-dev-leaderboard-empty">
                      No leaderboard entry yet. Complete a quiz to appear.
                    </p>
                  )}
                </div>
                <div className="quiz-dev-podium">
                  <div className="quiz-dev-podium-col">
                    <span className="quiz-dev-podium-label">
                    {podiumGroups.second.length > 1 ? "Tied for #2" : "Second Place"}
                    </span>
                    {renderPodiumGroup(
                      "second",
                      podiumGroups.second,
                      "No one yet"
                    )}
                  </div>
                  <div className="quiz-dev-podium-col primary">
                    <span className="quiz-dev-podium-label">
                    {podiumGroups.first.length > 1 ? "Tied for #1" : "First Place"}
                    </span>
                    {renderPodiumGroup(
                      "first",
                      podiumGroups.first,
                      "No one yet"
                    )}
                  </div>
                  <div className="quiz-dev-podium-col">
                    <span className="quiz-dev-podium-label">
                    {podiumGroups.third.length > 1 ? "Tied for #3" : "Third Place"}
                    </span>
                    {renderPodiumGroup(
                      "third",
                      podiumGroups.third,
                      "No one yet"
                    )}
                  </div>
                </div>
                {leaderboardError && (
                  <p className="quiz-dev-auth-error" role="status">
                    {leaderboardError}
                  </p>
                )}
                {entries.length === 0 ? (
                  <p className="quiz-dev-leaderboard-empty">
                    No leaderboard entries yet.
                  </p>
                ) : (
                  <div className="leaderboard-scroll">
                    <div className="quiz-dev-leaderboard-table" role="table">
                      <div
                        className="quiz-dev-leaderboard-row quiz-dev-leaderboard-head"
                        role="row"
                      >
                        <span>User</span>
                        <span>Longest Streak</span>
                        <span>Total Points</span>
                      </div>
                      {entries.map((entry) => {
                        const isMe =
                          authUser?.username?.toLowerCase() ===
                          entry.username.toLowerCase();
                        return (
                          <div
                            className={`quiz-dev-leaderboard-row ${
                              isMe ? "leaderboard-row--me" : ""
                            }`}
                            data-username={entry.username.toLowerCase()}
                            key={`${entry.rank}-${entry.username}`}
                            role="row"
                          >
                            <span className="quiz-dev-rank-user">
                              <span className="quiz-dev-rank-icon">
                                {getRankIcon(entry.rank)}
                              </span>
                              <span>{entry.username}</span>
                              {isMe && (
                              <span className="quiz-dev-you-badge">YOU</span>
                              )}
                            </span>
                            <span>Streak: {entry.longestStreak}</span>
                            <span>{entry.totalPoints}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}
            {activeTab === "admin" && authUser?.isAdmin && (
              <section className="quiz-dev-admin-panel">
                <p>Admin tools live inside the quiz modal for now.</p>
                <div className="quiz-dev-auth-row">
                  <button
                    type="button"
                    className="quiz-dev-auth-btn"
                    onClick={handleOpenAdminPanel}
                  >
                    Open Admin Panel
                  </button>
                  <button
                    type="button"
                    className="quiz-dev-auth-btn"
                    onClick={handleOpenQuiz}
                  >
                    Open Quiz
                  </button>
                </div>
              </section>
            )}
          </div>
        </main>
          </>
        )}
      </div>

      <QuizModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAdmin={!!authUser?.isAdmin}
        initialTab={modalInitialTab}
        onViewLeaderboard={handleViewLeaderboard}
      />
    </div>
  );
}
