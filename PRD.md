# OpenCode Flow - Product Requirements Document

## Executive Summary

**Project Name**: OpenCode Flow

**Tech Stack**: Bun, React 19, TypeScript, Tailwind CSS 4.1, SQLite (bun:sqlite), @xyflow/react, Monaco Editor, @xenova/transformers

**Current Implementation Status**: ✅ **Foundation Complete**

**Vision**: Intelligent Agent-Native IDE combining visual orchestration with AI-powered coding. Features node-based architecture for defining features, isolated Git Worktrees for safe agent execution, Supermaven tab completions, and vector-powered code intelligence for context-aware development.

## Current State Analysis

### ✅ **Completed Infrastructure**

1. **Bun Server**: `src/index.ts` with routing and hot reload
2. **React 19 Frontend**: Modern React with TypeScript  
3. **UI Components**: Full shadcn/ui component library (button, card, input, label, select, textarea)
4. **Tailwind CSS 4.1**: Configured with bun-plugin-tailwind
5. **API Testing**: Working API tester component for development
6. **Project Structure**: Proper Bun-based development setup

### 🔄 **Needs Implementation**

1. **Database Layer**: SQLite setup with migrations + vector embeddings
2. **Visual Graph**: @xyflow/react integration  
3. **Git Worktree Manager**: Isolation system
4. **Agent Integration**: opencode CLI wrapper
5. **Terminal UI**: xterm.js for agent console
6. **Diff/Merge System**: Branch management UI
7. **AI Completion System**: Supermaven tab completions
8. **Code Editor**: Monaco Editor with integrations
9. **Session Management**: Opencode session orchestration and lifecycle management

## Architecture Overview

### Technology Stack

✅ **Runtime**: Bun (confirmed with native SQLite support)
✅ **Database**: SQLite via bun:sqlite (ready to implement)  
✅ **Frontend**: React 19 + TypeScript (complete)
✅ **Visual Graph**: @xyflow/react (added to dependencies)
✅ **Terminal**: xterm.js (added to dependencies)
✅ **Styling**: Tailwind CSS 4.1 (configured)
✅ **Vector Embeddings**: @xenova/transformers (identified for use)
✅ **AI Completion**: Supermaven integration strategy defined

### System Architecture

```
Web Frontend (React 19 + @xyflow) <--> Bun Server <--> SQLite Database
                                    |
                                    v
                           Git Worktree Manager
                                    |
                                    v
                           Opencode Agent Spawner
```

## Core Features Implementation Status

### 🏗️ **Feature 1: Visual Architecture Canvas** 
- **Status**: 20% Complete (UI framework ready)
- **Missing**: @xyflow integration, node types, graph state persistence
- **Next Step**: Implement canvas component with SQLite-backed state

### 🏗️ **Feature 2: Git Worktree Orchestration**
- **Status**: 0% Complete  
- **Missing**: Git manager, worktree creation, isolation logic
- **Next Step**: Create `src/server/git.ts` with Bun.spawn git commands

### 🏗️ **Feature 3: Agent Console**
- **Status**: 10% Complete (xterm dependencies added)
- **Missing**: Process spawning, SSE streaming, terminal integration
- **Next Step**: Implement agent wrapper with stdout capture

### 🏗️ **Feature 4: Review & Merge**
- **Status**: 0% Complete
- **Missing**: Diff viewer, merge workflow, branch management
- **Next Step**: Build diff component after worktree system

### 🏗️ **Feature 5: AI-Powered Code Editor**
- **Status**: 0% Complete
- **Missing**: Monaco Editor integration, Supermaven tab completion system
- **Next Step**: Implement Monaco with Supermaven API integration

### 🏗️ **Feature 6: Vector Code Search**
- **Status**: 0% Complete
- **Missing**: @xenova/transformers embeddings, SQLite vector search
- **Next Step**: Add semantic code search with Transformers.js

## Implementation Priority

