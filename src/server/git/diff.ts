import { spawn } from "bun";

/**
 * Generates a diff between the current HEAD of the worktree and the base branch (default: main).
 * 
 * @param worktreePath The absolute path to the git worktree
 * @param baseBranch The branch to compare against (default: "main")
 * @returns The raw diff output string
 */
export const getWorktreeDiff = async (
  worktreePath: string,
  baseBranch: string = "main"
): Promise<string> => {
  try {
    // Run git diff relative to the worktree path
    const proc = spawn(["git", "diff", `${baseBranch}...HEAD`], {
      cwd: worktreePath,
      stdout: "pipe",
      stderr: "pipe",
    });

    const text = await new Response(proc.stdout).text();
    const error = await new Response(proc.stderr).text();

    if (proc.exitCode !== 0 && proc.exitCode !== null) {
        // If exit code is non-zero, it might be that the base branch doesn't exist or other git error
        // However, git diff exit code 1 means differences found (sometimes) or error? 
        // Actually git diff exits 0 even if diffs found. 1 usually means error.
        // Let's check if text is empty and error is not.
        if (error) {
             console.warn("Git diff stderr:", error);
             // If the base branch is missing in the worktree context, we might need to fetch or just compare to what we have
             // For now, throw to see what happens
             throw new Error(`Git diff failed: ${error}`);
        }
    }

    return text;
  } catch (err) {
    console.error("Error generating diff:", err);
    throw err;
  }
};
