/**
 * Session Management - CRUD & State Persistence
 * Handles the lifecycle of agent sessions in the opencode_sessions table.
 */
import * as nodePath from "node:path";
import { existsSync } from "node:fs";
import { getDB } from "../database/database.ts";
import { createWorktree, removeWorktreeAndBranch } from "../git/git.ts";

/** Valid session status values. */
export type SessionStatus = "active" | "archived" | "merged" | "failed";

/**
 * Raw database row shape - context is stored as a JSON string.
 */
interface SessionRow {
  id: string;
  name: string;
  status: SessionStatus;
  worktree_path: string | null;
  branch_name: string | null;
  agent_pid: number | null;
  context: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  worktree_path?: string | null;
  branch_name?: string | null;
  agent_pid?: number | null;
  context?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Safely parses a JSON string into an object, returning an empty object on failure.
 */
const parseContext = (raw: string | null): Record<string, unknown> => {
  if (raw === null) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
};

/**
 * Creates a new session with the given name and initial context.
 */
export const createSession = async (
  name: string,
  context: Record<string, unknown> = {},
  options: { branchName?: string; baseBranch?: string; id?: string } = {},
): Promise<Session> => {
  const id = options.id ?? crypto.randomUUID();
  let status: SessionStatus = "active";
  const now = new Date().toISOString();

  const branchName = options.branchName ?? `session-${id}`;
  // Use absolute path for worktree
  const worktreePath = nodePath.resolve(process.cwd(), ".opencode-flow/worktrees", id);
  // Ensure parent directory exists
  const { mkdirSync } = await import("node:fs");
  mkdirSync(nodePath.dirname(worktreePath), { recursive: true });

  try {
    await createWorktree(branchName, worktreePath, {
      createBranch: true,
      baseBranch: options.baseBranch ?? "main",
    });
  } catch (error) {
    console.error(`Failed to create worktree for session ${id}:`, error);
    status = "failed";
  }

  const query = getDB().query(`
    INSERT INTO opencode_sessions (id, name, status, worktree_path, branch_name, context, created_at, updated_at)
    VALUES ($id, $name, $status, $worktreePath, $branchName, $context, $created_at, $updated_at)
    RETURNING *;
  `);

  const result = query.get({
    $id: id,
    $name: name,
    $status: status,
    $worktreePath: worktreePath,
    $branchName: branchName,
    $context: JSON.stringify(context),
    $created_at: now,
    $updated_at: now,
  }) as SessionRow | null;

  if (!result) {
    throw new Error(`Failed to create session: no result returned`);
  }

  return {
    ...result,
    context: parseContext(result.context),
  };
};

/**
 * Lists all sessions ordered by most recently updated.
 */
export const listSessions = (): Session[] => {
  const query = getDB().query(`
    SELECT * FROM opencode_sessions
    ORDER BY updated_at DESC;
  `);

  const results = query.all() as SessionRow[];

  return results.map((row) => ({
    ...row,
    context: parseContext(row.context),
  }));
};

/**
 * Retrieves a specific session by ID.
 */
export const getSession = (id: string): Session | null => {
  const query = getDB().query(`
    SELECT * FROM opencode_sessions
    WHERE id = $id;
  `);

  const result = query.get({ $id: id }) as SessionRow | null;

  if (!result) {
    return null;
  }

  return {
    ...result,
    context: parseContext(result.context),
  };
};

/**
 * Deletes a session by ID.
 */
export const deleteSession = (id: string): void => {
  const query = getDB().query(`
    DELETE FROM opencode_sessions
    WHERE id = $id;
  `);

  query.run({ $id: id });
};

/**
 * Archives a session, cleaning up its git worktree and branch.
 *
 * @param id - Session ID to archive
 * @param status - Final status ("merged" if changes were integrated, "archived" otherwise)
 */
export const archiveSession = async (id: string, status: "merged" | "archived"): Promise<void> => {
  const session = getSession(id);
  if (!session) {
    throw new Error(`Session ${id} not found`);
  }

  if (session.status !== "active") {
    // Already archived or failed
    return;
  }

  if (session.worktree_path && session.branch_name) {
    const worktreeExists = existsSync(session.worktree_path);
    if (worktreeExists) {
      try {
        await removeWorktreeAndBranch(session.worktree_path, session.branch_name);
      } catch (e) {
        console.error(`Failed to cleanup git resources for session ${id}:`, e);
        // Continue to archive DB record anyway
      }
    }
  }

  const query = getDB().query(`
    UPDATE opencode_sessions 
    SET status = $status, worktree_path = NULL, branch_name = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = $id
  `);

  query.run({ $id: id, $status: status });
};
