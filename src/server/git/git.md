# Git Manager Module

The Git Manager module (`src/server/git/`) orchestrates git operations, specifically leveraging **Git Worktrees** to provide isolated execution environments for concurrent agents. This ensures that agents can modify code, switch branches, and run tests without interfering with the main working directory or each other.

## Core Principles

- **Isolation**: Every agent session operates within its own dedicated worktree.
- **Bun Native**: All git commands are executed using `Bun.spawn` for performance and stream handling.
- **Stateless**: The module queries the current state of git worktrees directly from the filesystem/git index.

## Implementation Details

### Worktree Interface

The module defines a strict `Worktree` interface to represent a checked-out worktree:

```typescript
export interface Worktree {
  path: string;      // Absolute path to the worktree directory
  head: string;      // Commit hash of HEAD
  branch?: string;   // Name of the checked-out branch (if any)
  detached: boolean; // Whether the worktree is in a detached HEAD state
}
```

### Core Functions

All functions wrap standard `git worktree` commands using `Bun.spawn` and handle parsing/error reporting.

#### `listWorktrees()`
Retrieves all active worktrees by parsing `git worktree list --porcelain`.
- **Returns**: `Promise<Worktree[]>`
- **Usage**: Used to monitor active agent environments and cleanup stale sessions.

#### `createWorktree(branch: string, path: string)`
Creates a new worktree at the specified path, checking out the given branch.
- **Command**: `git worktree add <path> <branch>`
- **Purpose**: Initializes a new environment for an agent session.

#### `removeWorktree(path: string)`
Deletes a worktree and cleans up the associated git metadata.
- **Command**: `git worktree remove <path>`
- **Purpose**: Cleans up resources when an agent session ends.