### **Phase 1: Database & Graph Foundation**
```sql
-- SQLite tables needed
CREATE TABLE nodes (id UUID, type TEXT, content JSON, created_at DATETIME);
CREATE TABLE edges (id UUID, source UUID, target UUID, created_at DATETIME);
CREATE TABLE worktrees (id UUID, branch TEXT, path TEXT, status TEXT);
CREATE TABLE code_embeddings (
  id UUID PRIMARY KEY,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding BLOB, -- vector from @xenova/transformers
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE opencode_sessions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'paused', 'completed', 'failed'
  worktree_path TEXT,
  branch_name TEXT,
  agent_pid INTEGER,
  context JSON, -- session context and configuration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Vector extension for similarity search
CREATE VIRTUAL TABLE code_vectors USING vec0(embedding BLOB);

### **Phase 2: Visual Canvas Integration**
- Replace current demo UI with @xyflow canvas
- Implement node types: feature, file, note, command
- Add graph persistence to SQLite

### **Phase 3: Agent Orchestration**
- Git worktree manager using Bun.spawn
- Opencode CLI wrapper
- Terminal console with xterm.js

### **Phase 4: Code Editor & AI Completion**
- Monaco Editor integration with TypeScript support
- Supermaven tab completion API integration
- Multi-file editing capabilities

### **Phase 5: Vector Search & Intelligence**
- @xenova/transformers integration for code embeddings
- SQLite vector similarity search
- Semantic code discovery and context-aware suggestions

### **Phase 6: Session Management System**
- Opencode session lifecycle management
- Multi-session orchestration UI
- Session state persistence and recovery
- Real-time session monitoring

### **Phase 7: Review & Merge UI**
- Diff viewer component
- Branch management interface
- Cleanup workflows

## Key Simplifications from Original PRD

1. **Skip Vite Setup**: ✅ Already using Bun's built-in bundler
2. **Skip UI Library Selection**: ✅ shadcn/ui + Tailwind 4.1 implemented
3. **Skip Basic React Setup**: ✅ React 19 + TypeScript ready
4. **Reduced Dependencies**: Using Bun's native features instead of external packages

## Development Commands (Current)

```bash
# Start development server
bun run dev

# Production build  
bun run build

# Start production server
bun run start
```

## Core Features Deep Dive

### **Supermaven Tab Completion Integration**
- **Approach**: Integrate Supermaven API for real-time code completions
- **Implementation**: Custom completion provider for Monaco Editor
- **Benefit**: 250ms response times with 1M token context window
- **Status**: Research phase - requires Supermaven API access

### **Vector-Powered Code Intelligence**
- **Technology**: @xenova/transformers (Transformers.js) for in-browser embeddings
- **Database**: SQLite with vec0 extension for vector similarity search
- **Use Cases**: 
  - Semantic code search ("find authentication functions")
  - Context-aware code suggestions based on existing codebase
  - Intelligent file discovery for node connections
  - Session-aware code context and memory
- **Models**: Lightweight models like `Xenova/all-MiniLM-L6-v2` for fast inference

### **Monaco Editor Enhancement Stack**
- **Core**: Monaco Editor for VS Code-like editing experience
- **Completions**: Supermaven integration for AI-powered suggestions
- **Intelligence**: Vector search for context-aware file navigation
- **Features**: Multi-file editing, TypeScript support, integrated diff view

## Technology Stack

```json
{
  "runtime": "Bun",
  "frontend": "React 19 + TypeScript",
  "ui": "Tailwind CSS 4.1 + shadcn/ui",
  "editor": "Monaco Editor",
  "ai_completion": "Supermaven API",
  "embeddings": "@xenova/transformers",
  "vector_db": "SQLite + sqlite-vec extension",
  "visual_graph": "@xyflow/react",
  "terminal": "xterm.js",
  "database": "bun:sqlite"
}
```

## Next Immediate Steps

1. **Install enhanced dependencies**: `bun install @monaco-editor/react @xenova/transformers sqlite-vec`
2. **Create vector-enabled database layer**: `src/server/db.ts` with embeddings and session support
3. **Implement graph canvas**: Replace current App.tsx demo with @xyflow
4. **Build Git manager**: `src/server/git.ts` for worktree isolation
5. **Add Monaco Editor**: Integrated code editor with AI completion hooks
6. **Implement vector search**: Code intelligence and semantic discovery
7. **Add API endpoints**: Worktree/agent orchestration + completion APIs
8. **Design session management**: Opencode session architecture and workflows

The foundation is solid with enhanced AI capabilities - this is an intelligent IDE project with comprehensive session management and visual orchestration capabilities.