/**
 * Git Routes - Worktree management and standard git workflow operations.
 * Exposes endpoints for status, staging, committing, syncing, and branch management.
 */
import {
  listWorktrees,
  createWorktree,
  gitStatus,
  gitCurrentBranch,
  gitAdd,
  gitCommit,
  gitPush,
  gitPull,
  gitBranches,
  gitCheckout,
} from "../git/git";

/** Request body for staging files */
type StageRequest = {
  files: string[];
};

/** Request body for committing */
type CommitRequest = {
  message: string;
};

/** Request body for sync operations */
type SyncRequest = {
  action: "push" | "pull";
};

/** Request body for checkout */
type CheckoutRequest = {
  branch: string;
  create?: boolean;
};

export const gitRoutes = {
  "/api/worktrees": {
    async GET() {
      try {
        const worktrees = await listWorktrees();
        return Response.json(worktrees);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
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
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
      }
    },
  },

  "/api/git/status": {
    async GET() {
      try {
        const [files, currentBranch] = await Promise.all([gitStatus(), gitCurrentBranch()]);

        return Response.json({
          files,
          branch: currentBranch,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
      }
    },
  },

  "/api/git/stage": {
    async POST(req: Request) {
      try {
        const { files } = (await req.json()) as StageRequest;

        if (!Array.isArray(files)) {
          return Response.json({ error: "files must be an array" }, { status: 400 });
        }

        await gitAdd(files);
        return Response.json({ success: true, staged: files });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
      }
    },
  },

  "/api/git/commit": {
    async POST(req: Request) {
      try {
        const { message } = (await req.json()) as CommitRequest;

        if (!message || typeof message !== "string") {
          return Response.json({ error: "message is required" }, { status: 400 });
        }

        await gitCommit(message);
        return Response.json({ success: true, message });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
      }
    },
  },

  "/api/git/sync": {
    async POST(req: Request) {
      try {
        const { action } = (await req.json()) as SyncRequest;

        if (action !== "push" && action !== "pull") {
          return Response.json({ error: "action must be 'push' or 'pull'" }, { status: 400 });
        }

        if (action === "push") {
          await gitPush();
        } else {
          await gitPull();
        }

        return Response.json({ success: true, action });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
      }
    },
  },

  "/api/git/branches": {
    async GET() {
      try {
        const branches = await gitBranches();
        return Response.json({ branches });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
      }
    },
  },

  "/api/git/checkout": {
    async POST(req: Request) {
      try {
        const { branch, create } = (await req.json()) as CheckoutRequest;

        if (!branch || typeof branch !== "string") {
          return Response.json({ error: "branch is required" }, { status: 400 });
        }

        await gitCheckout(branch, create);
        return Response.json({ success: true, branch, created: create ?? false });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json({ error: message }, { status: 500 });
      }
    },
  },
};
