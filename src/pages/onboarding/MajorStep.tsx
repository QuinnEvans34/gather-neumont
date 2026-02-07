import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { putProfile } from "../../api/profileApi";
import { MAJORS } from "../../config/majors";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";

export default function MajorStep() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

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
            if (isSaving) return;
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
              try {
                setIsSaving(true);
                await putProfile(profile.profileDraft);
              } catch (err) {
                // eslint-disable-next-line no-console
                console.warn("Failed to save profile to server:", err);
                window.alert("Failed to save your profile. Please try again.");
                return;
              } finally {
                setIsSaving(false);
              }
            }
            navigate("/");
          }}
          disabled={!canFinish || isSaving}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255, 255, 255, 0.18)",
            background:
              canFinish && !isSaving ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
            color: "inherit",
            cursor: canFinish && !isSaving ? "pointer" : "not-allowed",
          }}
        >
          {isSaving ? "Saving..." : "Finish"}
        </button>
      </div>
    </div>
  );
}
