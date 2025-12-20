/**
 * SQLite Implementation - bun:sqlite integration
 * Primary data persistence layer for nodes, edges, and session state.
 */
import { Database } from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import { initSchema } from "./schema";

export const db = new Database("flow.sqlite", { create: true });

export const initDB = () => {
  try {
    sqliteVec.load(db);
    console.info("sqlite-vec loaded successfully.");
  } catch (error) {
    console.warn("Failed to load sqlite-vec extension:", error);
    // Continue without vector support if it fails, or throw? 
    // Given it's a core feature, maybe we should log but proceed with non-vector tables?
    // The user requested robustness.
  }

  try {
    initSchema(db);
    console.info("Database schema initialized.");
  } catch (error) {
    console.warn("Failed to initialize database schema:", error);
    throw error;
  }
};