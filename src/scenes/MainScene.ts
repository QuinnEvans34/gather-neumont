import Phaser from "phaser";
import { GroundFloor } from "./maps/GroundFloor";

const PLAYER_SPEED = 200;
const PLAYER_SIZE = 50;

/**
 * MainScene - The primary game scene for the Neumont Virtual Campus
 * Features the ground floor layout with multiple rooms and collision detection
 */
export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private quizTerminal!: Phaser.GameObjects.Rectangle;
  private quizTerminalZone!: Phaser.GameObjects.Zone;
  private quizPromptText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "MainScene" });
  }

  preload(): void {
    // No assets to load for MVP - using simple shapes
  }

  create(): void {
    // Create walls group for physics
    const walls = this.physics.add.staticGroup();

    // Create ground floor layout from map file
    GroundFloor.createWalls(this, walls);

    // Get spawn position from map
    const spawnPos = GroundFloor.getSpawnPosition();

    // Create player (blue square)
    this.player = this.add.rectangle(
      spawnPos.x,
      spawnPos.y,
      PLAYER_SIZE,
      PLAYER_SIZE,
      0x0000ff,
    );

    // Enable physics on player
    this.physics.add.existing(this.player);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setCollideWorldBounds(true);

    // Set up collision between player and walls
    this.physics.add.collider(this.player, walls);

    // Set up keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Daily Quiz "terminal" (placeholder interactable)
    const terminalX = spawnPos.x + 120;
    const terminalY = spawnPos.y;

    this.quizTerminal = this.add.rectangle(terminalX, terminalY, 78, 62, 0x7c3aed);
    this.quizTerminal.setStrokeStyle(2, 0xffffff, 0.9);
    this.quizTerminal.setDepth(2);

    const terminalLabel = this.add.text(terminalX, terminalY - 6, "Daily Quiz", {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "600",
    });
    terminalLabel.setOrigin(0.5);
    terminalLabel.setDepth(3);

    // Overlap zone (slightly larger than the terminal so it feels usable)
    this.quizTerminalZone = this.add.zone(terminalX, terminalY, 140, 120);
    this.physics.add.existing(this.quizTerminalZone, true);

    this.quizPromptText = this.add.text(terminalX, terminalY + 54, "Press E to start quiz", {
      fontSize: "12px",
      color: "#ffffff",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      padding: { x: 8, y: 4 },
    });
    this.quizPromptText.setOrigin(0.5);
    this.quizPromptText.setVisible(false);
    this.quizPromptText.setDepth(3);

    // Configure camera to follow player
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.0);
    this.cameras.main.setBounds(0, 0, GroundFloor.WIDTH, GroundFloor.HEIGHT);

    // Set physics world bounds to match map
    this.physics.world.setBounds(0, 0, GroundFloor.WIDTH, GroundFloor.HEIGHT);
  }

  override update(): void {
    if (!this.player || !this.player.body) {
      return;
    }

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

    // Handle horizontal movement (Arrow keys or WASD)
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      playerBody.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      playerBody.setVelocityX(PLAYER_SPEED);
    } else {
      playerBody.setVelocityX(0);
    }

    // Handle vertical movement (Arrow keys or WASD)
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      playerBody.setVelocityY(-PLAYER_SPEED);
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      playerBody.setVelocityY(PLAYER_SPEED);
    } else {
      playerBody.setVelocityY(0);
    }

    const isNearTerminal = Boolean(
      this.quizTerminalZone &&
        this.physics.overlap(this.player, this.quizTerminalZone),
    );

    if (this.quizPromptText) {
      this.quizPromptText.setVisible(isNearTerminal);
    }

    if (
      isNearTerminal &&
      this.interactKey &&
      Phaser.Input.Keyboard.JustDown(this.interactKey)
    ) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dailyQuiz:start"));
      }
    }
  }
}
