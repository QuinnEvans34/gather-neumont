import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { putProfile } from "../../api/profileApi";
import { createAvatar } from "@dicebear/core";
import { DICEBEAR_STYLE_LABELS, DICEBEAR_STYLES, type DicebearStyleId } from "../../avatars/dicebear_registry";
import { AVATAR_STYLE_ORDER, getNextStyle } from "../../avatars/styleList";
import { randomSeed } from "../../utils/random";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";

export default function EditAvatar() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();

  const draftStyle = profile.profileDraft.avatar.style as DicebearStyleId | undefined;
  const style =
    draftStyle && AVATAR_STYLE_ORDER.includes(draftStyle) ? draftStyle : (AVATAR_STYLE_ORDER[0]! as DicebearStyleId);
  const seed = profile.profileDraft.avatar.seed;

  const svg = useMemo(() => createAvatar(DICEBEAR_STYLES[style], { seed }).toString(), [seed, style]);
  const dataUrl = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  const styleLabel = DICEBEAR_STYLE_LABELS[style] ?? style;

  async function handleSave() {
    if (auth.mode === "user" || auth.mode === "admin") {
      const nextDraft = { ...profile.profileDraft };
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

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, width: "min(520px, calc(100vw - 48px))", padding: 24 }}>
        <h1 style={{ margin: 0 }}>Edit Avatar</h1>
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

        <p style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
          Style:{" "}
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{style}</span>
        </p>

        <p style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
          Seed:{" "}
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {seed}
          </span>
        </p>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                const prevStyle = getNextStyle(style, -1);
                profile.setProfileDraft({ avatar: { style: prevStyle } });
              }}
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
              Previous
            </button>

            <button
              type="button"
              onClick={() => {
                const nextStyle = getNextStyle(style, +1);
                profile.setProfileDraft({ avatar: { style: nextStyle } });
              }}
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
              Next
            </button>

            <button
              type="button"
              onClick={() => {
                profile.setProfileDraft({ avatar: { seed: randomSeed() } });
              }}
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
              New Seed
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
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
      </div>
    </div>
  );
}
