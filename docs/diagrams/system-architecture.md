# System Architecture (ASCII)

```text
  +-------------------+        HTTP (SPA + API)        +-------------------+
  | Browser            | <---------------------------> | Bun server         |
  |-------------------|                               |-------------------|
  | React SPA          |                               | src/index.ts       |
  | Phaser game        |                               | /api/* routers     |
  | Overlay UI routes  |                               | /assets/* handler  |
  +-------------------+                               +-------------------+
           |                                                     |
           | fetch()                                             | read/write
           v                                                     v
  +-------------------+                               +-------------------+
  | API endpoints      |                               | JSON stores        |
  |-------------------|                               |-------------------|
  | /api/auth/*        |                               | data/users.json    |
  | /api/profile       |                               | data/profiles.json |
  | /api/quiz/*        |                               | data/progress.json |
  | /api/leaderboard   |                               | data/questions.json|
  +-------------------+                               | data/schedule.json |
                                                      +-------------------+
```

Legend:
- Left side is client runtime (React + Phaser in one page).
- Right side is Bun server routing to handlers and JSON-backed stores.

```text
  +------------------------+     overlay routes/panels     +------------------+
  | OverlayLayout          | ----------------------------> | Sign-in / Account |
  |------------------------|                               | Onboarding / Quiz |
  | GamePage (Phaser)      | <---- keyboard gated -------- | UI components     |
  | Overlay outlet (routes)|                               +------------------+
  +------------------------+
```

Legend:
- The game is always rendered; overlays mount above it.
- Input gating disables Phaser keyboard when overlays are active.

