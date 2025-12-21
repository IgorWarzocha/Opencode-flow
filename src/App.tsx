/**
 * App composes the core workspace layout with canvas, editor, and terminal panes.
 * It owns UI toggles for side panels and keeps the active session selection.
 * The header exposes entry points for session management and AI tools.
 */
import { useState, useEffect } from "react";
import { GraphCanvas } from "./components/canvas/canvas";
import { CodeEditor } from "./components/editor/editor";
import { DiffViewer } from "./components/editor/DiffViewer";
import { Terminal } from "./components/terminal/terminal";
import { AISidebar } from "./components/ai/ai";
import { SessionManager } from "./components/session/session";
import { FileBrowser } from "./components/file-browser/file-browser";
import { SourceControl } from "./components/git/git";
import { WorkspaceSelector } from "./components/workspace/workspace";
import { FolderOpen, Folder, GitGraph } from "lucide-react";
import "./index.css";

const headerButtonClass = (isActive: boolean) =>
  `text-sm px-3 py-1 rounded-md transition-colors border border-transparent ${
    isActive
      ? "bg-primary text-primary-foreground"
      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
  }`;

const sidebarTabClass = (isActive: boolean) =>
  `p-2 rounded-md transition-colors ${
    isActive
      ? "text-foreground bg-background shadow-sm"
      : "text-muted-foreground hover:text-foreground hover:bg-accent"
  }`;

export function App() {
  const [code, setCode] = useState<string>("// Select a file to view content");
  const [currentFile, setCurrentFile] = useState<string>("");
  const [isAIToolsOpen, setIsAIToolsOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(true);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceRefresh, setWorkspaceRefresh] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // New state for sidebar view
  const [sidebarView, setSidebarView] = useState<"files" | "git">("files");

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!currentFile) return;
        try {
          const res = await fetch("/api/files/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: currentFile, content: code }),
          });
          if (!res.ok) throw new Error("Failed to save");
          console.info(`Saved ${currentFile}`);
        } catch (error) {
          console.error("Failed to save file:", error);
          alert("Failed to save file");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFile, code]);

  const handleFileSelect = (path: string, content: string) => {
    setCurrentFile(path);
    setCode(content);
  };

  const getLanguage = (path: string) => {
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".md")) return "markdown";
    if (path.endsWith(".py")) return "python";
    return "typescript";
  };

  return (
    <div className="w-screen h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="border-b border-border px-4 py-2 bg-muted/20 h-12 flex items-center shrink-0 justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">OpenCode Flow</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWorkspaceOpen(true)}
            className={headerButtonClass(false)}
            title="Open Folder"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFilesOpen(!isFilesOpen)}
            className={headerButtonClass(isFilesOpen)}
          >
            Files
          </button>
          {activeSessionId && (
            <button onClick={() => setIsReviewOpen(true)} className={headerButtonClass(false)}>
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
          <DiffViewer sessionId={activeSessionId} onClose={() => setIsReviewOpen(false)} />
        )}

        {/* Main Content Area */}
        <WorkspaceSelector
          isOpen={isWorkspaceOpen}
          onClose={() => setIsWorkspaceOpen(false)}
          onSelect={async (path, ensureGit) => {
            await fetch("/api/files/root", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path, ensureGit }),
            });
            setWorkspaceRefresh((p) => p + 1);
          }}
        />
        <div className="flex-1 flex flex-row overflow-hidden">
          {/* File Browser Sidebar */}
          {isFilesOpen && (
            <div className="flex h-full border-r border-border transition-all w-72 shrink-0">
              {/* Sidebar Tab Strip */}
              <div className="w-12 flex flex-col items-center py-2 border-r border-border bg-muted/20 gap-2 shrink-0">
                <button
                  onClick={() => setSidebarView("files")}
                  className={sidebarTabClass(sidebarView === "files")}
                  title="Files"
                >
                  <Folder className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSidebarView("git")}
                  className={sidebarTabClass(sidebarView === "git")}
                  title="Source Control"
                >
                  <GitGraph className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 h-full overflow-hidden bg-muted/10">
                {sidebarView === "files" ? (
                  <FileBrowser
                    key={workspaceRefresh}
                    onFileSelect={handleFileSelect}
                    className="border-none w-full"
                  />
                ) : (
                  <SourceControl className="border-none w-full" />
                )}
              </div>
            </div>
          )}

          {/* Split View: Graph & Editor */}
          <div className="flex-1 flex flex-row overflow-hidden min-w-0">
            <div className="w-1/2 h-full border-r border-border relative">
              <GraphCanvas />
            </div>
            <div className="w-1/2 h-full relative flex flex-col">
              {currentFile && (
                <div className="px-4 py-2 bg-muted/10 border-b border-border text-xs text-muted-foreground font-mono truncate">
                  {currentFile}
                </div>
              )}
              <div className="flex-1 relative">
                <CodeEditor
                  value={code}
                  onChange={(val) => setCode(val ?? "")}
                  language={getLanguage(currentFile)}
                />
              </div>
            </div>
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
