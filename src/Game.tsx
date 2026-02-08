import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Phaser from "phaser";
import createGame from "./game.ts";
import { appEvents } from "./events/appEvents";
import { isOverlayRoute } from "./utils/overlayRoutes";

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
      <DialogueUI />

      {/* Player Profile - Top Left */}
      <PlayerProfile
        username={player?.Username || TEST_PLAYER_USERNAME}
        realName={player?.RealName || "Unknown"}
        totalPoints={totalPoints}
        activeQuestsCount={activeQuestsCount}
        completedQuestsCount={completedQuestsCount}
        totalPuzzlesCompleted={totalPuzzlesCompleted}
        loading={playerLoading}
      />

      {/* Quest Tracker - Top Right */}
      <QuestTracker
        selectedQuest={selectedQuest}
        activeQuests={activeQuests}
        completedQuests={completedQuests}
        onSelectQuest={selectQuest}
        onRemoveQuest={handleRemoveQuest}
        onCompleteQuest={handleCompleteQuest}
        loading={loading}
      />

      {/* Daily Quiz Popup */}
      <QuizPanel
        isOpen={isDailyQuizOpen}
        onClose={() => setIsDailyQuizOpen(false)}
      />
    </div>
  );
}

export default GamePage;
