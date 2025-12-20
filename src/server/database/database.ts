/**
 * Database Module - SQLite & Vector Storage
 * This file exists to enforce proper modular architecture as per AGENTS.md.
 * Logic is isolated within specialized modules; exports are handled via this named barrel.
 */
export * from "./sqlite.ts";
export * from "./schema.ts";
