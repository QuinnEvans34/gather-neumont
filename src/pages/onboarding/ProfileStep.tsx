import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../features/profile/ProfileContext";

export default function ProfileStep() {
  const profile = useProfile();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile.profileDraft.displayName);
  const [location, setLocation] = useState(profile.profileDraft.location);
  const [email, setEmail] = useState(profile.profileDraft.email ?? "");

  const canContinue = useMemo(() => {
    return displayName.trim().length > 0 && location.trim().length > 0;
  }, [displayName, location]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canContinue) return;

    profile.setProfileDraft({
      displayName: displayName.trim(),
      location: location.trim(),
      email: email.trim() ? email.trim() : undefined,
    });
    profile.setStep("avatar");
    navigate("/onboarding/avatar");
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255, 255, 255, 0.18)",
    background: "rgba(0, 0, 0, 0.25)",
    color: "inherit",
    outline: "none",
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Profile</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>Tell us a bit about you.</p>

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Display name</div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Location</div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Salt Lake City, UT"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Email (optional)</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              autoComplete="email"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={!canContinue}
            style={{
              marginTop: 4,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.18)",
              background: canContinue ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
              color: "inherit",
              cursor: canContinue ? "pointer" : "not-allowed",
            }}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
