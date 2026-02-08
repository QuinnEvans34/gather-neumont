import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { putProfile } from "../../api/profileApi";
import { MAJORS } from "../../config/majors";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";

export default function EditMajor() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();

  const selected = profile.profileDraft.intendedMajorId;
  const canSave = useMemo(() => profile.hasMajor(), [profile, selected]);

  async function handleSave() {
    profile.setProfileDraft({ intendedMajorId: selected });

    if (auth.mode === "user" || auth.mode === "admin") {
      const nextDraft = { ...profile.profileDraft, intendedMajorId: selected };
      void putProfile({
        displayName: nextDraft.displayName,
        email: nextDraft.email,
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

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 640, width: "min(640px, calc(100vw - 48px))", padding: 24 }}>
        <h1 style={{ margin: 0 }}>Edit Major</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>Pick an intended major (you can change it anytime).</p>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {MAJORS.map((m) => {
            const isSelected = m.id === selected;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => profile.setProfileDraft({ intendedMajorId: m.id })}
                style={{
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  border: isSelected
                    ? "1px solid rgba(255, 255, 255, 0.35)"
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  background: isSelected ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <img src={m.logoPath} alt={`${m.label} icon`} style={{ width: 36, height: 36, display: "block" }} />
                <div style={{ fontSize: 14, lineHeight: 1.2 }}>{m.label}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              width: "100%",
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
              width: "100%",
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
      </div>
    </div>
  );
}
