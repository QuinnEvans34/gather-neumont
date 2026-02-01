import { serve } from "bun";
import index from "./index.html";

function apiHandler(req: Request): Response {
  return Response.json(
    { error: "Not found", path: new URL(req.url).pathname },
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
