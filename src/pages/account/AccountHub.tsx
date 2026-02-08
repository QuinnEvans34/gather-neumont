import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";

export default function AccountHub() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();

  const username = auth.me?.username?.trim() ? auth.me.username : "Guest";
  const draft = profile.profileDraft;

  const buttonStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255, 255, 255, 0.18)",
    background: "rgba(255, 255, 255, 0.08)",
    color: "inherit",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 700,
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, width: "min(520px, calc(100vw - 48px))", padding: 24 }}>
        <h1 style={{ margin: 0 }}>Account</h1>
        <p style={{ marginTop: 8, opacity: 0.9, fontSize: 13 }}>
          {auth.me?.username ? `Logged in as ${username}` : "Guest — progress not saved"}
        </p>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <button type="button" onClick={() => navigate("/account/profile")} style={buttonStyle}>
            Edit Profile
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85, fontWeight: 600 }}>
              {draft.displayName?.trim() ? draft.displayName : "—"} · {draft.location?.trim() ? draft.location : "—"}
            </div>
          </button>
          <button type="button" onClick={() => navigate("/account/avatar")} style={buttonStyle}>
            Edit Avatar
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85, fontWeight: 600 }}>
              {draft.avatar?.provider === "dicebear" ? `${String(draft.avatar.style)} · ${String(draft.avatar.seed)}` : "—"}
            </div>
          </button>
          <button type="button" onClick={() => navigate("/account/major")} style={buttonStyle}>
            Edit Major
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85, fontWeight: 600 }}>
              {String(draft.intendedMajorId ?? "—")}
            </div>
          </button>
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: "rgba(255, 255, 255, 0.12)",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
