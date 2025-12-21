# opencode-serve API Endpoints

All endpoints below are defined in `opencode/packages/opencode/src/server/server.ts` and `opencode/packages/opencode/src/server/project.ts`.

Conventions

- Base URL: `http://127.0.0.1:<port>`
- Scope to a project directory via `?directory=` or `x-opencode-directory` header.
- JSON responses use `application/json` unless stated otherwise.

Error Shapes (from `/doc`)

BadRequestError (400)

```json
{
  "data": {},
  "errors": [{ "field": "error details" }],
  "success": false
}
```

NotFoundError (404)

```json
{
  "name": "NotFoundError",
  "data": {
    "message": "Not found"
  }
}
```

Other error variants used by message responses

- `UnknownError`
- `APIError`
- `MessageOutputLengthError`
- `MessageAbortedError`

Docs

- `GET /doc` -> OpenAPI 3.1.1 schema for all routes.

Global

- `GET /global/event` -> SSE stream of global events.
- `POST /global/dispose` -> Dispose all instances (returns `true`).

Instance

- `POST /instance/dispose` -> Dispose the current instance (returns `true`).
- `GET /path` -> `{ home, state, config, worktree, directory }`.
- `GET /vcs` -> `{ branch }` for the current project.

Project

- `GET /project` -> List of known projects.
- `GET /project/current` -> Current project info.
- `PATCH /project/:projectID` -> Update project name/icon.

PTY (Terminal)

- `GET /pty` -> List active PTY sessions.
- `POST /pty` -> Create a PTY session.
- `GET /pty/:ptyID` -> PTY info.
- `PUT /pty/:ptyID` -> Update title or resize.
- `DELETE /pty/:ptyID` -> Remove and terminate a PTY.
- `GET /pty/:ptyID/connect` -> WebSocket upgrade to stream PTY I/O.

Config

- `GET /config` -> Current configuration object.
- `PATCH /config` -> Update configuration.
- `GET /config/providers` -> Providers + defaults derived from config.

Providers & Auth

- `GET /provider` -> Provider list (all + connected) and defaults.
- `GET /provider/auth` -> Supported auth methods for providers.
- `PUT /auth/:providerID` -> Set credentials.
- `POST /provider/:providerID/oauth/authorize` -> OAuth authorization URL.
- `POST /provider/:providerID/oauth/callback` -> OAuth callback handler.

Tools

- `GET /experimental/tool/ids` -> List tool IDs.
- `GET /experimental/tool?provider=<id>&model=<id>` -> Tool schemas for provider+model.

Sessions (core)

- `GET /session` -> List sessions.
- `GET /session/status` -> Status map for sessions.
- `POST /session` -> Create session.
- `GET /session/:sessionID` -> Session info.
- `PATCH /session/:sessionID` -> Update title or archive flag.
- `DELETE /session/:sessionID` -> Delete session.
- `POST /session/:sessionID/init` -> Analyze app and initialize (creates AGENTS.md).
- `POST /session/:sessionID/fork` -> Fork session.
- `POST /session/:sessionID/abort` -> Abort active processing.
- `POST /session/:sessionID/share` -> Share session.
- `DELETE /session/:sessionID/share` -> Unshare session.
- `POST /session/:sessionID/summarize` -> Trigger compaction.
- `GET /session/:sessionID/todo` -> Session todo items.
- `GET /session/:sessionID/message` -> Session messages (optionally `?limit=`).
- `GET /session/:sessionID/message/:messageID` -> Single message.
- `POST /session/:sessionID/message` -> Send prompt (streams JSON response body).
- `POST /session/:sessionID/prompt_async` -> Send prompt async (204).
- `POST /session/:sessionID/command` -> Run a named command.
- `POST /session/:sessionID/shell` -> Run a shell command.
- `POST /session/:sessionID/revert` -> Revert message changes.
- `POST /session/:sessionID/unrevert` -> Restore reverted messages.
- `GET /session/:sessionID/diff` -> Session diffs (all files).
- `GET /session/:sessionID/diff?messageID=` -> Diffs for a specific message.
- `PATCH /session/:sessionID/message/:messageID/part/:partID` -> Update a message part.
- `DELETE /session/:sessionID/message/:messageID/part/:partID` -> Delete a message part.

Search & Files

- `GET /find?pattern=` -> Ripgrep search results (limited to 10).
- `GET /find/file?query=&dirs=true|false` -> File name search.
- `GET /find/symbol?query=` -> LSP symbol search (currently returns `[]`).
- `GET /file?path=` -> List files at a path.
- `GET /file/content?path=` -> Read file contents.
- `GET /file/status` -> Git status for files.

Commands & Agents

- `GET /command` -> List available commands.
- `GET /agent` -> List available agents.

Diagnostics

- `GET /lsp` -> LSP server status.
- `GET /formatter` -> Formatter status.
- `POST /log` -> Write a log entry.

