# OpenCode Flow

<div align="center">

**Agent-Native IDE with Visual Orchestration & AI-Powered Coding**

[![Bun](https://img.shields.io/badge/Bun-1.3.4-black?logo=bun)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19.2.3-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

[Documentation](#-documentation) • [Features](#-features) • [Getting Started](#-getting-started) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

> **⚠️ DISCLAIMER**: This is a **community project** and is **NOT affiliated with or endorsed by** the official opencode.ai team. For the official project, please visit [opencode.ai](https://opencode.ai).

---

## ✨ Features

### 🎨 Visual Architecture Canvas

- Node-based design system using `@xyflow/react`
- Visualize features, files, notes, and commands as interconnected nodes
- Graph state persistence in SQLite
- Drag-and-drop workflow orchestration

### 🌳 Git Worktree Orchestration

- Isolated git worktrees for safe agent execution
- Automatic branch management
- Clean merge workflows with diff visualization
- Zero-conflict agent operations

### 🤖 Agent Console

- Real-time agent output via xterm.js
- Process spawning and SSE streaming
- Multi-agent session orchestration
- Session state persistence and recovery

### 💻 AI-Powered Code Editor

- Monaco Editor with VS Code-like experience
- Supermaven tab completions (250ms response)
- Multi-file editing capabilities
- TypeScript support out of the box

### 🔍 Vector-Powered Code Search

- Semantic code search using `@xenova/transformers`
- SQLite vector similarity search (sqlite-vec)
- Intelligent file discovery
- Context-aware suggestions

### 🔄 Session Management

- Complete Opencode session lifecycle
- Multi-session orchestration UI
- Real-time session monitoring
- Session state persistence

---

## 🚀 Getting Started

### Prerequisites

- Bun 1.3.4 or later
- Git
- Node.js (optional, Bun handles everything)

### Installation

```bash
# Clone the repository
git clone https://github.com/IgorWarzocha/Opencode-flow.git
cd Opencode-flow

# Install dependencies
bun install
```

### Running the Application

```bash
# Development mode with hot reload
bun run dev

# Production build
bun run build

# Start production server
bun run start
```

The application will be available at `http://localhost:3000`

---

## 🏗️ Architecture

### Tech Stack

| Category        | Technology                   |
| --------------- | ---------------------------- |
| Runtime         | Bun                          |
| Frontend        | React 19 + TypeScript        |
| UI              | Tailwind CSS 4.1 + shadcn/ui |
| Editor          | Monaco Editor                |
| AI Completion   | Supermaven API               |
| Embeddings      | @xenova/transformers         |
| Vector Database | SQLite + sqlite-vec          |
| Visual Graph    | @xyflow/react                |
| Terminal        | xterm.js                     |
| Database        | bun:sqlite                   |

### System Architecture

```
┌─────────────────────────────────────────────┐
│         Web Frontend (React 19)              │
│  ┌────────────┐  ┌────────────┐  ┌────────┐ │
│  │ UI Canvas │  │   Editor   │  │ Terminal│ │
│  │(@xyflow)  │  │ (Monaco)   │  │(xterm) │ │
│  └────────────┘  └────────────┘  └────────┘ │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│            Bun Server                        │
│  ┌────────────┐  ┌────────────┐  ┌────────┐ │
│  │   Routes   │  │   Agents   │  │   AI   │ │
│  └────────────┘  └────────────┘  └────────┘ │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│         SQLite Database + Vectors            │
│  ┌────────────┐  ┌────────────┐  ┌────────┐ │
│  │  Graph     │  │ Worktrees  │  │ Embed  │ │
│  │  State     │  │            │  │ dings  │ │
│  └────────────┘  └────────────┘  └────────┘ │
└───────────────────────────────────────────────┘
```

### Project Structure

```
src/
├── components/
│   ├── ai/           # AI sidebar and components
│   ├── canvas/       # Visual graph canvas
│   ├── editor/       # Monaco editor components
│   ├── file-browser/ # File tree browser
│   ├── git/          # Git operations UI
│   ├── opencode-assistant/  # Opencode agent UI
│   ├── session/      # Session management UI
│   ├── terminal/     # Terminal component
│   └── ui/           # Reusable UI components
├── server/
│   ├── agent/        # Agent orchestration
│   ├── ai/           # AI embeddings & search
│   ├── database/     # SQLite & vector operations
│   ├── git/          # Git worktree manager
│   ├── opencode/     # Opencode SDK integration
│   ├── routes/       # API endpoints
│   ├── session/      # Session management
│   └── socket/       # WebSocket handlers
├── lib/              # Utility functions
├── server.ts         # Bun server entry
└── frontend.tsx      # React entry
```

---

## 📖 Documentation

For detailed development guidelines, see:

- [AGENTS.md](./AGENTS.md) - Development guide and code style
- [PRD.md](./PRD.md) - Product requirements document
- [REACT19.md](./REACT19.md) - React 19 best practices
- [TAILWIND4.md](./TAILWIND4.md) - Tailwind CSS 4.1 guidelines
- [TS59.MD](./TS59.MD) - TypeScript 5.9+ conventions

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Read [AGENTS.md](./AGENTS.md) before making changes
3. Follow the established code style and patterns
4. Add tests for new features
5. Submit pull requests with clear descriptions

### Development Commands

```bash
# Run tests
bun test

# Format code
bun run format
```

---

## 🗺️ Roadmap

- [x] Bun server foundation
- [x] React 19 + TypeScript setup
- [x] UI components (shadcn/ui)
- [x] Tailwind CSS 4.1 integration
- [x] Monaco editor integration
- [x] Visual graph canvas (@xyflow)
- [x] Git worktree manager
- [x] Agent console (xterm.js)
- [x] Vector embeddings (@xenova/transformers)
- [x] Session orchestration
- [ ] Supermaven API completion
- [ ] Advanced diff/merge UI
- [ ] Multi-language support
- [ ] Plugin system

---

## ⚠️ Important Notes

- This project uses the local `opencode-sdk/` directory as the source of truth for SDK types
- The `/opencode/` directory is for reference only – do not edit it
- All opencode integrations must comply with **OpenCode SDK v2**
- The project follows strict TypeScript 5.9+ and React 19 best practices

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh)
- Powered by [React 19](https://react.dev)
- UI components by [shadcn/ui](https://ui.shadcn.com)
- Visual graphs by [@xyflow/react](https://reactflow.dev)
- AI embeddings by [Transformers.js](https://huggingface.co/docs/transformers.js)

---

<div align="center">

Made with ❤️ by the community

[Report Bug](https://github.com/IgorWarzocha/Opencode-flow/issues) • [Request Feature](https://github.com/IgorWarzocha/Opencode-flow/issues)

</div>
