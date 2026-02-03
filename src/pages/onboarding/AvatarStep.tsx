import { useNavigate } from "react-router-dom";
import { useProfile } from "../../features/profile/ProfileContext";

const SPRITES = ["sprite_1", "sprite_2", "sprite_3"] as const;

function pickRandomSpriteId(): string {
  const idx = Math.floor(Math.random() * SPRITES.length);
  return SPRITES[idx] ?? SPRITES[0];
}

export default function AvatarStep() {
  const profile = useProfile();
  const navigate = useNavigate();

  const spriteId = profile.profileDraft.avatar.spriteId;

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Avatar</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>
          Placeholder avatar selection. Current spriteId:
        </p>
        <p style={{ marginTop: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          {spriteId}
        </p>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <button
            onClick={() => profile.setProfileDraft({ avatar: { spriteId: pickRandomSpriteId() } })}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.18)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Randomize
          </button>

          <button
            onClick={() => {
              profile.setStep("major");
              navigate("/onboarding/major");
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: "rgba(255, 255, 255, 0.12)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

