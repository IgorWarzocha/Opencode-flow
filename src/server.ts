/**
 * Main HTTP Server - Entry point for the Bun-based backend.
 * Handles API routes, WebSocket terminal connections, and static file serving.
 */
import type { ServerWebSocket } from "bun";
import { serve, Glob } from "bun";
import { db, initDB, insertEmbedding, searchVectors } from "./server/database/database.ts";
import { generateEmbedding } from "./server/ai/embeddings.ts";
import { listWorktrees, createWorktree, getWorktreeDiff, mergeSessionBranch } from "./server/git/git.ts";
import { createSession, listSessions, getSession, deleteSession, archiveSession } from "./server/session/session.ts";
import { spawnAgentProcess, type AgentProcess } from "./server/agent/spawner.ts";
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
 * Holds the spawned agent subprocess for the terminal.
 */
interface WebSocketData {
  proc?: AgentProcess | undefined;
  sessionId?: string | undefined;
  worktreePath?: string | undefined;
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

    "/api/sessions": {
      GET() {
        return Response.json(listSessions());
      },
      async POST(req: Request) {
        const { name, context } = (await req.json()) as {
          name: string;
          context?: Record<string, unknown>;
        };
        return Response.json(await createSession(name, context));
      },
    },

    "/api/sessions/:id": (req: Request & { params: { id: string } }) => {
      const { id } = req.params;
      if (req.method === "GET") {
        const session = getSession(id);
        if (!session) {
          return new Response("Session not found", { status: 404 });
        }
        return Response.json(session);
      }
      if (req.method === "DELETE") {
        deleteSession(id);
        return new Response(null, { status: 204 });
      }
      return new Response("Method not allowed", { status: 405 });
    },

    "/api/sessions/:id/diff": async (req: Request & { params: { id: string } }) => {
      const { id } = req.params;
      const session = getSession(id);
      if (!session) {
        return new Response("Session not found", { status: 404 });
      }
      if (!session.worktree_path) {
        return new Response("Session has no worktree", { status: 400 });
      }
      try {
        const diff = await getWorktreeDiff(session.worktree_path);
        return new Response(diff);
      } catch (error) {
        return new Response(String(error), { status: 500 });
      }
    },

    "/api/sessions/:id/merge": async (req: Request & { params: { id: string } }) => {
      const { id } = req.params;
      const session = getSession(id);
      
      if (!session) return new Response("Session not found", { status: 404 });
      if (!session.worktree_path) return new Response("Session invalid (no worktree)", { status: 400 });

      try {
        // 1. Merge
        const result = await mergeSessionBranch(session.worktree_path, "main");
        
        if (result.status === "error") {
            return new Response(result.reason, { status: 500 });
        }
        if (result.status === "conflict") {
            return new Response(`Merge conflict in: ${result.files.join(", ")}`, { status: 409 });
        }

        // 2. Archive on success
        await archiveSession(id, "merged");
        
        return Response.json({ success: true, message: "Merged successfully" });
      } catch (error) {
        return new Response(String(error), { status: 500 });
      }
    },

    "/api/terminal": (req: Request) => {

      const url = new URL(req.url);
      const sessionId = url.searchParams.get("sessionId");

      let worktreePath: string | undefined;

      if (sessionId) {
        const session = getSession(sessionId);
        if (session?.worktree_path) {
          worktreePath = session.worktree_path;
        }
      }

      if (server.upgrade(req, { data: { sessionId: sessionId ?? undefined, worktreePath } })) {
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    },
  },

  websocket: {
    open(ws) {
      const { sessionId, worktreePath } = ws.data;

      // Use spawnAgentProcess for session-bound terminals, fallback to plain bash
      const proc = sessionId && worktreePath
        ? spawnAgentProcess(worktreePath, sessionId)
        : Bun.spawn(["bash"], {
            stdin: "pipe",
            stdout: "pipe",
            stderr: "pipe",
            cwd: process.cwd(),
            env: { ...process.env, TERM: "xterm-256color" } as Record<string, string>,
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