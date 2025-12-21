# Session Flow and Message Semantics

Sources

- `opencode/packages/opencode/src/server/server.ts`
- `opencode/packages/opencode/src/session/prompt.ts`
- `opencode/packages/opencode/src/session/message-v2.ts`

Lifecycle Overview

1. `POST /session` creates a new session record.
2. The client sends user input via `POST /session/:sessionID/message`.
3. The server creates a user message and then runs the agent loop.
4. Messages and parts are stored in the session stream and emitted over SSE (`/event`).

Prompt Input Shape (core)

- `POST /session/:sessionID/message`
- Body is `SessionPrompt.PromptInput`:
  - `model`: `{ providerID, modelID }` (optional)
  - `agent`: string (optional, defaults to `build`)
  - `noReply`: boolean (optional)
  - `tools`: record of tool enable/disable flags (optional)
  - `system`: string (optional)
  - `parts`: array of input parts, each discriminated by `type`:
    - `text`: `{ type: "text", text: string }`
    - `file`: `{ type: "file", url: string, filename?: string, mime: string }`
    - `agent`: `{ type: "agent", name: string }`
    - `subtask`: `{ type: "subtask", agent: string, prompt: string, description?: string, command?: string }`

File Part Semantics

- `file` parts can use either `data:` URLs or `file:` URLs.
- `file:` URLs may include query params `start` and `end` to limit line ranges.
- When reading a `file:` part with `text/plain`, the server internally runs the Read tool and injects the content as synthetic text parts.

Streaming Behavior

- `POST /session/:sessionID/message` sets `Content-Type: application/json` and writes JSON once the first assistant response is ready.
- `POST /session/:sessionID/prompt_async` returns 204 immediately and runs the loop in background.

Example Response (live server, content redacted)

```json
{
  "info": {
    "id": "msg_b3e106ada001geelwZJ7pfUiYY",
    "sessionID": "ses_4c1ef9530ffeu8m4CvMR628rVb",
    "role": "assistant",
    "time": { "created": 1766272821978, "completed": 1766272836658 },
    "parentID": "msg_b3e106ad4001rbT8nRv7KzX0Vy",
    "modelID": "glm-4.6v-flash",
    "providerID": "zai-coding-plan",
    "mode": "build",
    "agent": "build",
    "path": { "cwd": "/home/igorw/Work/opencode-flow", "root": "/home/igorw/Work/opencode-flow" },
    "cost": 0,
    "tokens": { "input": 16690, "output": 574, "reasoning": 0, "cache": { "read": 0, "write": 0 } },
    "finish": "stop"
  },
  "parts": [
    { "id": "prt_b3e109151001Ni3UYFCvAw8tqa", "type": "step-start" },
    { "id": "prt_b3e109152001HkAkhOYV30ljwH", "type": "reasoning", "text": "<redacted>" },
    { "id": "prt_b3e109a67001q2DgfVAKVgYtfP", "type": "text", "text": "<redacted>" },
    { "id": "prt_b3e10a428001MGYfgvbxVWvyqQ", "type": "step-finish", "reason": "stop" }
  ]
}
```

Command Invocation

- `POST /session/:sessionID/command` resolves a named command template, expands args, and then creates a session prompt.
- Commands can spawn subtasks depending on command config and agent mode.

Shell Invocation (dangerous)

- `POST /session/:sessionID/shell` executes a shell command in the instance directory.
- Output is appended into a tool part and a synthetic user message.
- This can modify files. Avoid in read-only or observer-only contexts.

Diffs

- `GET /session/:sessionID/diff` returns all diffs for a session.
- `GET /session/:sessionID/diff?messageID=` returns diffs tied to a specific user message.

Schema Excerpts (from `GET /doc`)

Session

