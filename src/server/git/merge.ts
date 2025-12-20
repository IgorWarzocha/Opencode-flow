/**
 * Git Merge Operations - Session branch integration and cleanup.
 * Handles squash-merging session branches into main and cleaning up worktrees.
 */

import * as nodePath from "node:path";

/** Git command execution options - subset of Bun.spawn options we need. */
interface GitExecOptions {
  cwd?: string;
}

/** Result of a merge operation with discriminated union for success/conflict/error states. */
export type MergeResult =
  | { status: "success"; message: string }
  | { status: "conflict"; files: string[] }
  | { status: "error"; reason: string };

/** Options for the merge operation. */
export interface MergeOptions {
  /** Custom commit message (defaults to auto-generated). */
  commitMessage?: string;
  /** Whether to skip the commit step (leaves changes staged). */
  noCommit?: boolean;
}

/**
 * Runs a git command and returns stdout, throwing on non-zero exit.
 */
const runGit = async (
  args: string[],
  options: GitExecOptions = {}
): Promise<string> => {
  const proc = Bun.spawn(["git", ...args], {
    stdout: "pipe",
    stderr: "pipe",
    ...options,
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(stderr.trim() || `git ${args[0]} failed with code ${exitCode}`);
  }

  return stdout.trim();
};

/**
 * Gets the main repository root from a worktree path.
 * Worktrees store a reference to the main repo in their .git file.
 */
const getMainRepoRoot = async (worktreePath: string): Promise<string> => {
  // git rev-parse --git-common-dir gives us the main repo's .git directory
  const gitCommonDir = await runGit(["rev-parse", "--git-common-dir"], {
    cwd: worktreePath,
  });

  // The common dir is the .git folder; we need the parent (repo root)
  const absoluteGitDir = nodePath.isAbsolute(gitCommonDir)
    ? gitCommonDir
    : nodePath.resolve(worktreePath, gitCommonDir);

  return nodePath.dirname(absoluteGitDir);
};

/**
 * Extracts the branch name from a worktree path by reading the HEAD reference.
 */
const getWorktreeBranch = async (worktreePath: string): Promise<string> => {
  const branch = await runGit(["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: worktreePath,
  });
  
  if (branch === "HEAD") {
    throw new Error("Worktree is in detached HEAD state; cannot determine branch");
  }
  
  return branch;
};

/**
 * Checks if there are uncommitted changes in the target directory.
 */
const hasUncommittedChanges = async (repoPath: string): Promise<boolean> => {
  const status = await runGit(["status", "--porcelain"], { cwd: repoPath });
  return status.length > 0;
};

/**
 * Merges the session branch into the target branch using squash merge.
 * This runs from the main repository, not the worktree.
 *
 * @param worktreePath - Absolute path to the session's worktree
 * @param targetBranch - Branch to merge into (typically "main")
 * @param options - Merge configuration options
 * @returns MergeResult indicating success, conflict, or error
 */
export const mergeSessionBranch = async (
  worktreePath: string,
  targetBranch: string,
  options: MergeOptions = {}
): Promise<MergeResult> => {
  const mainRepoRoot = await getMainRepoRoot(worktreePath);
  const sessionBranch = await getWorktreeBranch(worktreePath);

  // Ensure main repo is on the target branch
  const currentBranch = await runGit(["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: mainRepoRoot,
  });

  if (currentBranch !== targetBranch) {
    // Check for uncommitted changes before switching
    if (await hasUncommittedChanges(mainRepoRoot)) {
      return {
        status: "error",
        reason: `Main repo has uncommitted changes; cannot switch to ${targetBranch}`,
      };
    }

    try {
      await runGit(["checkout", targetBranch], { cwd: mainRepoRoot });
    } catch (err) {
      return {
        status: "error",
        reason: `Failed to checkout ${targetBranch}: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // Perform squash merge
  const mergeProc = Bun.spawn(["git", "merge", "--squash", sessionBranch], {
    cwd: mainRepoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  const mergeStdout = await new Response(mergeProc.stdout).text();
  const mergeStderr = await new Response(mergeProc.stderr).text();
  const mergeExitCode = await mergeProc.exited;

  // Check for conflicts (exit code 1 with CONFLICT in output)
  if (mergeExitCode !== 0) {
    if (mergeStdout.includes("CONFLICT") || mergeStderr.includes("CONFLICT")) {
      // Parse conflict files from git status
      const statusOutput = await runGit(["status", "--porcelain"], {
        cwd: mainRepoRoot,
      });

      const conflictFiles = statusOutput
        .split("\n")
        .filter((line) => line.startsWith("UU") || line.startsWith("AA"))
        .map((line) => line.slice(3));

      return { status: "conflict", files: conflictFiles };
    }

    return {
      status: "error",
      reason: mergeStderr.trim() || mergeStdout.trim() || "Merge failed",
    };
  }

  // Skip commit if requested
  if (options.noCommit) {
    return { status: "success", message: "Squash merge staged (no commit)" };
  }

  // Commit the squashed changes
  const commitMessage =
    options.commitMessage ?? `Merge session branch '${sessionBranch}' (squashed)`;

  try {
    await runGit(["commit", "-m", commitMessage], { cwd: mainRepoRoot });
  } catch (err) {
    // Commit might fail if there are no changes (branch already merged)
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("nothing to commit")) {
      return { status: "success", message: "No changes to merge (already up to date)" };
    }
    return { status: "error", reason: `Commit failed: ${errMsg}` };
  }

  return { status: "success", message: `Merged '${sessionBranch}' into '${targetBranch}'` };
};

/**
 * Removes a worktree and its associated branch.
 * Uses --force to remove even if there are uncommitted changes.
 *
 * @param worktreePath - Absolute path to the worktree to remove
 * @param branchName - Name of the branch to delete after removing the worktree
 */
export const removeWorktreeAndBranch = async (
  worktreePath: string,
  branchName: string
): Promise<void> => {
  const mainRepoRoot = await getMainRepoRoot(worktreePath);

  // Force remove the worktree (handles uncommitted changes)
  const removeProc = Bun.spawn(["git", "worktree", "remove", "--force", worktreePath], {
    cwd: mainRepoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  const removeStderr = await new Response(removeProc.stderr).text();
  const removeExitCode = await removeProc.exited;

  // Worktree might already be removed, that's fine
  if (removeExitCode !== 0 && !removeStderr.includes("is not a working tree")) {
    throw new Error(`Failed to remove worktree: ${removeStderr.trim()}`);
  }

  // Delete the branch (force to handle unmerged branches)
  const branchProc = Bun.spawn(["git", "branch", "-D", branchName], {
    cwd: mainRepoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  const branchStderr = await new Response(branchProc.stderr).text();
  const branchExitCode = await branchProc.exited;

  // Branch might already be deleted, that's fine
  if (branchExitCode !== 0 && !branchStderr.includes("not found")) {
    throw new Error(`Failed to delete branch '${branchName}': ${branchStderr.trim()}`);
  }
};
