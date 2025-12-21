# Integration Notes for OpenCode Flow

Target Goal

- Launch `opencode serve` per worktree and drive all interactions through its HTTP API.

Directory Scoping

- Always set `x-opencode-directory` or `?directory=` for every request.
- Use absolute paths to avoid ambiguous instance resolution.

Recommended Connection Strategy

- Open one SSE stream to `/event` per active worktree.
- Subscribe to `/global/event` for cross-project lifecycle events (instance disposed, etc).
- For terminals, create a PTY via `POST /pty`, then connect with WebSocket `/pty/:ptyID/connect`.

Minimal API Surface for the MVP

- Project: `GET /project`, `GET /project/current`.
- Session: `POST /session`, `POST /session/:sessionID/message`, `GET /session/:sessionID/message`.
- Events: `GET /event`.
- PTY: `POST /pty`, `GET /pty/:ptyID/connect`.

Safety for Observer Mode

- Avoid `POST /session/:sessionID/shell` and any commands that can edit files.
- Avoid tool execution endpoints unless explicitly requested by the user.

Proxy Note

- The server proxies unknown routes to `https://desktop.opencode.ai`. Your UI should not rely on this.

UI Panel Integration Checklist

- Worktree Picker: `GET /project` for list, `GET /project/current` for current; always pass `x-opencode-directory` when switching.
- Session Timeline: `GET /session`, `GET /session/:sessionID/message`, `GET /session/:sessionID/status` and `/event` for live updates.
- Prompt Composer: `POST /session/:sessionID/message` for synchronous prompts; `POST /session/:sessionID/prompt_async` when you want non-blocking.
- Diff Viewer: `GET /session/:sessionID/diff` for full session diffs; `GET /session/:sessionID/diff?messageID=` for per-message diffs.
- Terminal Panel: `POST /pty` to create, `GET /pty/:ptyID/connect` WebSocket for I/O; `PUT /pty/:ptyID` for resize.
- Provider/Auth UI: `GET /provider`, `GET /provider/auth`, then `POST /provider/:providerID/oauth/authorize` + `/callback` or `PUT /auth/:providerID`.
- Tool Registry Browser: `GET /experimental/tool/ids` and `GET /experimental/tool?provider=&model=`.
- Read-Only Observability: subscribe to `/event` SSE and avoid `/session/:sessionID/shell` and tool invocations.
