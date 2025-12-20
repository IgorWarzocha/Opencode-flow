# AGENTS.md - Navigation & Development Guide

## Commands
- **Dev**: `bun run dev` (Starts `src/server.ts` with hot reload)
- **Build**: `bun run build` (Executes `build.ts` to bundle the application)
- **Test**: `bun test` (Run all); `bun test <path/to/file>` (Run single test)
- **Lint**: No specific command; trust TypeScript (5.9+) and Prettier.

## Core Principles
- **READ**: Must read `CODING-TS.md` and this file before every task.
- **Reference**: `/opencode/` is for reference ONLY. DO NOT edit or develop within it.
- **Fail Fast**: Throw errors clearly. Avoid defensive code that hides issues.
- **DRY & KISS**: Abstract patterns early. Simple, readable code > clever code.
- **Single Purpose**: Each file, component, and function does ONE thing well.

## Architecture & Code Style
- **Structure**: STRICT modular architecture. Use many focused folders to separate concerns.
- **Naming**: 
  - Files: `(feature).ts` or `(feature).tsx`. Avoid `index.ts` (use named barrel files instead), unless strictly required for root entry points.
  - Variables: Prefer descriptive single-word names. Named exports over default.
- **Exports**: HEAVY use of barrel exports. The barrel file MUST be named after its directory (e.g., `ui/ui.ts`).
- **Documentation**: 
  - Every directory MUST contain a `(feature).md` describing its code. 
  - NO `README.md` allowed in code directories.
  - Every file MUST start with a 2-3 sentence header comment.
- **Bun First**: ALWAYS use `Bun.file`, `Bun.serve`, `bun:sqlite`, `Bun.$`. Avoid `fs`, `express`, `dotenv`, `child_process`.
- **TypeScript (5.9+)**:
  - Strict types. `unknown` over `any`. Trust inference for locals.
  - ES Modules only. Type-only imports/exports (`import type`).
  - Use `import defer` for namespace-only deferred modules.
  - Use `satisfies` to validate shapes while preserving literal types.
- **React 19**:
  - Function components only. Hooks only. No class components.
  - No Vite. Use `Bun.serve` and direct HTML imports.
  - Prefer Actions (`useActionState`, `useFormStatus`) and `useOptimistic`.
  - Use `use` for Suspense-based data fetching where supported.
- **Tailwind 4.1**:
  - CSS-first approach. Use `@import "tailwindcss";`.
  - Define tokens in `@theme` blocks within CSS files.
- **Formatting**: No `console.log`. Use Prettier. 
- **Control Flow**: Avoid `else` and `try/catch` where possible.

## System Components
- **Database**: `src/server/database/` (SQLite + Vectors)
- **AI Engine**: `src/server/ai/` (Embeddings & Search)
- **Git Manager**: `src/server/git/` (Worktree isolation)
- **Visual Graph**: `src/components/canvas/` (@xyflow/react)
- **Terminal**: `src/components/terminal/` (xterm.js + WebSockets)
- **Editor**: `src/components/editor/` (Monaco + AI)

## Special Instructions
- Follow `REACT19.md`, `TAILWIND4.md`, `TS59.MD`, and `CONVEX.md` for specific implementation details.
- When adding new features, always create the corresponding `(feature).md` file.
- If unsure about a pattern, check the existing implementations in `src/`.
