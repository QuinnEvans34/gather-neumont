import { useEffect, useMemo, useRef } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import GamePage from "../Game.tsx";
import LoginPage from "../pages/LoginPage";
import OnboardingLanding from "../pages/onboarding/Landing";
import ProfileStep from "../pages/onboarding/ProfileStep";
import AvatarStep from "../pages/onboarding/AvatarStep";
import MajorStep from "../pages/onboarding/MajorStep";

export default function OverlayLayout() {
  const outlet = useOutlet();
  const location = useLocation();
  const isOverlayVisible = outlet != null;
  const overlayRootRef = useRef<HTMLDivElement | null>(null);

  const overlayUi = useMemo(() => {
    switch (location.pathname) {
      case "/login":
        return <LoginPage />;
      case "/onboarding":
        return <OnboardingLanding />;
      case "/onboarding/profile":
        return <ProfileStep />;
      case "/onboarding/avatar":
        return <AvatarStep />;
      case "/onboarding/major":
        return <MajorStep />;
      default:
        return null;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isOverlayVisible) return;
    // Ensure key events are captured even when no input is focused.
    overlayRootRef.current?.focus();
  }, [isOverlayVisible, location.pathname]);

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
          {overlayUi ? (
            <>
              {/* Render route elements (incl. guards) but keep them out of view. */}
              <div style={{ display: "none" }}>{outlet}</div>
              {overlayUi}
            </>
          ) : (
            outlet
          )}
        </div>
      ) : null}
    </div>
  );
}
