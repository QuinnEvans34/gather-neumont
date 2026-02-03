import { Outlet, useOutlet } from "react-router-dom";
import GamePage from "../Game.tsx";

export default function OverlayLayout() {
  const outlet = useOutlet();
  const isOverlayVisible = outlet != null;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <GamePage />

      {isOverlayVisible ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <Outlet />
        </div>
      ) : null}
    </div>
  );
}
