/**
 * Main HTTP Server - Entry point for the Bun-based backend.
 * Handles API routes, WebSocket terminal connections, and static file serving.
 */
import { serve } from "bun";
import { cwd } from "node:process";
import { initDB } from "./server/database/database.ts";
import index from "./index.html";

// Route modules
import { systemRoutes } from "./server/routes/system.ts";
import { fileRoutes } from "./server/routes/files.ts";
import { graphRoutes } from "./server/routes/graph.ts";
import { aiRoutes } from "./server/routes/ai.ts";
import { sessionRoutes } from "./server/routes/session.ts";
import { gitRoutes } from "./server/routes/git.ts";
import { opencodeRoutes } from "./server/routes/opencode.ts";
import { opencodeServeRoutes } from "./server/routes/opencode-serve.ts";
import { terminalSocket, type WebSocketData } from "./server/socket/terminal.ts";

// Initialize database for current workspace
await initDB(cwd());

const server = serve<WebSocketData>({
  routes: {
    "/*": index,

    // Spread all route modules
    ...systemRoutes,
    ...fileRoutes,
    ...graphRoutes,
    ...aiRoutes,
    ...sessionRoutes,
    ...gitRoutes,
    ...opencodeRoutes,
    ...opencodeServeRoutes,

    // Terminal Upgrade Route
    "/api/terminal": (req: Request) => {
      const url = new URL(req.url);
      const sessionId = url.searchParams.get("sessionId");

      if (server.upgrade(req, { data: { sessionId: sessionId ?? undefined } })) {
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    },
  },

  websocket: terminalSocket,

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.info(`🚀 Server running at ${server.url}`);
