/**
 * Git Worktrees - Isolated development environments
 * Manages the creation and lifecycle of git worktrees for agent execution.
 */

import { getWorkspaceRoot } from "../workspace.ts";

export interface Worktree {
  path: string;
  head: string;
  branch?: string;
  detached: boolean;
}

export const listWorktrees = async (): Promise<Worktree[]> => {
  const proc = Bun.spawn(["git", "worktree", "list", "--porcelain"], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: getWorkspaceRoot(),
  });

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`Failed to list worktrees: ${error.trim()}`);
  }

  const worktrees: Worktree[] = [];
  let current: Partial<Worktree> | null = null;

  for (const line of output.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current) {
        worktrees.push(current as Worktree);
      }
      current = { path: line.substring(9).trim(), detached: false };
    } else if (line.startsWith("HEAD ")) {
      if (current) current.head = line.substring(5).trim();
    } else if (line.startsWith("branch ")) {
      if (current) current.branch = line.substring(7).replace("refs/heads/", "").trim();
    } else if (line === "detached") {
      if (current) current.detached = true;
    }
  }
  if (current) {
    worktrees.push(current as Worktree);
  }

  return worktrees;
};

export const createWorktree = async (
  branch: string,
  path: string,
  options: { createBranch?: boolean; baseBranch?: string } = {},
) => {
  const args = ["git", "worktree", "add"];

  if (options.createBranch) {
    args.push("-b", branch, path);
    if (options.baseBranch) {
      args.push(options.baseBranch);
    }
  } else {
    args.push(path, branch);
  }

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
    cwd: getWorkspaceRoot(),
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(
      `Failed to create worktree at '${path}' for branch '${branch}': ${error.trim()}`,
    );
  }
};

export const removeWorktree = async (path: string) => {
  const proc = Bun.spawn(["git", "worktree", "remove", path], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: getWorkspaceRoot(),
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`Failed to remove worktree at '${path}': ${error.trim()}`);
  }
};
