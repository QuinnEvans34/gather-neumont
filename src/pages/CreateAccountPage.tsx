import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useProfile } from "../features/profile/ProfileContext";
import { profileStorage } from "../features/profile/profileStorage";

async function fetchUsernameExists(username: string): Promise<boolean> {
  const trimmed = username.trim();
  const res = await fetch(`/api/auth/exists?username=${encodeURIComponent(trimmed)}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    let message = `Username check failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = String(data.error);
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { exists?: unknown };
  return Boolean(data?.exists);
}

export default function CreateAccountPage() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && !isSubmitting,
    [isSubmitting, username],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const trimmed = username.trim();
    setIsSubmitting(true);
    setError(null);

    try {
      const exists = await fetchUsernameExists(trimmed);
      if (exists) {
        setError("Account exists. Use Sign in.");
        return;
      }

      await auth.login(trimmed);

      // Ensure onboarding starts fresh for newly-created accounts.
      profileStorage.clear();
      profile.resetProfile();

      navigate("/onboarding/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create account failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Create account</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>
          Choose a username to create an account.
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
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
