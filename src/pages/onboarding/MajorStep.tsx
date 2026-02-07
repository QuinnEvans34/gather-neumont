import { useNavigate } from "react-router-dom";
import { putProfile } from "../../api/profileApi";
import { MAJORS } from "../../config/majors";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";

export default function MajorStep() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();

  const selected = profile.profileDraft.intendedMajorId;
  const canFinish = profile.hasProfileBasics() && profile.hasAvatar() && profile.hasMajor();

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Major</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>Pick an intended major (you can change it later).</p>

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
                <img
                  src={m.logoPath}
                  alt={`${m.label} icon`}
                  style={{ width: 36, height: 36, display: "block" }}
                />
                <div style={{ fontSize: 14, lineHeight: 1.2 }}>{m.label}</div>
              </button>
            );
          })}
        </div>

        <button
          onClick={async () => {
            if (!profile.hasProfileBasics()) {
              navigate("/onboarding/profile");
              return;
            }
            if (!profile.hasAvatar()) {
              navigate("/onboarding/avatar");
              return;
            }
            if (!profile.hasMajor()) {
              return;
            }

            if (auth.mode === "user" || auth.mode === "admin") {
              const nextDraft = { ...profile.profileDraft, intendedMajorId: selected };
              profile.setProfileDraft({ intendedMajorId: selected });
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
                // Non-blocking: ignore errors and continue onboarding.
              });
            } else {
              // Still ensure final selection is applied locally for guests.
              profile.setProfileDraft({ intendedMajorId: selected });
            }
            navigate("/");
          }}
          disabled={!canFinish}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255, 255, 255, 0.18)",
            background: canFinish ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
            color: "inherit",
            cursor: canFinish ? "pointer" : "not-allowed",
          }}
        >
          Finish
        </button>
      </div>
    </div>
  );
}
