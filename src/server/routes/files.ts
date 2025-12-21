/**
 * File System Routes
 * Handles file listing, reading, writing, and workspace root management.
 */
import { readdir, stat } from "node:fs/promises";
import { join, resolve, relative } from "node:path";
import { getWorkspaceRoot, setWorkspaceRoot } from "../workspace";
import { isGitRepo, initGitRepo } from "../git/git";

export const fileRoutes = {
  "/api/files": {
    async GET(req: Request) {
      const url = new URL(req.url);
      const queryPath = url.searchParams.get("path") || ".";
      const root = getWorkspaceRoot();
      const fullPath = resolve(root, queryPath);

      // Security check: ensure we don't escape root (optional, but good practice)
      if (!fullPath.startsWith(root)) {
        // For a local tool, we might want to allow it, but let's stick to project root for safety
        // return new Response("Access denied: Cannot browse outside project root", { status: 403 });
      }

      try {
        const entries = await readdir(fullPath, { withFileTypes: true });
        const files = entries.map((e) => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: relative(root, join(fullPath, e.name)),
        }));

        files.sort((a, b) => {
          if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
          return a.isDirectory ? -1 : 1;
        });

        return Response.json({ files, path: queryPath });
      } catch (error) {
        return new Response(String(error), { status: 500 });
      }
    },
  },

  "/api/files/system/list": {
    async POST(req: Request) {
      const { path } = (await req.json()) as { path: string };
      try {
        const entries = await readdir(path, { withFileTypes: true });
        const files = entries.map((e) => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: join(path, e.name),
        }));

        files.sort((a, b) => {
          if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
          return a.isDirectory ? -1 : 1;
        });

        return Response.json({ files, path });
      } catch (error) {
        return new Response(String(error), { status: 500 });
      }
    },
  },

  "/api/files/home": {
    GET() {
      const home = process.env.HOME || "/";
      return Response.json({ path: home });
    },
  },

  "/api/files/root": {
    GET() {
      return Response.json({ path: getWorkspaceRoot() });
    },
    async POST(req: Request) {
      const body = (await req.json()) as { path: string; ensureGit?: boolean };
      const { path, ensureGit } = body;

      try {
        const s = await stat(path);
        if (!s.isDirectory()) return new Response("Not a directory", { status: 400 });

        const newRoot = resolve(path);
        setWorkspaceRoot(newRoot);

        let gitInitialized = false;

        if (ensureGit) {
          const hasGit = await isGitRepo(newRoot);
          if (!hasGit) {
            await initGitRepo(newRoot);
            gitInitialized = true;
          }
        }

        return Response.json({
          path: newRoot,
          gitInitialized,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid path or access denied";
        return new Response(message, { status: 400 });
      }
    },
  },

  "/api/files/content": {
    async GET(req: Request) {
      const url = new URL(req.url);
      const filePath = url.searchParams.get("path");
      if (!filePath) return new Response("Path required", { status: 400 });

      const fullPath = resolve(getWorkspaceRoot(), filePath);
      const file = Bun.file(fullPath);

      if (!(await file.exists())) {
        return new Response("File not found", { status: 404 });
      }
      return new Response(file);
    },
    async POST(req: Request) {
      const { path, content } = (await req.json()) as { path: string; content: string };
      const fullPath = resolve(getWorkspaceRoot(), path);
      await Bun.write(fullPath, content);
      return Response.json({ success: true });
    },
  },
};
