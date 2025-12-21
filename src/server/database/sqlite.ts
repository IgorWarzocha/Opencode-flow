/**
 * SQLite Database Manager - Workspace-aware database connections.
 * Provides a singleton pattern for managing per-workspace SQLite databases
 * located at <WORKSPACE_ROOT>/.opencode-flow/flow.sqlite.
 */
import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import * as sqliteVec from "sqlite-vec";
import { initSchema } from "./schema.ts";

/** Internal state for the database manager. */
let currentDB: Database | null = null;
let currentWorkspacePath: string | null = null;

/** The subdirectory name for opencode-flow data within a workspace. */
const DATA_DIR = ".opencode-flow";

/** The SQLite database filename. */
const DB_FILENAME = "flow.sqlite";

/**
 * Returns the current database instance.
 * Throws if no database has been initialized via switchWorkspaceDB().
 */
export const getDB = (): Database => {
  if (!currentDB) {
    throw new Error("Database not initialized. Call switchWorkspaceDB(rootPath) first.");
  }
  return currentDB;
};

/**
 * Returns the current workspace path, or null if not initialized.
 */
export const getCurrentWorkspacePath = (): string | null => currentWorkspacePath;

/**
 * Switches the database connection to a new workspace.
 * Closes any existing connection, creates the .opencode-flow directory if needed,
 * opens the new database, loads extensions, and initializes the schema.
 *
 * @param rootPath - The workspace root directory path.
 */
export const switchWorkspaceDB = async (rootPath: string): Promise<void> => {
  // Close existing connection if any
  if (currentDB) {
    currentDB.close();
    currentDB = null;
    currentWorkspacePath = null;
  }

  // Ensure the .opencode-flow directory exists
  const dataDir = join(rootPath, DATA_DIR);
  await mkdir(dataDir, { recursive: true });

  // Open new database
  const dbPath = join(dataDir, DB_FILENAME);
  const db = new Database(dbPath, { create: true });

  // Load sqlite-vec extension
  try {
    sqliteVec.load(db);
  } catch {
    // Vector support is optional; continue without it if it fails
    // The schema will still create tables, but vector queries may fail
  }

  // Initialize schema
  initSchema(db);

  // Update state
  currentDB = db;
  currentWorkspacePath = rootPath;
};

/**
 * Initializes the database for the given workspace.
 * This is a convenience alias for switchWorkspaceDB for startup use.
 *
 * @param rootPath - The workspace root directory path.
 */
export const initDB = async (rootPath: string): Promise<void> => {
  await switchWorkspaceDB(rootPath);
};
