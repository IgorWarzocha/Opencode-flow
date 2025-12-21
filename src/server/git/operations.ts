/**
 * Git Operations - Core repository detection, initialization, and workflow commands.
 * Provides primitives for checking, creating, and managing git repositories.
 */

import { join } from "node:path";
import { getWorkspaceRoot } from "../workspace.ts";

/** Represents a file change from git status */
export type GitFileStatus = {
  path: string;
  status: string;
};

/** Represents a git branch */
export type GitBranch = {
  name: string;
  current: boolean;
};

/**
 * Checks if the given path is inside a git repository.
 * Verifies the existence of a .git directory at the specified path.
 */
export const isGitRepo = async (path: string): Promise<boolean> => {
  const gitDir = join(path, ".git");
  const file = Bun.file(gitDir);

  // .git can be a directory or a file (for worktrees)
  // Bun.file().exists() works for both
  return file.exists();
};

/**
 * Initializes a new git repository at the specified path.
 * Runs `git init` and throws on failure.
 */
export const initGitRepo = async (path: string): Promise<void> => {
  const result = await Bun.$`git init`.cwd(path).quiet();

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`Failed to initialize git repository: ${stderr}`);
  }
};

/**
 * Gets the current branch name.
 * Returns null if in detached HEAD state.
 */
export const gitCurrentBranch = async (): Promise<string | null> => {
  const cwd = getWorkspaceRoot();
  const result = await Bun.$`git rev-parse --abbrev-ref HEAD`.cwd(cwd).quiet().nothrow();

  if (result.exitCode !== 0) {
    return null;
  }

  const branch = result.stdout.toString().trim();
  return branch === "HEAD" ? null : branch;
};

/**
 * Runs `git status --porcelain` and returns parsed list of changed files.
 * Each entry contains the file path and its two-character status code.
 */
export const gitStatus = async (): Promise<GitFileStatus[]> => {
  const cwd = getWorkspaceRoot();
  const result = await Bun.$`git status --porcelain`.cwd(cwd).quiet().nothrow();

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`Failed to get git status: ${stderr}`);
  }

  const output = result.stdout.toString();
  const files: GitFileStatus[] = [];

  for (const line of output.split("\n")) {
    if (line.length < 3) continue;

    const status = line.substring(0, 2);
    const path = line.substring(3);

    files.push({ path, status });
  }

  return files;
};

/**
 * Stages files for commit using `git add`.
 * Pass an empty array or ["."] to stage all changes.
 */
export const gitAdd = async (files: string[]): Promise<void> => {
  const cwd = getWorkspaceRoot();
  const targets = files.length === 0 ? ["."] : files;

  const result = await Bun.$`git add ${targets}`.cwd(cwd).quiet().nothrow();

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`Failed to stage files: ${stderr}`);
  }
};

/**
 * Creates a commit with the given message.
 * Throws if there are no staged changes or commit fails.
 */
export const gitCommit = async (message: string): Promise<void> => {
  const cwd = getWorkspaceRoot();
  const result = await Bun.$`git commit -m ${message}`.cwd(cwd).quiet().nothrow();

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`Failed to commit: ${stderr}`);
  }
};

/**
 * Pushes commits to the remote repository.
 * Uses the current branch's upstream if configured.
 */
export const gitPush = async (): Promise<void> => {
  const cwd = getWorkspaceRoot();
  const result = await Bun.$`git push`.cwd(cwd).quiet().nothrow();

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`Failed to push: ${stderr}`);
  }
};

/**
 * Pulls changes from the remote repository.
 * Uses the current branch's upstream if configured.
 */
export const gitPull = async (): Promise<void> => {
  const cwd = getWorkspaceRoot();
  const result = await Bun.$`git pull`.cwd(cwd).quiet().nothrow();

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`Failed to pull: ${stderr}`);
  }
};

/**
 * Switches to a branch, optionally creating it.
 * When create is true, uses `git checkout -b`.
 */
export const gitCheckout = async (branch: string, create?: boolean): Promise<void> => {
  const cwd = getWorkspaceRoot();

  const result = create
    ? await Bun.$`git checkout -b ${branch}`.cwd(cwd).quiet().nothrow()
    : await Bun.$`git checkout ${branch}`.cwd(cwd).quiet().nothrow();

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    const action = create ? "create and switch to" : "switch to";
    throw new Error(`Failed to ${action} branch '${branch}': ${stderr}`);
  }
};

/**
 * Lists all local branches.
 * Returns an array with branch names and whether each is the current branch.
 */
export const gitBranches = async (): Promise<GitBranch[]> => {
  const cwd = getWorkspaceRoot();
  const result = await Bun.$`git branch --list`.cwd(cwd).quiet().nothrow();

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`Failed to list branches: ${stderr}`);
  }

  const output = result.stdout.toString();
  const branches: GitBranch[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const current = trimmed.startsWith("* ");
    const name = current ? trimmed.substring(2) : trimmed;

    branches.push({ name, current });
  }

  return branches;
};
