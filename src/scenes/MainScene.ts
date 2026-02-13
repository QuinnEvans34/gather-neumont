import Phaser from "phaser";
import { GroundFloor } from "./maps/GroundFloor";

const PLAYER_SPEED = 200;
const PLAYER_SIZE = 50;

const temporaryMap = `
-0007,-0003 ob
+0005,-0005 ob
+0005,+0001 ob
+0000,-0001
-0005,-0007
+0002,-0007
-0002,-0004
+0002,-0005
-0005,+0005
-0006,+0002
+0003,+0002
+0001,+0005
+0006,+0000
-0008,+0000 ob
-0008,-0007 ob
+0002,-0009 ob
+0008,-0004 ob
-0003,+0007 ob
`;

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

  constructor() {
    super({ key: "MainScene" });
  }

  preload(): void {
    // No assets to load for MVP - using simple shapes
  }

  create(): void {
    // Create tiles group for physics
    const tiles = this.physics.add.staticGroup();
    const groundFloor = new GroundFloor(temporaryMap);

    // Create ground floor layout from map file
    groundFloor.createTiles(this, tiles);

    // Get spawn position from map
    const spawnPos = groundFloor.getSpawnPosition();

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

    // Set up collision between player and tiles
    this.physics.add.collider(this.player, tiles);

    // Set up keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Configure camera to follow player
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.0);
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
  }
}
