# opencode-serve Events and Streaming

Sources

- `opencode/packages/opencode/src/server/server.ts`
- `opencode/packages/opencode/src/bus` (event types)
- `opencode/packages/opencode/src/pty/index.ts`

Instance SSE: `GET /event`

- Content-Type: `text/event-stream`.
- First event payload:
  - `{"type":"server.connected","properties":{}}`
- Heartbeat every 30 seconds:
  - `{"type":"server.heartbeat","properties":{}}`
- When the instance is disposed, the server closes the stream.

Global SSE: `GET /global/event`

- Content-Type: `text/event-stream`.
- First event payload:
  - `{"payload":{"type":"server.connected","properties":{}}}`
- Heartbeat every 30 seconds:
  - `{"payload":{"type":"server.heartbeat","properties":{}}}`
- Global events include a `directory` and a `payload` object.

PTY WebSocket: `GET /pty/:ptyID/connect`

- Upgrades to WebSocket.
- Server -> client: raw terminal output bytes as text.
- Client -> server: raw keystrokes or control sequences as text.
- A PTY session buffers output until a subscriber connects; upon connect, the buffer is flushed.

TUI Control Queue

- `GET /tui/control/next` is a blocking long-poll that waits for a request pushed by `callTui()`.
- `POST /tui/control/response` resolves the next waiting response.

Notes for UI integration

- Use a dedicated SSE connection per active directory, and reconnect on disconnect.
- PTY WebSocket is the only supported interactive terminal transport.
