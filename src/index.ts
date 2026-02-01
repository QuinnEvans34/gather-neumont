import { serve } from "bun";
import index from "./index.html";
import { handleQuizApi } from "./server/api/quiz";

async function apiHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Route /api/quiz/* to quiz API handler
  if (url.pathname.startsWith("/api/quiz")) {
    return handleQuizApi(req);
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
