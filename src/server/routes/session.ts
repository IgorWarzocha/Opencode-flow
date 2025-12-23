/**
 * Session Routes
 * Handles session creation, retrieval, deletion, and merging.
 */
import {
  createSession,
  listSessions,
  getSession,
  deleteSession,
  archiveSession,
} from "../session/session";
import { getWorktreeDiff, mergeSessionBranch } from "../git/git";

export const sessionRoutes = {
  "/api/sessions": {
    GET() {
      return Response.json(listSessions());
    },
    async POST(req: Request) {
      const { name, context, baseBranch } = (await req.json()) as {
        name: string;
        context?: Record<string, unknown>;
        baseBranch?: string;
      };
      const options: { baseBranch?: string } = {};
      if (baseBranch) options.baseBranch = baseBranch;
      return Response.json(await createSession(name, context, options));
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
    if (!session.worktree_path)
      return new Response("Session invalid (no worktree)", { status: 400 });

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
};
