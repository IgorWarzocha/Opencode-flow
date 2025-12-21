/**
 * Graph Database Routes
 * Handles CRUD operations for nodes and edges in the visual graph.
 */
import { getDB } from "../database/database.ts";

interface NodeRow {
  id: string;
  type: string;
  content: string | null;
  created_at: string;
}

interface EdgeRow {
  id: string;
  source: string;
  target: string;
  created_at: string;
}

export const graphRoutes = {
  "/api/graph": {
    GET() {
      const rows = getDB().query("SELECT * FROM nodes").all() as NodeRow[];
      const nodes = rows.map((node) => ({
        ...node,
        ...(JSON.parse(node.content ?? "{}") as Record<string, unknown>),
      }));
      const edges = getDB().query("SELECT * FROM edges").all() as EdgeRow[];
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
      getDB()
        .query(
          "INSERT INTO nodes (id, type, content, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        )
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
      getDB()
        .query(
          "INSERT INTO edges (id, source, target, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        )
        .run(id, source, target);
      return Response.json({ id, source, target });
    },
  },
};
