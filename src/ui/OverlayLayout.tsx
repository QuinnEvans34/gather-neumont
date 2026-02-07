import { useEffect, useRef } from "react";
import { useOutlet } from "react-router-dom";
import GamePage from "../Game.tsx";
import { useAuth } from "../features/auth/AuthContext";

export default function OverlayLayout() {
  const auth = useAuth();
  const outlet = useOutlet();
  const isOverlayVisible = outlet != null;
  const overlayRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOverlayVisible) return;
    // Ensure key events are captured even when no input is focused.
    overlayRootRef.current?.focus();
  }, [isOverlayVisible, outlet]);

  function stopKeys(e: React.KeyboardEvent) {
    // Always stop propagation so Phaser key listeners don't run.
    e.stopPropagation();
    // Also stop any other native listeners on the same target during bubbling.
    // (Not supported in all browsers, but safe to attempt.)
    (e.nativeEvent as any)?.stopImmediatePropagation?.();

    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isEditable =
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      Boolean(target && (target as any).isContentEditable);

    // Only prevent default when the user isn't typing into an editable control.
    if (!isEditable) {
      e.preventDefault();
    }
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <GamePage />

      {auth.mode === "guest" ? (
        <div
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 50,
            pointerEvents: "none",
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.16)",
            background: "rgba(0, 0, 0, 0.45)",
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: 12,
            lineHeight: 1,
            backdropFilter: "blur(6px)",
          }}
        >
          Guest — progress not saved
        </div>
      ) : null}

      {isOverlayVisible ? (
        <div
          ref={overlayRootRef}
          tabIndex={-1}
          onKeyDownCapture={stopKeys}
          onKeyUpCapture={stopKeys}
          onKeyPressCapture={stopKeys}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            pointerEvents: "auto",
            outline: "none",
          }}
        >
          {outlet}
        </div>
      ) : null}
    </div>
  );
}
