# Database Module

The Database module handles all persistence requirements for the application, integrating both relational data management and vector storage for code intelligence.

## Workspace-Aware Architecture

The database is now workspace-aware. Each workspace has its own SQLite database located at:

```
<WORKSPACE_ROOT>/.opencode-flow/flow.sqlite
```

This ensures session data and graph state are isolated per project.

## Technologies

- **bun:sqlite**: Utilizes Bun's high-performance native SQLite implementation for reliable synchronous and asynchronous data access.
- **sqlite-vec**: A SQLite extension providing vector search capabilities, enabling efficient similarity search for code embeddings.

## Tables

The database schema is defined in `src/server/database/schema.ts` and includes the following primary tables:

- **`nodes`**: Stores visual graph nodes (UUID, type, JSON content).
- **`edges`**: Stores connections between graph nodes (Source UUID -> Target UUID).
- **`worktrees`**: Manages git worktree configurations (branch, path, status).
- **`code_embeddings`**: Stores source code files and their associated metadata (file path, content).
- **`opencode_sessions`**: Tracks active agent sessions, including state, associated worktrees, and process IDs.

## API

### Database Management

- **`getDB()`**: Returns the current database instance. Throws if not initialized.
- **`switchWorkspaceDB(rootPath)`**: Closes any existing connection, creates `.opencode-flow` directory, opens new database, loads extensions, and initializes schema.
- **`initDB(rootPath)`**: Alias for `switchWorkspaceDB()` for startup use.
- **`getCurrentWorkspacePath()`**: Returns the current workspace path or null.

### Schema

- **`initSchema(db)`**: Defined in `src/server/database/schema.ts`, this function executes the migration queries to create all necessary tables if they do not already exist.

## Usage

```typescript
import { initDB, getDB, switchWorkspaceDB } from "./server/database/database.ts";

// On server startup
await initDB(process.cwd());

// When workspace changes
await switchWorkspaceDB(newWorkspacePath);

// In route handlers
const db = getDB();
db.query("SELECT * FROM nodes").all();
```
