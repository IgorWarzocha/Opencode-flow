/**
 * Agent Spawner - Spawns Opencode CLI processes inside isolated worktrees.
 * Manages subprocess lifecycle with proper environment variable injection.
 */
import type { Subprocess } from "bun";

/**
 * Subprocess type with piped stdin/stdout/stderr for terminal integration.
 */
export type AgentProcess = Subprocess<"pipe", "pipe", "pipe">;

/**
 * Configuration options for spawning an agent process.
 */
interface SpawnOptions {
  /**
   * Additional environment variables to inject into the process.
   */
  extraEnv?: Record<string, string>;
}

/**
 * Constructs a sanitized environment object from process.env.
 * Filters out undefined values to satisfy strict typing.
 */
const buildBaseEnv = (): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const key in process.env) {
    const value = process.env[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

/**
 * Spawns an agent process inside the specified worktree directory.
 *
 * Currently uses `bash` as a placeholder. When the `opencode` CLI is ready,
 * this will spawn `opencode` with appropriate flags for headless operation.
 *
 * @param worktreePath - Absolute path to the git worktree for this session
 * @param sessionId - Unique session identifier for tracking
 * @param options - Optional spawn configuration
 * @returns A Bun Subprocess with piped stdin/stdout/stderr
 */
export const spawnAgentProcess = (
  worktreePath: string,
  sessionId: string,
  options: SpawnOptions = {}
): AgentProcess => {
  const baseEnv = buildBaseEnv();

  const agentEnv: Record<string, string> = {
    ...baseEnv,
    TERM: "xterm-256color",
    OPENCODE_SESSION_ID: sessionId,
    OPENCODE_WORKTREE: worktreePath,
    ...options.extraEnv,
  };

  // TODO: Replace with actual opencode CLI when available
  // const command = ["opencode", "--headless", "--session", sessionId];
  const command = ["bash"];

  return Bun.spawn(command, {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    cwd: worktreePath,
    env: agentEnv,
  });
};
