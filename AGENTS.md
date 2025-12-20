# AGENTS.md - Navigation & Development Guide

## Commands
- **Dev**: `bun run dev` (Starts `src/index.ts` with hot reload)
- **Build**: `bun run build` (Bundles `.html` files into `dist/`)
- **Test**: `bun test` (Run all); `bun test <file>` (Run single test)
- **Lint**: No specific command; trust TypeScript and Prettier.

## Development Process
- **READ**: Must read `CODING-TS.md` during every stage of development.
- **Reference**: `/opencode/` is for reference ONLY. Do NOT develop within it.

## Architecture & Code Style
- **Structure**: STRICT modular architecture. Use many folders to separate concerns.
- **Naming**: ALL files must be named `(feature).ts` or `(feature).tsx`. NO files named `index.ts` allowed.
- **Exports**: HEAVY use of barrel exports. The barrel file must be named after its directory (e.g., `ui/ui.ts`).
- **Documentation**: Agents MUST document their work in a `(feature).md` file within the same directory where the code lives. NO `README.md` allowed.
- **Patterns**: DRY, Single Purpose, Composition over Inheritance. KISS.
- **Bun APIs**: ALWAYS prefer `Bun.file`, `Bun.serve`, `bun:sqlite`, `Bun.$`. No `fs`, `express`, `dotenv`.
- **Types**: TS 5.9+. Strict types, prefer `unknown` over `any`. Trust inference for locals.
- **Naming**: Single-word variable names preferred. Named exports over default.
- **Formatting**: No `console.log`. Use Prettier. 2-3 sentence file header comment.
- **Control Flow**: Avoid `else` and `try/catch` where possible. Fail fast.
- **Imports**: ES Modules with type-only imports/exports (`import type`). Use `import defer` for heavy side effects.
- **React**: React 19. No `vite`. Use HTML imports in `Bun.serve()`.
