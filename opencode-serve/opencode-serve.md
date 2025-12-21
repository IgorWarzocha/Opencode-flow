# opencode-serve

Purpose

- Local HTTP server that exposes OpenCode sessions, tools, and terminal I/O for a specific project directory (worktree).
- Provides REST + SSE + WebSocket APIs that the UI uses to observe and drive agent work.

Architecture

- Server: Bun + Hono, initialized in `opencode/packages/opencode/src/server/server.ts`.
- CLI entry: `opencode/packages/opencode/src/cli/cmd/serve.ts` and `opencode/packages/opencode/src/cli/cmd/web.ts`.
- Per-directory instance context: `opencode/packages/opencode/src/project/instance.ts` with `InstanceBootstrap` in `opencode/packages/opencode/src/project/bootstrap.ts`.

Instance Scoping (critical for worktrees)

- Each request is scoped to a directory using either:
  - Query: `?directory=/abs/path`
  - Header: `x-opencode-directory: /abs/path`
- If neither is provided, the server uses `process.cwd()`.
- The instance cache is keyed by directory; each instance resolves its project and worktree metadata once and reuses it for requests.

Transports

- REST (JSON): standard Hono endpoints for sessions, config, tools, etc.
- SSE:
  - `GET /event` for instance events.
  - `GET /global/event` for global events.
- WebSocket:
  - `GET /pty/:ptyID/connect` for terminal streaming.

Proxy Behavior

- Any unknown path is proxied to `https://desktop.opencode.ai`.
- This is why `GET /` returns a SPA shell even when the server is local.

OpenAPI

- `GET /doc` returns an OpenAPI 3.1.1 schema generated from route metadata.

Versioning and Compatibility

- OpenAPI version: 3.1.1 (`/doc`).
- Server API version: 0.0.3 (`info.version` in `/doc`).
- Treat the API as unstable unless pinned to a specific opencode release.

Live Observations

- Server responds with `Access-Control-Allow-Origin: *` on JSON and SSE endpoints.
- SSE endpoints send a `server.connected` event immediately and then 30s heartbeats.

Primary Entry Points for a UI

- `GET /project` + `GET /project/current` to identify the active project and worktree.
- `GET /event` to receive live session, PTY, and tool events.
- `POST /session` to create a session.
- `POST /session/:sessionID/message` to run a prompt and stream results.
- `GET /pty` + `POST /pty` + `GET /pty/:ptyID/connect` to create and connect a terminal.
