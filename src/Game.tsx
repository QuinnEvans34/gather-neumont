import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Phaser from "phaser";
import createGame from "./game.ts";

function GamePage() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Initialize Phaser game on mount
    if (!gameRef.current) {
      gameRef.current = createGame("game-container");
    }

    // Cleanup: destroy game on unmount to prevent memory leaks
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    const isOverlayRoute =
      location.pathname === "/login" || location.pathname.startsWith("/onboarding");
    const enabled = !isOverlayRoute;

    const keyboard = (game as any).input?.keyboard as Phaser.Input.Keyboard.KeyboardPlugin | undefined;
    if (keyboard) {
      keyboard.enabled = enabled;
    }

    // Also toggle any active scene keyboard plugins (defensive).
    for (const scene of game.scene.getScenes(true)) {
      const sceneKeyboard = (scene as any)?.input?.keyboard as
        | Phaser.Input.Keyboard.KeyboardPlugin
        | undefined;
      if (sceneKeyboard) {
        sceneKeyboard.enabled = enabled;
      }
    }
  }, [location.pathname]);

  return (
    <div className="game-wrapper" style={{ position: "fixed", inset: 0 }}>
      <div id="game-container" />
    </div>
  );
}

export default GamePage;
