/**
 * AI Routes
 * Handles code indexing and vector search.
 */
import { Glob } from "bun";
import { join } from "node:path";
import { generateEmbedding } from "../ai/embeddings";
import { insertEmbedding, searchVectors } from "../database/database";
import { getWorkspaceRoot } from "../workspace";

export const aiRoutes = {
  "/api/ai/index": {
    async POST() {
      const glob = new Glob("src/**/*.{ts,tsx}");
      let count = 0;

      for await (const file of glob.scan({ cwd: getWorkspaceRoot() })) {
        if (file.includes("node_modules") || file.split("/").some((p) => p.startsWith("."))) {
          continue;
        }

        const fullPath = join(getWorkspaceRoot(), file);
        const content = await Bun.file(fullPath).text();
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
};
