import { serve } from "bun";
import { join, normalize, sep } from "node:path";
import index from "./index.html";
import { handleQuizApi } from "./server/api/quiz";
import { handleAuthApi } from "./server/api/auth";
import { handleLeaderboardApi } from "./server/api/leaderboard";
import { handleAdminApi } from "./server/api/admin";

const ASSETS_DIR = normalize(join(import.meta.dir, "..", "public", "assets"));

async function assetsHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // url.pathname is expected to be /assets/<path>
  let rel = url.pathname.slice("/assets/".length);
  try {
    rel = decodeURIComponent(rel);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const parts = rel.split("/").filter(Boolean);
  if (parts.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  for (const part of parts) {
    // Reject traversal and Windows path tricks.
    if (
      part === "." ||
      part === ".." ||
      part.includes("\\") ||
      part.includes("\0") ||
      /^[a-zA-Z]:/.test(part)
    ) {
      return new Response("Bad Request", { status: 400 });
    }
  }

  const fsPath = normalize(join(ASSETS_DIR, ...parts));
  const base = ASSETS_DIR.toLowerCase();
  const full = fsPath.toLowerCase();
  if (full !== base && !full.startsWith(base + sep)) {
    return new Response("Bad Request", { status: 400 });
  }

  const file = Bun.file(fsPath);
  if (!(await file.exists())) {
    return new Response("Not Found", { status: 404 });
  }

  // Bun infers Content-Type for file responses.
  return new Response(file);
}

async function apiHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Route /api/quiz/* to quiz API handler
  if (url.pathname.startsWith("/api/quiz")) {
    return handleQuizApi(req);
  }

  // Route /api/auth/* to auth API handler
  if (url.pathname.startsWith("/api/auth")) {
    return handleAuthApi(req);
  }

  if (url.pathname.startsWith("/api/leaderboard")) {
    return handleLeaderboardApi(req);
  }

  if (url.pathname.startsWith("/api/admin")) {
    return handleAdminApi(req);
  }

  // Default 404 for unknown API routes
  return Response.json(
    { error: "Not found", path: url.pathname },
    { status: 404 }
  );
}

const server = serve({
  routes: {
    // API routes return JSON
    "/api/*": apiHandler,
    // Static assets (do not SPA-fallback when missing).
    "/assets/*": assetsHandler,
    // Serve index.html for all unmatched routes.
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
