import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Phaser from "phaser";
import createGame from "./game.ts";
import { isOverlayRoute } from "./utils/overlayRoutes";
import DialogueUI from "./components/DialogueUI.tsx";
import QuestTracker from "./components/QuestTracker.tsx";
import PlayerProfile from "./components/PlayerProfile.tsx";
import QuizPanel from "./ui/quiz/QuizPanel.tsx";
import { useQuestData, useSelectedQuest } from "./hooks/useQuestData.ts";
import { usePlayerData } from "./hooks/usePlayerData.ts";
import { doc, updateDoc, arrayRemove } from "firebase/firestore";
import { db, COLLECTIONS } from "./lib/firebase.ts";
import FirestoreHelpers from "./lib/firestore-helpers.ts";
import { GameEventBridge } from "./systems/GameEventBridge.ts";

/**
 * TODO: Replace with actual authenticated player username
 * For now, using sarah_dev test player from Firebase seed data
 * This should be replaced with Firebase Auth or user context
 *
 * sarah_dev player has:
 * - 2 active quests
 * - 3 completed quests
 * - Username: sarah_dev
 * - Real Name: Sarah Martinez
 */
const TEST_PLAYER_USERNAME = "sarah_dev"; // Stable username from seed data

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
