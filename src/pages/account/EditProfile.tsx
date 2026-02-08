import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { putProfile } from "../../api/profileApi";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";

export default function EditProfile() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile.profileDraft.displayName);
  const [locationText, setLocationText] = useState(profile.profileDraft.location);
  const [email, setEmail] = useState(profile.profileDraft.email ?? "");

  const canSave = useMemo(() => {
    return displayName.trim().length > 0 && locationText.trim().length > 0;
  }, [displayName, locationText]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    const nextDraft = {
      ...profile.profileDraft,
      displayName: displayName.trim(),
      location: locationText.trim(),
      email: email.trim() ? email.trim() : undefined,
    };

    profile.setProfileDraft({
      displayName: nextDraft.displayName,
      location: nextDraft.location,
      email: nextDraft.email,
    });

    if (auth.mode === "user" || auth.mode === "admin") {
      void putProfile({
        displayName: nextDraft.displayName,
        email: nextDraft.email,
        location: nextDraft.location,
        intendedMajorId: nextDraft.intendedMajorId,
        avatar: {
          provider: "dicebear",
          style: String(nextDraft.avatar.style),
          seed: String(nextDraft.avatar.seed),
        },
      }).catch(() => {
        // Non-blocking: ignore errors and return to hub.
      });
    }

    navigate("/account");
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
      <div style={{ maxWidth: 520, width: "min(520px, calc(100vw - 48px))", padding: 24 }}>
        <h1 style={{ margin: 0 }}>Edit Profile</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>Update your profile details.</p>

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
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
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

          <div style={{ marginTop: 4, display: "grid", gap: 10 }}>
            <button
              type="submit"
              disabled={!canSave}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.18)",
                background: canSave ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
                color: "inherit",
                cursor: canSave ? "pointer" : "not-allowed",
                fontWeight: 800,
              }}
            >
              Save
            </button>

            <button
              type="button"
              onClick={() => navigate("/account")}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.18)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "inherit",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

