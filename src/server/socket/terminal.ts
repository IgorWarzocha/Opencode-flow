/**
 * Terminal WebSocket Handler
 * Manages interactive terminal sessions via WebSocket.
 */
import type { ServerWebSocket } from "bun";
import { getWorkspaceRoot } from "../workspace";
import { spawnAgentProcess, type AgentProcess } from "../agent/spawner";

/**
 * Data attached to each WebSocket connection.
 */
export interface WebSocketData {
  proc?: AgentProcess | undefined;
  sessionId?: string | undefined;
  worktreePath?: string | undefined;
}

async function pipeStreamToSocket(
  stream: ReadableStream<Uint8Array>,
  socket: ServerWebSocket<WebSocketData>,
): Promise<void> {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      socket.send(value);
    }
  } finally {
    reader.releaseLock();
  }
}

export const terminalSocket = {
  open(ws: ServerWebSocket<WebSocketData>) {
    const { sessionId, worktreePath } = ws.data;

    // Use spawnAgentProcess for session-bound terminals, fallback to plain bash
    const proc =
      sessionId && worktreePath
        ? spawnAgentProcess(worktreePath, sessionId)
        : Bun.spawn(["bash"], {
            stdin: "pipe",
            stdout: "pipe",
            stderr: "pipe",
            cwd: getWorkspaceRoot(),
            env: { ...process.env, TERM: "xterm-256color" } as Record<string, string>,
          });

    ws.data.proc = proc;

    // Fire-and-forget stream piping with proper error handling
    if (proc.stdout) {
      void pipeStreamToSocket(proc.stdout, ws).catch(() => {
        /* stream closed, ignore */
      });
    }
    if (proc.stderr) {
      void pipeStreamToSocket(proc.stderr, ws).catch(() => {
        /* stream closed, ignore */
      });
    }
  },
  message(ws: ServerWebSocket<WebSocketData>, message: string | Uint8Array) {
    const proc = ws.data.proc;
    if (proc?.stdin) {
      proc.stdin.write(message);
      void proc.stdin.flush();
    }
  },
  close(ws: ServerWebSocket<WebSocketData>) {
    const proc = ws.data.proc;
    if (proc) {
      proc.kill();
    }
  },
};
