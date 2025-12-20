import { serve } from "bun";
import { db, initDB } from "./server/database/database.ts";
import { listWorktrees, createWorktree, removeWorktree } from "./server/git/git.ts";
import index from "./index.html";

// Initialize database and migrations
initDB();

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    "/api/graph": {
      async GET(req) {
        const nodes = db.query("SELECT * FROM nodes").all().map((node: any) => ({
          ...node,
          // Parse JSON content if it exists
          ...JSON.parse(node.content || "{}"),
        }));
        const edges = db.query("SELECT * FROM edges").all();
        return Response.json({ nodes, edges });
      },
    },

    "/api/graph/nodes": {
      async POST(req) {
        const { type, position, data } = await req.json();
        const id = crypto.randomUUID();
        const content = JSON.stringify({ position, data });
        db.query("INSERT INTO nodes (id, type, content, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
          .run(id, type, content);
        return Response.json({ id, type, position, data });
      },
    },

    "/api/graph/edges": {
      async POST(req) {
        const { source, target } = await req.json();
        const id = crypto.randomUUID();
        db.query("INSERT INTO edges (id, source, target, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
          .run(id, source, target);
        return Response.json({ id, source, target });
      },
    },

    "/api/worktrees": {
      async GET(req) {
        try {
          const worktrees = await listWorktrees();
          return Response.json(worktrees);
        } catch (error) {
          return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
        }
      },
      async POST(req) {
        try {
          const { branch, path } = await req.json();
          await createWorktree(branch, path);
          return Response.json({ success: true, branch, path });
        } catch (error) {
          return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
