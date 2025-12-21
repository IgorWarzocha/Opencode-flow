/**
 * OpenCode Session Sync - Imports external sessions into the local database.
 * Scans OpenCode's storage for sessions matching the current workspace and
 * imports them into the opencode_sessions table.
 */
import { getDB } from "../database/database.ts";
import { findProjectByRoot, getProjectSessions } from "./storage.ts";

/** Shape of an OpenCode session as read from storage. */
type OpenCodeSession = {
  readonly id: string;
  readonly name?: string;
  readonly title?: string;
  readonly time?: {
    readonly created?: number;
    readonly updated?: number;
  };
  readonly [key: string]: unknown;
};

/**
 * Result of a sync operation.
 */
export type SyncResult = {
  readonly projectId: string | null;
  readonly imported: number;
  readonly skipped: number;
};

/**
 * Converts a Unix timestamp (ms or seconds) to an ISO string.
 * Returns the fallback if the timestamp is invalid.
 */
const timestampToISO = (timestamp: number | undefined, fallback: string): string => {
  if (timestamp === undefined) return fallback;

  // Heuristic: timestamps < 1e12 are likely seconds, not milliseconds
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);

  // Validate the date is reasonable (after 2000, before 2100)
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) {
    return fallback;
  }

  return date.toISOString();
};

/**
 * Syncs OpenCode sessions from external storage into the local database.
 * Uses upsert to update existing sessions with corrected names and context.
 *
 * @param rootPath - The workspace root path to find sessions for.
 * @returns Sync result with counts of imported and skipped sessions.
 */
export const syncSessions = async (rootPath: string): Promise<SyncResult> => {
  const projectId = await findProjectByRoot(rootPath);

  if (!projectId) {
    return { projectId: null, imported: 0, skipped: 0 };
  }

  const sessions = await getProjectSessions(projectId);
  const db = getDB();
  const now = new Date().toISOString();

  let imported = 0;
  let skipped = 0;

  const upsertStmt = db.prepare(`
    INSERT INTO opencode_sessions (id, name, status, context, created_at, updated_at)
    VALUES ($id, $name, $status, $context, $created_at, $updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      context = excluded.context,
      updated_at = excluded.updated_at
  `);

  for (const session of sessions) {
    const typedSession = session as OpenCodeSession;

    const name = typedSession.title ?? typedSession.name ?? `Session ${typedSession.id}`;
    const context = JSON.stringify(typedSession);
    const createdAt = timestampToISO(typedSession.time?.created, now);
    const updatedAt = timestampToISO(typedSession.time?.updated, now);

    const result = upsertStmt.run({
      $id: typedSession.id,
      $name: name,
      $status: "active",
      $context: context,
      $created_at: createdAt,
      $updated_at: updatedAt,
    });

    // SQLite changes property tells us if a row was inserted or updated
    if (result.changes > 0) {
      imported++;
    } else {
      skipped++;
    }
  }

  return { projectId, imported, skipped };
};
