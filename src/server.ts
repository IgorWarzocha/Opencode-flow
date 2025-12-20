/**
 * Main HTTP Server - Entry point for the Bun-based backend.
 * Handles API routes, WebSocket terminal connections, and static file serving.
 */
import type { Subprocess, ServerWebSocket } from "bun";
import { serve, Glob } from "bun";
import { db, initDB, insertEmbedding, searchVectors } from "./server/database/database.ts";
import { generateEmbedding } from "./server/ai/embeddings.ts";
import { listWorktrees, createWorktree } from "./server/git/git.ts";
import index from "./index.html";

// Initialize database and migrations
initDB();

/**
 * Row shape for nodes as stored in SQLite.
 * The `content` field stores JSON with position/data.
 */
interface NodeRow {
  id: string;
  type: string;
  content: string | null;
  created_at: string;
}

/**
 * Row shape for edges as stored in SQLite.
 */
interface EdgeRow {
  id: string;
  source: string;
  target: string;
  created_at: string;
}

/**
 * Data attached to each WebSocket connection.
 * Holds the spawned bash subprocess for the terminal.
 */
interface WebSocketData {
  proc?: Subprocess<"pipe", "pipe", "pipe">;
}

/**
 * Pipes a ReadableStream to a WebSocket connection.
 * Uses Bun's async generator conversion for proper async iteration.
 */
async function pipeStreamToSocket(
  stream: ReadableStream<Uint8Array>,
  socket: ServerWebSocket<WebSocketData>
): Promise<void> {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      socket.send(value);
    }
  } finally {
    reader.releaseLock();
  }
}

const server = serve<WebSocketData>({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      GET() {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      PUT() {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": (req: Request & { params: { name: string } }) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    "/api/graph": {
      GET() {
        const rows = db.query("SELECT * FROM nodes").all() as NodeRow[];
        const nodes = rows.map((node) => ({
          ...node,
          // Parse JSON content if it exists
          ...(JSON.parse(node.content ?? "{}") as Record<string, unknown>),
        }));
        const edges = db.query("SELECT * FROM edges").all() as EdgeRow[];
        return Response.json({ nodes, edges });
      },
    },

    "/api/graph/nodes": {
      async POST(req: Request) {
        const { type, position, data } = (await req.json()) as {
          type: string;
          position: unknown;
          data: unknown;
        };
        const id = crypto.randomUUID();
        const content = JSON.stringify({ position, data });
        db.query("INSERT INTO nodes (id, type, content, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
          .run(id, type, content);
        return Response.json({ id, type, position, data });
      },
    },

    "/api/graph/edges": {
      async POST(req: Request) {
        const { source, target } = (await req.json()) as {
          source: string;
          target: string;
        };
        const id = crypto.randomUUID();
        db.query("INSERT INTO edges (id, source, target, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
          .run(id, source, target);
        return Response.json({ id, source, target });
      },
    },

    "/api/worktrees": {
      async GET() {
        try {
          const worktrees = await listWorktrees();
          return Response.json(worktrees);
        } catch (error) {
          return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
        }
      },
      async POST(req: Request) {
        try {
          const { branch, path } = (await req.json()) as {
            branch: string;
            path: string;
          };
          await createWorktree(branch, path);
          return Response.json({ success: true, branch, path });
        } catch (error) {
          return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
        }
      },
    },

    "/api/ai/index": {
      async POST() {
        const glob = new Glob("src/**/*.{ts,tsx}");
        let count = 0;

        for await (const file of glob.scan({ cwd: "." })) {
          if (
            file.includes("node_modules") ||
            file.split("/").some((p) => p.startsWith("."))
          ) {
            continue;
          }

          const content = await Bun.file(file).text();
          // Skip empty files to avoid embedding errors
          if (!content.trim()) continue;

          const embedding = await generateEmbedding(content);
          const id = crypto.randomUUID();
          insertEmbedding(id, file, content, embedding);
          count++;
        }

        return Response.json({ success: true, indexed: count });
      },
    },

    "/api/ai/search": {
      async POST(req: Request) {
        const { query, limit } = (await req.json()) as {
          query: string;
          limit?: number;
        };
        const embedding = await generateEmbedding(query);
        const results = searchVectors(embedding, limit ?? 5);
        return Response.json(results);
      },
    },

    "/api/terminal": (req: Request) => {
      if (server.upgrade(req, { data: {} })) {
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    },
  },

  websocket: {
    open(ws) {
      const proc = Bun.spawn(["bash"], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          TERM: "xterm-256color",
        },
      });

      ws.data.proc = proc;

      // Fire-and-forget stream piping with proper error handling
      if (proc.stdout) {
        void pipeStreamToSocket(proc.stdout, ws).catch(() => {
          /* stream closed, ignore */
        });
      }
      if (proc.stderr) {
        void pipeStreamToSocket(proc.stderr, ws).catch(() => {
          /* stream closed, ignore */
        });
      }
    },
    message(ws, message) {
      const proc = ws.data.proc;
      if (proc?.stdin) {
        proc.stdin.write(message);
        void proc.stdin.flush();
      }
    },
    close(ws) {
      const proc = ws.data.proc;
      if (proc) {
        proc.kill();
      }
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.info(`🚀 Server running at ${server.url}`);