MCP

- `GET /mcp` -> MCP status map.
- `POST /mcp` -> Add MCP server.
- `POST /mcp/:name/auth` -> Start OAuth for MCP server.
- `POST /mcp/:name/auth/callback` -> OAuth callback for MCP.
- `POST /mcp/:name/auth/authenticate` -> Full OAuth flow (opens browser).
- `DELETE /mcp/:name/auth` -> Remove MCP auth.
- `POST /mcp/:name/connect` -> Connect MCP server.
- `POST /mcp/:name/disconnect` -> Disconnect MCP server.

TUI Control

- `GET /tui/control/next` -> Long-poll for next TUI request.
- `POST /tui/control/response` -> Respond to TUI request.
- `POST /tui/publish` -> Publish TUI events.
- `POST /tui/append-prompt` -> Append prompt.
- `POST /tui/submit-prompt` -> Submit prompt.
- `POST /tui/clear-prompt` -> Clear prompt.
- `POST /tui/open-help` -> Open help dialog (TODO in server).
- `POST /tui/open-sessions` -> Open sessions dialog.
- `POST /tui/open-themes` -> Open themes dialog.
- `POST /tui/open-models` -> Open models dialog.
- `POST /tui/execute-command` -> Execute command (agent_cycle, session_new, etc).
- `POST /tui/show-toast` -> Show toast.

Examples (live server at 127.0.0.1:45623)

- `GET /project` (sample)

```json
{
  "project_count": 20,
  "project_sample": {
    "id": "05ebcf6c0e55eac524fbcd411afff169b136b2fa",
    "worktree": "/home/igorw/Work/hyprwhspr",
    "vcsDir": "/home/igorw/Work/hyprwhspr/.git",
    "vcs": "git",
    "time": {
      "created": 1765217626755,
      "initialized": 1765217760068
    }
  }
}
```

- `GET /project/current`

```json
{
  "id": "a75d50db77f90cb6727b3d965685043b6f4508a1",
  "worktree": "/home/igorw/Work/opencode-flow",
  "vcs": "git",
  "time": {
    "created": 1766250804812,
    "updated": 1766271841661,
    "initialized": 1766251912623
  }
}
```

- `GET /session` (sample)

```json
{
  "session_count": 42,
  "session_sample": {
    "id": "ses_4c1fea741ffeDHp7IxL9VwS4G0",
    "version": "1.0.180",
    "projectID": "a75d50db77f90cb6727b3d965685043b6f4508a1",
    "directory": "/home/igorw/Work/opencode-flow",
    "parentID": "ses_4c20b417effeMf5rqD3d2g5xYD",
    "title": "Probe opencode server (@general subagent)",
    "time": {
      "created": 1766271834302,
      "updated": 1766271994785
    },
    "summary": {
      "additions": 0,
      "deletions": 0,
      "files": 0
    }
  }
}
```

- `GET /experimental/tool/ids` (sample)

```json
{
  "tool_ids_total": 18,
  "tool_ids_sample": [
    "invalid",
    "bash",
    "read",
    "glob",
    "grep",
    "list",
    "edit",
    "write",
    "task",
    "webfetch"
  ]
}
```

- `GET /agent` (sample)

```json
{
  "agents_total": 16,
  "agent_sample": {
    "name": "build",
    "mode": "primary",
    "native": true,
    "permission": {
      "edit": "allow",
      "webfetch": "allow",
      "bash": {
        "*": "allow"
      },
      "doom_loop": "ask",
      "external_directory": "ask"
    }
  }
}
```

- `GET /command` (sample)

```json
{
  "commands_total": 5,
  "command_sample": {
    "name": "init",
    "description": "create/update AGENTS.md",
    "template": "Please analyze this codebase and create an AGENTS.md file containing:\n1. Build/lint/test commands - especially for running a single test\n2. Code style guidelines including imports, formatting, types, naming conventions, error handling, etc.\n\nThe file you create will be given to agentic coding agents (such as yourself) that operate in this repository. Make it about 20 lines long.\nIf there are Cursor rules (in .cursor/rules/ or .cursorrules) or Copilot rules (in .github/copilot-instructions.md), make sure to include them.\n\nIf there's already an AGENTS.md, improve it if it's located in /home/igorw/Work/opencode-flow\n\n$ARGUMENTS\n"
  }
}
```

- `GET /config` (subset)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "theme": null,
  "plugin_count": 5,
  "share": null,
  "autoupdate": null,
  "permission": null
}
```

- `POST /session/:sessionID/message` (request body example)

```json
{
  "agent": "build",
  "model": {
    "providerID": "openai",
    "modelID": "gpt-4o-mini"
  },
  "parts": [
    {
      "type": "text",
      "text": "Summarize the repository structure and list the entry points."
    }
  ]
}
```