```json
{
  "type": "object",
  "required": ["id", "projectID", "directory", "title", "version", "time"],
  "properties": {
    "id": { "type": "string", "pattern": "^ses.*" },
    "projectID": { "type": "string" },
    "directory": { "type": "string" },
    "parentID": { "type": "string", "pattern": "^ses.*" },
    "summary": {
      "type": "object",
      "required": ["additions", "deletions", "files"],
      "properties": {
        "additions": { "type": "number" },
        "deletions": { "type": "number" },
        "files": { "type": "number" }
      }
    },
    "share": {
      "type": "object",
      "required": ["url"],
      "properties": { "url": { "type": "string" } }
    },
    "title": { "type": "string" },
    "version": { "type": "string" },
    "time": {
      "type": "object",
      "required": ["created", "updated"],
      "properties": {
        "created": { "type": "number" },
        "updated": { "type": "number" },
        "compacting": { "type": "number" },
        "archived": { "type": "number" }
      }
    }
  }
}
```

Message (assistant variant)

```json
{
  "type": "object",
  "required": [
    "id",
    "sessionID",
    "role",
    "time",
    "parentID",
    "modelID",
    "providerID",
    "mode",
    "agent",
    "path",
    "cost",
    "tokens"
  ],
  "properties": {
    "id": { "type": "string" },
    "sessionID": { "type": "string" },
    "role": { "type": "string", "const": "assistant" },
    "time": {
      "type": "object",
      "required": ["created"],
      "properties": {
        "created": { "type": "number" },
        "completed": { "type": "number" }
      }
    },
    "parentID": { "type": "string" },
    "modelID": { "type": "string" },
    "providerID": { "type": "string" },
    "mode": { "type": "string" },
    "agent": { "type": "string" },
    "path": {
      "type": "object",
      "required": ["cwd", "root"],
      "properties": {
        "cwd": { "type": "string" },
        "root": { "type": "string" }
      }
    },
    "cost": { "type": "number" },
    "tokens": {
      "type": "object",
      "required": ["input", "output", "reasoning", "cache"],
      "properties": {
        "input": { "type": "number" },
        "output": { "type": "number" },
        "reasoning": { "type": "number" },
        "cache": {
          "type": "object",
          "required": ["read", "write"],
          "properties": {
            "read": { "type": "number" },
            "write": { "type": "number" }
          }
        }
      }
    },
    "finish": { "type": "string" }
  }
}
```

Part (union)

```json
{
  "anyOf": [
    { "$ref": "#/components/schemas/TextPart" },
    { "$ref": "#/components/schemas/FilePart" },
    { "$ref": "#/components/schemas/ToolPart" },
    { "$ref": "#/components/schemas/AgentPart" },
    { "$ref": "#/components/schemas/CompactionPart" },
    { "$ref": "#/components/schemas/RetryPart" },
    { "$ref": "#/components/schemas/StepStartPart" },
    { "$ref": "#/components/schemas/StepFinishPart" },
    { "$ref": "#/components/schemas/SnapshotPart" },
    { "$ref": "#/components/schemas/PatchPart" },
    { "type": "object", "properties": { "type": { "const": "subtask" } } }
  ]
}
```

PromptInput parts (request schemas)

```json
{
  "TextPartInput": {
    "type": "object",
    "required": ["type", "text"],
    "properties": { "type": { "const": "text" }, "text": { "type": "string" } }
  },
  "FilePartInput": {
    "type": "object",
    "required": ["type", "mime", "url"],
    "properties": {
      "type": { "const": "file" },
      "mime": { "type": "string" },
      "url": { "type": "string" }
    }
  },
  "AgentPartInput": {
    "type": "object",
    "required": ["type", "name"],
    "properties": { "type": { "const": "agent" }, "name": { "type": "string" } }
  },
  "SubtaskPartInput": {
    "type": "object",
    "required": ["type", "prompt", "description", "agent"],
    "properties": { "type": { "const": "subtask" } }
  }
}
```

Tool list schema

```json
{
  "ToolListItem": {
    "type": "object",
    "required": ["id", "description", "parameters"],
    "properties": {
      "id": { "type": "string" },
      "description": { "type": "string" },
      "parameters": {}
    }
  }
}
```
