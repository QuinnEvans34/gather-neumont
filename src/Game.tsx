import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Phaser from "phaser";
import createGame from "./game.ts";
import { appEvents } from "./events/appEvents";
import { isOverlayRoute } from "./utils/overlayRoutes";

const SHARED_GAME_KEY = "__gather_phaser_game__";
const SHARED_GAME_CLEANUP_TIMER_KEY = "__gather_phaser_game_cleanup_timer__";

function getSharedGame(): Phaser.Game | null {
  return ((globalThis as any)[SHARED_GAME_KEY] as Phaser.Game | null) ?? null;
}

function setSharedGame(game: Phaser.Game | null) {
  (globalThis as any)[SHARED_GAME_KEY] = game;
}

function clearDevCleanupTimer() {
  const t = (globalThis as any)[SHARED_GAME_CLEANUP_TIMER_KEY] as number | null | undefined;
  if (typeof t === "number") {
    clearTimeout(t);
  }
  (globalThis as any)[SHARED_GAME_CLEANUP_TIMER_KEY] = null;
}

function scheduleDevCleanup(fn: () => void, delayMs: number) {
  clearDevCleanupTimer();
  (globalThis as any)[SHARED_GAME_CLEANUP_TIMER_KEY] = setTimeout(fn, delayMs) as any as number;
}

function isHotDev(): boolean {
  return Boolean((import.meta as any)?.hot);
}

function ensureGameAttached(game: Phaser.Game, containerId: string) {
  const container = document.getElementById(containerId);
  const canvas = (game as any).canvas as HTMLCanvasElement | undefined;
  if (!container || !canvas) return;
  if (canvas.parentElement !== container) {
    container.appendChild(canvas);
  }
}

function GamePage() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const location = useLocation();
  const [isDailyQuizOpen, setIsDailyQuizOpen] = useState(false);

  useEffect(() => {
    clearDevCleanupTimer();

    let game = getSharedGame();
    if (!game) {
      game = createGame("game-container");
      setSharedGame(game);
    }

    gameRef.current = game;
    ensureGameAttached(game, "game-container");

    // Cleanup: destroy game on unmount to prevent memory leaks
    return () => {
      if (!game) return;
      gameRef.current = null;

      if (isHotDev()) {
        // In dev/HMR + React StrictMode, avoid destroying the game during the "test unmount"
        // so we don't create a second instance (which can lead to AudioContext errors).
        scheduleDevCleanup(() => {
          // If we unmounted for real (not the StrictMode test), clean up eventually.
          if (getSharedGame() === game) {
            game.destroy(true);
            setSharedGame(null);
          }
        }, 150);
        return;
      }

      game.destroy(true);
      if (getSharedGame() === game) {
        setSharedGame(null);
      }
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    const isOverlayRouteActive = isOverlayRoute(location.pathname);
    const enabled = !isOverlayRouteActive && !isDailyQuizOpen;

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
