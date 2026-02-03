import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => username.trim().length > 0 && !isSubmitting, [isSubmitting, username]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await auth.login(username.trim());
      navigate("/onboarding/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Login</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>
          Enter a username (3-20 letters, numbers, or <code>_</code>).
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Username</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_name"
              autoComplete="username"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.18)",
                background: "rgba(0, 0, 0, 0.25)",
                color: "inherit",
                outline: "none",
              }}
            />
          </label>

          {error ? (
            <div style={{ fontSize: 13, color: "#ffb4b4", opacity: 0.95 }}>{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.18)",
              background: canSubmit ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
              color: "inherit",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
          Current mode: <strong>{auth.mode}</strong>
        </p>
      </div>
    </div>
  );
}
