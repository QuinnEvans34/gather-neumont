import { createAvatar } from "@dicebear/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { MAJORS } from "../../config/majors";
import { DICEBEAR_STYLES } from "../../avatars/dicebear_registry";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";

export default function ProfileHUD() {
  const auth = useAuth();
  const profile = useProfile();

  const username = auth.me?.username?.trim() ? auth.me.username : "Guest";
  const draft = profile.profileDraft;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const majorLabel = useMemo(() => {
    const hit = MAJORS.find((m) => m.id === draft.intendedMajorId);
    return hit?.label ?? String(draft.intendedMajorId ?? "");
  }, [draft.intendedMajorId]);

  const avatarSvg = useMemo(() => {
    const avatar = draft.avatar;
    if (!avatar || avatar.provider !== "dicebear") return null;

    const style = (DICEBEAR_STYLES as any)[avatar.style];
    if (!style) return null;

    try {
      return createAvatar(style, { seed: avatar.seed, size: 64 }).toString();
    } catch {
      return null;
    }
  }, [draft.avatar]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      const root = containerRef.current;
      if (!root) return;
      if (root.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    popoverRef.current?.focus();
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        color: "rgba(255, 255, 255, 0.92)",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          cursor: "pointer",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          background: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(6px)",
          color: "rgba(255, 255, 255, 0.92)",
          fontFamily: "inherit",
          borderRadius: 999,
          padding: "8px 12px",
          display: "grid",
          gap: 2,
          textAlign: "left",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ fontSize: 12, lineHeight: 1.1, opacity: 0.85 }}>Profile</div>
        <div style={{ fontSize: 13, lineHeight: 1.15, fontWeight: 600 }}>{username}</div>
      </button>

      {open ? (
        <div
          ref={popoverRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Profile details"
          style={{
            width: 320,
            maxWidth: "calc(100vw - 24px)",
            borderRadius: 14,
            border: "1px solid rgba(255, 255, 255, 0.18)",
            background: "rgba(15, 15, 18, 0.92)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
            padding: 12,
            outline: "none",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              aria-hidden="true"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                background: "rgba(255,255,255,0.06)",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
              }}
              dangerouslySetInnerHTML={avatarSvg ? { __html: avatarSvg } : undefined}
            />

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.15 }}>
                {draft.displayName?.trim() ? draft.displayName : "—"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3, lineHeight: 1.15 }}>
                @{username}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 12, lineHeight: 1.25 }}>
            <Row label="Username" value={username} />
            <Row
              label="Location"
              value={draft.location?.trim() ? draft.location : "—"}
            />
            <Row label="Intended Major" value={majorLabel || "—"} />

            {auth.mode === "guest" ? (
              <div
                style={{
                  marginTop: 4,
                  paddingTop: 10,
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                  opacity: 0.9,
                }}
              >
                Guest — progress not saved
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
      <div style={{ opacity: 0.75 }}>{props.label}</div>
      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
        {props.value}
      </div>
    </div>
  );
}
