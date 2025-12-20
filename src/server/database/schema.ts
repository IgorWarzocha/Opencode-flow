/**
 * Database Schema - Table definitions and migrations
 * Defines the structure for visual graph nodes, worktrees, and sessions.
 */
import { Database } from "bun:sqlite";

export const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS nodes (id UUID, type TEXT, content JSON, created_at DATETIME);`,
  `CREATE TABLE IF NOT EXISTS edges (id UUID, source UUID, target UUID, created_at DATETIME);`,
  `CREATE TABLE IF NOT EXISTS worktrees (id UUID, branch TEXT, path TEXT, status TEXT);`,
  `CREATE TABLE IF NOT EXISTS code_embeddings (
    id UUID PRIMARY KEY,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS opencode_sessions (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    worktree_path TEXT,
    branch_name TEXT,
    agent_pid INTEGER,
    context JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  // Virtual table creation requires the extension to be loaded first
  `CREATE VIRTUAL TABLE IF NOT EXISTS code_vectors USING vec0(embedding float[384]);`
];

export const initSchema = (db: Database) => {
  for (const query of MIGRATIONS) {
    db.run(query);
  }
};

