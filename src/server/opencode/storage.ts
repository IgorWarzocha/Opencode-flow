/**
 * OpenCode Storage Access
 * Reads project and session data from the external OpenCode application's storage.
 * Storage is located at ~/.local/share/opencode/storage on Linux.
 */
import { homedir } from "node:os";
import { join, normalize, resolve } from "node:path";
import { readdir } from "node:fs/promises";

/** Represents a project entry from OpenCode's storage. */
type OpenCodeProject = {
  readonly id: string;
  readonly worktree: string;
  readonly [key: string]: unknown;
};

/** Represents a session entry from OpenCode's storage. */
type OpenCodeSession = {
  readonly id: string;
  readonly [key: string]: unknown;
};

/**
 * Resolves the OpenCode storage base path.
 * Currently supports Linux: ~/.local/share/opencode/storage
 */
export const getOpenCodeStoragePath = (): string => {
  const home = homedir();
  return join(home, ".local", "share", "opencode", "storage");
};

/**
 * Normalizes a path for comparison by resolving to absolute and removing trailing slashes.
 */
const normalizePath = (path: string): string => {
  const resolved = resolve(normalize(path));
  return resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
};

/**
 * Type guard to validate an OpenCodeProject shape.
 */
const isOpenCodeProject = (value: unknown): value is OpenCodeProject => {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.id === "string" && typeof obj.worktree === "string";
};

/**
 * Type guard to validate an OpenCodeSession shape.
 */
const isOpenCodeSession = (value: unknown): value is OpenCodeSession => {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.id === "string";
};

/**
 * Finds an OpenCode project by its worktree root path.
 * Scans project/*.json files and returns the matching project ID or null.
 */
export const findProjectByRoot = async (rootPath: string): Promise<string | null> => {
  const storagePath = getOpenCodeStoragePath();
  const projectDir = join(storagePath, "project");
  const normalizedRoot = normalizePath(rootPath);

  let entries: string[];
  try {
    entries = await readdir(projectDir);
  } catch {
    // Directory doesn't exist or is inaccessible
    return null;
  }

  const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));

  for (const filename of jsonFiles) {
    const filePath = join(projectDir, filename);
    const file = Bun.file(filePath);

    try {
      const content: unknown = await file.json();
      if (!isOpenCodeProject(content)) continue;

      const normalizedWorktree = normalizePath(content.worktree);
      if (normalizedWorktree === normalizedRoot) {
        return content.id;
      }
    } catch {
      // Skip files that can't be parsed
      continue;
    }
  }

  return null;
};

/**
 * Gets all sessions for a given OpenCode project ID.
 * Scans session/<projectId>/*.json and returns parsed session objects.
 */
export const getProjectSessions = async (
  projectId: string,
): Promise<ReadonlyArray<OpenCodeSession>> => {
  const storagePath = getOpenCodeStoragePath();
  const sessionDir = join(storagePath, "session", projectId);

  let entries: string[];
  try {
    entries = await readdir(sessionDir);
  } catch {
    // Directory doesn't exist or is inaccessible
    return [];
  }

  const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));
  const sessions: OpenCodeSession[] = [];

  for (const filename of jsonFiles) {
    const filePath = join(sessionDir, filename);
    const file = Bun.file(filePath);

    try {
      const content: unknown = await file.json();
      if (isOpenCodeSession(content)) {
        sessions.push(content);
      }
    } catch {
      // Skip files that can't be parsed
      continue;
    }
  }

  return sessions;
};
