/**
 * App composes the core workspace layout with canvas, editor, and terminal panes.
 * It owns UI toggles for side panels and keeps the active session selection.
 * The header exposes entry points for session management and AI tools.
 */
import { useState } from "react";
import { GraphCanvas } from "./components/canvas/canvas";
import { CodeEditor } from "./components/editor/editor";
import { DiffViewer } from "./components/editor/DiffViewer";
import { Terminal } from "./components/terminal/terminal";
import { AISidebar } from "./components/ai/ai";
import { SessionManager } from "./components/session/session";
import "./index.css";

const headerButtonClass = (isActive: boolean) =>
  `text-sm px-3 py-1 rounded-md transition-colors border border-transparent ${
    isActive
      ? "bg-primary text-primary-foreground"
      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
  }`;

export function App() {
  const [code, setCode] = useState<string>("// Start coding here...\n\nfunction hello() {\n  console.log('Hello OpenCode Flow!');\n}");
  const [isAIToolsOpen, setIsAIToolsOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <div className="w-screen h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="border-b border-border px-4 py-2 bg-muted/20 h-12 flex items-center shrink-0 justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">OpenCode Flow</h1>
        <div className="flex items-center gap-2">
          {activeSessionId && (
            <button
              onClick={() => setIsReviewOpen(true)}
              className={headerButtonClass(false)}
            >
              Review Changes
            </button>
          )}
          <button
            onClick={() => setIsSessionsOpen(!isSessionsOpen)}
            className={headerButtonClass(isSessionsOpen)}
          >
            Sessions
          </button>
          <button
            onClick={() => setIsAIToolsOpen(!isAIToolsOpen)}
            className={headerButtonClass(isAIToolsOpen)}
          >
            AI Tools
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <AISidebar isOpen={isAIToolsOpen} onClose={() => setIsAIToolsOpen(false)} />
        <SessionManager
          isOpen={isSessionsOpen}
          onClose={() => setIsSessionsOpen(false)}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
        />
        
        {isReviewOpen && activeSessionId && (
            <DiffViewer 
                sessionId={activeSessionId} 
                onClose={() => setIsReviewOpen(false)} 
            />
        )}

        {/* Main Split View: Graph & Editor */}
        <div className="flex-1 flex flex-row overflow-hidden">
          <div className="w-1/2 h-full border-r border-border relative">
            <GraphCanvas />
          </div>
          <div className="w-1/2 h-full relative">
            <CodeEditor value={code} onChange={(val) => setCode(val ?? "")} />
          </div>
        </div>

        {/* Bottom Terminal */}
        <div className="h-[250px] border-t border-border shrink-0 bg-zinc-950 relative">
          <Terminal sessionId={activeSessionId} />
        </div>
      </main>
    </div>
  );
}

export default App;