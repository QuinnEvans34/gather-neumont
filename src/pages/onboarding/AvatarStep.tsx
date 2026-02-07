import { useNavigate } from "react-router-dom";
import { putProfile } from "../../api/profileApi";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";
import { createAvatar } from "@dicebear/core";
import { DICEBEAR_STYLE_LABELS, DICEBEAR_STYLES, type DicebearStyleId } from "../../avatars/dicebear_registry";
import { randomSeed } from "../../utils/random";

function styleIds(): DicebearStyleId[] {
  return Object.keys(DICEBEAR_STYLES) as DicebearStyleId[];
}

function firstStyle(): DicebearStyleId {
  return styleIds()[0] ?? ("pixelArt" as DicebearStyleId);
}

function nextStyle(current: DicebearStyleId): DicebearStyleId {
  const ids = styleIds();
  if (ids.length === 0) return current;
  const idx = ids.indexOf(current);
  return ids[(idx + 1) % ids.length] ?? ids[0]!;
}

export default function AvatarStep() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();

  const style = profile.profileDraft.avatar.style ?? firstStyle();
  const seed = profile.profileDraft.avatar.seed;

  const svg = createAvatar(DICEBEAR_STYLES[style], { seed }).toString();
  const dataUrl = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  const styleLabel = DICEBEAR_STYLE_LABELS[style] ?? style;

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <h1>Avatar</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>DiceBear preview ({styleLabel})</p>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <img
            src={dataUrl}
            alt="Avatar preview"
            style={{
              width: 120,
              height: 120,
              imageRendering: "pixelated",
              background: "rgba(0, 0, 0, 0.18)",
              borderRadius: 16,
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          />
        </div>

        <p style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
          Seed:{" "}
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {seed}
          </span>
        </p>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <button
            onClick={() =>
              profile.setProfileDraft({
                avatar: {
                  style: nextStyle(style),
                  seed: randomSeed(),
                },
              })
            }
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
            onClick={async () => {
              if (!profile.hasProfileBasics()) {
                navigate("/onboarding/profile");
                return;
              }
              if (!profile.hasAvatar()) {
                return;
              }

              if (auth.mode === "user" || auth.mode === "admin") {
                void putProfile({
                  displayName: profile.profileDraft.displayName,
                  email: profile.profileDraft.email,
                  location: profile.profileDraft.location,
                  intendedMajorId: profile.profileDraft.intendedMajorId,
                  avatar: { provider: "dicebear", style: String(style), seed: String(seed) },
                }).catch(() => {
                  // Non-blocking: ignore errors and continue onboarding.
                });
              }

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
