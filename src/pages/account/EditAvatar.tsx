import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { putProfile } from "../../api/profileApi";
import { createAvatar } from "@dicebear/core";
import { DICEBEAR_STYLE_LABELS, DICEBEAR_STYLES, type DicebearStyleId } from "../../avatars/dicebear_registry";
import { AVATAR_STYLE_ORDER, getNextStyle } from "../../avatars/styleList";
import { randomSeed } from "../../utils/random";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";
import "../../styles/auth-onboarding.css";

export default function EditAvatar() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();

  const baseSeedRef = useRef(profile.profileDraft.avatar.seed);
  const [, setSeedOffset] = useState(0);

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
    <div className="account-overlay">
      <div className="account-container">
        <h1 className="account-heading">Edit Avatar</h1>
        <p className="account-description">
          Customize your avatar. Style: {styleLabel}
        </p>

        <div className="avatar-preview-wrapper">
          <img
            src={dataUrl}
            alt="Avatar preview"
            className="avatar-preview"
          />

          <div className="avatar-info">
            <div className="avatar-info-label">Style</div>
            <div className="avatar-info-value">{style}</div>
          </div>

          <div className="avatar-info">
            <div className="avatar-info-label">Seed</div>
            <div className="avatar-info-value">{seed}</div>
          </div>
        </div>

        <div className="account-actions" style={{ marginTop: 20 }}>
          <div className="button-group-inline">
            <button
              type="button"
              onClick={() => {
                if (AVATAR_STYLE_ORDER.length > 1) {
                  const prevStyle = getNextStyle(style, -1);
                  profile.setProfileDraft({ avatar: { style: prevStyle } });
                  return;
                }
                setSeedOffset((prev) => {
                  const next = prev - 1;
                  const newSeed = `${baseSeedRef.current}:${next}`;
                  profile.setProfileDraft({ avatar: { seed: newSeed } });
                  return next;
                });
              }}
              className="btn btn-secondary"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => {
                if (AVATAR_STYLE_ORDER.length > 1) {
                  const nextStyle = getNextStyle(style, +1);
                  profile.setProfileDraft({ avatar: { style: nextStyle } });
                  return;
                }
                setSeedOffset((prev) => {
                  const next = prev + 1;
                  const newSeed = `${baseSeedRef.current}:${next}`;
                  profile.setProfileDraft({ avatar: { seed: newSeed } });
                  return next;
                });
              }}
              className="btn btn-secondary"
            >
              Next
            </button>

            <button
              type="button"
              onClick={() => {
                const next = randomSeed();
                baseSeedRef.current = next;
                setSeedOffset(0);
                profile.setProfileDraft({ avatar: { seed: next } });
              }}
              className="btn btn-secondary"
            >
              New Seed
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
          >
            Save Changes
          </button>

          <button
            type="button"
            onClick={() => navigate("/account")}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
