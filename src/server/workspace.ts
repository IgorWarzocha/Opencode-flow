/**
 * Workspace State Management
 * Stores the current active directory for the application.
 * This is the source of truth for all file system operations.
 */
import { cwd } from "node:process";

// Default to the process current working directory
let currentRoot = cwd();

/**
 * Returns the current workspace root path.
 */
export const getWorkspaceRoot = () => currentRoot;

/**
 * Sets the new workspace root path.
 * Note: Does not perform validation. Validation should happen before calling this.
 */
export const setWorkspaceRoot = (path: string) => {
  currentRoot = path;
};
