/**
 * OpenCode API Routes
 * Provides endpoints for accessing OpenCode session data.
 */
import { getWorkspaceRoot } from "../workspace";
import { findProjectByRoot, getProjectSessions } from "../opencode/storage";

/** Response shape for sessions endpoint. */
type SessionsResponse = {
  readonly found: boolean;
  readonly projectId: string | null;
  readonly sessions: ReadonlyArray<Record<string, unknown>>;
};

export const opencodeRoutes = {
  "/api/opencode/sessions": {
    async GET(): Promise<Response> {
      const workspaceRoot = getWorkspaceRoot();
      const projectId = await findProjectByRoot(workspaceRoot);

      if (!projectId) {
        const response: SessionsResponse = {
          found: false,
          projectId: null,
          sessions: [],
        };
        return Response.json(response);
      }

      const sessions = await getProjectSessions(projectId);
      const response: SessionsResponse = {
        found: true,
        projectId,
        sessions,
      };

      return Response.json(response);
    },
  },
};
