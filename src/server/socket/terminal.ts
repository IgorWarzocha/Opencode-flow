/**
 * Terminal WebSocket Handler
 * Manages interactive terminal sessions via WebSocket.
 */
import type { ServerWebSocket } from "bun";
import { getWorkspaceRoot } from "../workspace";
import type { Subprocess } from "bun";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Data attached to each WebSocket connection.
 */
export interface WebSocketData {
  proc?: Subprocess | undefined;
  sessionId?: string | undefined;
}

export const terminalSocket = {
  open(ws: ServerWebSocket<WebSocketData>) {
    try {
      // Use Bun's native PTY support (v1.3.5+)
      // We cast options to any because types might be outdated in the project
      const proc = Bun.spawn(["bash"], {
        cwd: getWorkspaceRoot(),
        env: { ...process.env, TERM: "xterm-256color" } as Record<string, string>,
        terminal: {
          cols: 80,
          rows: 24,
          data(_terminal: unknown, data: Uint8Array) {
            ws.send(textDecoder.decode(data));
          },
        },
      } as any);

      ws.data.proc = proc;

      if (!(proc as { terminal?: unknown }).terminal) {
        ws.send(
          "\r\n\x1b[33mWarning: Server does not support PTY (Bun < v1.3.5?). Input disabled.\x1b[0m\r\n",
        );
      }
    } catch (e) {
      ws.send(`\r\n\x1b[31mError spawning terminal: ${e}\x1b[0m\r\n`);
    }
  },
  message(ws: ServerWebSocket<WebSocketData>, message: string | Uint8Array) {
    const proc = ws.data.proc as { terminal?: { write: (data: Uint8Array) => void } } | undefined;
    if (!proc?.terminal) {
      return;
    }

    const payload = typeof message === "string" ? textEncoder.encode(message) : message;
    proc.terminal.write(payload);
  },
  close(ws: ServerWebSocket<WebSocketData>) {
    const proc = ws.data.proc as any;
    if (proc) {
      proc.kill();
      if (proc.terminal) {
        try {
          proc.terminal.close();
        } catch {
          // Ignore close errors
        }
      }
    }
  },
};
