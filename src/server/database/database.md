# Database Module

The Database module handles all persistence requirements for the application, integrating both relational data management and vector storage for code intelligence.

## Technologies

*   **bun:sqlite**: Utilizes Bun's high-performance native SQLite implementation for reliable synchronous and asynchronous data access.
*   **sqlite-vec**: A SQLite extension providing vector search capabilities, enabling efficient similarity search for code embeddings.

## Tables

The database schema is defined in `src/server/database/schema.ts` and includes the following primary tables:

*   **`nodes`**: Stores visual graph nodes (UUID, type, JSON content).
*   **`edges`**: Stores connections between graph nodes (Source UUID -> Target UUID).
*   **`worktrees`**: Manages git worktree configurations (branch, path, status).
*   **`code_embeddings`**: Stores source code files and their associated metadata (file path, content).
*   **`opencode_sessions`**: Tracks active agent sessions, including state, associated worktrees, and process IDs.

## Initialization

The module exposes key functions for setting up the database environment:

*   **`initDB()`**: The main entry point found in `src/server/database/sqlite.ts`. It initializes the SQLite database connection, loads the `sqlite-vec` extension, and triggers schema setup.
*   **`initSchema(db)`**: Defined in `src/server/database/schema.ts`, this function executes the migration queries to create all necessary tables if they do not already exist.
