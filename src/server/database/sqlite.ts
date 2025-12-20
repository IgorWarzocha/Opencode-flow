/**
 * SQLite Implementation - bun:sqlite integration
 * Primary data persistence layer for nodes, edges, and session state.
 */
import { Database } from "bun:sqlite";

export const db = new Database("flow.sqlite", { create: true });
