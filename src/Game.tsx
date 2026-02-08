import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Phaser from "phaser";
import createGame from "./game.ts";
import { appEvents } from "./events/appEvents";

function GamePage() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const location = useLocation();
  const [isDailyQuizOpen, setIsDailyQuizOpen] = useState(false);

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
      location.pathname === "/login" ||
      location.pathname === "/sign-in" ||
      location.pathname === "/create-account" ||
      location.pathname === "/admin" ||
      location.pathname === "/onboarding" ||
      location.pathname.startsWith("/onboarding/") ||
      location.pathname === "/account" ||
      location.pathname.startsWith("/account/");
    const enabled = !isOverlayRoute && !isDailyQuizOpen;

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
  }, [isDailyQuizOpen, location.pathname]);

  useEffect(() => {
    const offDailyQuizOpen = appEvents.onDailyQuizOpenChanged((isOpen) => {
      setIsDailyQuizOpen(isOpen);
    });

    function onTerminalStart(_event: Event) {
      appEvents.emitOpenDailyQuiz();
    }

    window.addEventListener("dailyQuiz:start", onTerminalStart);
    return () => {
      offDailyQuizOpen();
      window.removeEventListener("dailyQuiz:start", onTerminalStart);
    };
  }, []);

  return (
    <div className="game-wrapper" style={{ position: "fixed", inset: 0 }}>
      <div id="game-container" />
    </div>
  );
}

export default GamePage;
