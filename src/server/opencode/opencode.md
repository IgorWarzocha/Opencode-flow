# OpenCode Integration

This module provides read-only access to the external OpenCode application's storage and syncs relevant sessions into the local database.

## Overview

OpenCode stores its data in `~/.local/share/opencode/storage/` with the following structure:

- `project/<HASH>.json` - Project metadata including worktree path and project ID
- `session/<PROJECT_ID>/ses_*.json` - Session files for each project

## Components

### storage.ts

Core storage access functions:

- `getOpenCodeStoragePath()` - Returns the storage base path
- `findProjectByRoot(rootPath)` - Finds a project by its worktree path
- `getProjectSessions(projectId)` - Returns all sessions for a project

### sync.ts

Session synchronization:

- `syncSessions(rootPath)` - Scans OpenCode storage for sessions matching the given workspace and imports them into the local `opencode_sessions` table with `INSERT OR IGNORE`

### serve.ts

OpenCode serve client:

- `ensureServeBaseUrl()` - Ensures a local `opencode serve` instance is running
- `getServeClient(directory)` - Returns a directory-scoped SDK client for the running server

## Usage

The module is used to integrate Flow with existing OpenCode sessions, allowing users to view and potentially continue their AI coding sessions within the Flow interface.

When a workspace root is set via `POST /api/files/root`, the system automatically:

1. Switches to a workspace-specific database at `<WORKSPACE>/.opencode-flow/flow.sqlite`
2. Syncs any matching OpenCode sessions into the local database
