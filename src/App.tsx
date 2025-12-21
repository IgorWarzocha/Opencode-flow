import { useState, useEffect } from "react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { GraphCanvas } from "./components/canvas/canvas";
import { CodeEditor } from "./components/editor/editor";
import { DiffViewer } from "./components/editor/DiffViewer";
import { TerminalSidebar } from "./components/terminal/terminal";
import { SessionSidebar } from "./components/session/session";
import { FileBrowser } from "./components/file-browser/file-browser";
import { SourceControl } from "./components/git/git";
import { DocSidebar } from "./components/docs/docs";
import { WorkspaceSelector } from "./components/workspace/workspace";
import {
  FolderOpen,
  Folder,
  GitGraph,
  MessageSquare,
  Book,
  Bot,
  Terminal as TerminalIcon,
  LayoutTemplate,
  FileCode,
  Columns,
} from "lucide-react";
import "./index.css";
import { ThemeProvider } from "./components/theme/theme-provider";
import { ThemeToggle } from "./components/theme/theme-toggle";
import { OpenCodeAssistantPanel } from "./components/opencode-assistant/opencode-assistant";
import { cn } from "./lib/utils";

const headerButtonClass = (isActive: boolean) =>
  cn(
    "text-sm px-3 py-1 rounded-md transition-colors border border-transparent",
    isActive
      ? "bg-primary text-primary-foreground"
      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
  );

const sidebarTabClass = (isActive: boolean) =>
  cn(
    "p-2 rounded-md transition-colors flex justify-center",
    isActive
      ? "text-primary bg-accent/50 shadow-sm"
      : "text-muted-foreground hover:text-foreground hover:bg-accent",
  );

const viewModeButtonClass = (isActive: boolean) =>
  cn(
    "p-1.5 rounded-sm transition-all",
    isActive
      ? "bg-accent text-accent-foreground shadow-sm"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

type SidebarView = "files" | "git" | "sessions" | "docs" | "terminal";
type CenterMode = "graph" | "editor" | "split";

export function App() {
  const [code, setCode] = useState<string>("// Select a file to view content");
  const [currentFile, setCurrentFile] = useState<string>("");

  // Layout State
  const [sidebarView, setSidebarView] = useState<SidebarView>("files");
  const [centerMode, setCenterMode] = useState<CenterMode>("split");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceRefresh, setWorkspaceRefresh] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

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
        } catch {
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

  const toggleSidebar = (view: SidebarView) => {
    if (sidebarView === view) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setSidebarView(view);
      setIsSidebarOpen(true);
    }
  };

  return (
    <ThemeProvider>
      <div className="fixed inset-0 bg-background text-foreground flex flex-col overflow-hidden">
        {/* Header */}
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
            {activeSessionId && (
              <button onClick={() => setIsReviewOpen(true)} className={headerButtonClass(false)}>
                Review Changes
              </button>
            )}
          </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 flex flex-row overflow-hidden min-h-0">
          {/* Left Strip */}
          <div className="w-12 flex flex-col items-center py-2 border-r border-border bg-muted/10 gap-2 shrink-0 z-10">
            <button
              onClick={() => toggleSidebar("files")}
              className={sidebarTabClass(sidebarView === "files" && isSidebarOpen)}
              title="Files"
            >
              <Folder className="w-5 h-5" />
            </button>
            <button
              onClick={() => toggleSidebar("git")}
              className={sidebarTabClass(sidebarView === "git" && isSidebarOpen)}
              title="Source Control"
            >
              <GitGraph className="w-5 h-5" />
            </button>
            <button
              onClick={() => toggleSidebar("sessions")}
              className={sidebarTabClass(sidebarView === "sessions" && isSidebarOpen)}
              title="Sessions"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => toggleSidebar("docs")}
              className={sidebarTabClass(sidebarView === "docs" && isSidebarOpen)}
              title="Documentation"
            >
              <Book className="w-5 h-5" />
            </button>

            <div className="mt-auto flex flex-col items-center gap-2">
              <button
                onClick={() => toggleSidebar("terminal")}
                className={sidebarTabClass(sidebarView === "terminal" && isSidebarOpen)}
                title="Terminal"
              >
                <TerminalIcon className="w-5 h-5" />
              </button>
              <ThemeToggle />
            </div>
          </div>

          {/* Resizable Layout */}
          <PanelGroup orientation="horizontal" className="flex-1 min-w-0">
            {isSidebarOpen && (
              <>
                <Panel
                  defaultSize={20}
                  minSize={15}
                  collapsible
                  id="sidebar-panel"
                  className="flex flex-col h-full overflow-hidden"
                >
                  <div className="w-full h-full bg-background flex flex-col">
                    {sidebarView === "files" && (
                      <FileBrowser
                        key={workspaceRefresh}
                        onFileSelect={handleFileSelect}
                        className="border-none w-full h-full"
                      />
                    )}
                    {sidebarView === "git" && (
                      <SourceControl className="border-none w-full h-full" />
                    )}
                    {sidebarView === "sessions" && (
                      <SessionSidebar
                        activeSessionId={activeSessionId}
                        onSelectSession={setActiveSessionId}
                        className="border-none w-full h-full"
                      />
                    )}
                    {sidebarView === "docs" && (
                      <DocSidebar
                        onFileSelect={handleFileSelect}
                        className="border-none w-full h-full"
                      />
                    )}
                    {sidebarView === "terminal" && (
                      <TerminalSidebar className="border-none w-full h-full" />
                    )}
                  </div>
                </Panel>
                <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary transition-colors focus:outline-none" />
              </>
            )}

            {/* Center Panel Group */}
            <Panel
              defaultSize={50}
              minSize={30}
              id="center-panel"
              className="flex flex-col h-full overflow-hidden"
            >
              <PanelGroup orientation="vertical" className="h-full w-full">
                {/* Editor/Graph Area */}
                <Panel
                  defaultSize={100}
                  minSize={20}
                  id="editor-graph-panel"
                  className="flex flex-col h-full overflow-hidden"
                >
                  <div className="flex flex-col h-full w-full overflow-hidden">
                    {/* Center Toolbar */}
                    <div className="h-9 border-b border-border bg-background flex items-center justify-between px-2 shrink-0">
                      <div className="text-xs text-muted-foreground font-medium px-2">
                        {currentFile || "No file selected"}
                      </div>
                      <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded-md border border-border/50">
                        <button
                          onClick={() => setCenterMode("graph")}
                          className={viewModeButtonClass(centerMode === "graph")}
                          title="Graph View"
                        >
                          <LayoutTemplate className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCenterMode("split")}
                          className={viewModeButtonClass(centerMode === "split")}
                          title="Split View"
                        >
                          <Columns className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCenterMode("editor")}
                          className={viewModeButtonClass(centerMode === "editor")}
                          title="Editor View"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 flex flex-row overflow-hidden relative">
                      {(centerMode === "graph" || centerMode === "split") && (
                        <div
                          className={cn(
                            "h-full relative",
                            centerMode === "split" ? "w-1/2 border-r border-border" : "w-full",
                          )}
                        >
                          <GraphCanvas />
                        </div>
                      )}
                      {(centerMode === "editor" || centerMode === "split") && (
                        <div
                          className={cn(
                            "h-full relative flex flex-col",
                            centerMode === "split" ? "w-1/2" : "w-full",
                          )}
                        >
                          <div className="flex-1 relative">
                            <CodeEditor
                              value={code}
                              onChange={(val) => setCode(val ?? "")}
                              language={getLanguage(currentFile)}
                              // Make sure editor resizes correctly
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>

            {/* Right Panel (Assistant) */}
            {isRightPanelOpen && (
              <>
                <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary transition-colors focus:outline-none" />
                <Panel
                  defaultSize={30}
                  minSize={20}
                  collapsible
                  id="assistant-panel"
                  className="flex flex-col h-full overflow-hidden"
                >
                  <OpenCodeAssistantPanel
                    isOpen={isRightPanelOpen}
                    onClose={() => setIsRightPanelOpen(false)}
                  />
                </Panel>
              </>
            )}
          </PanelGroup>

          {/* Right Strip */}
          <div className="w-12 flex flex-col items-center py-2 border-l border-border bg-muted/10 gap-2 shrink-0 z-10">
            <button
              onClick={() => setIsRightPanelOpen((prev) => !prev)}
              className={sidebarTabClass(isRightPanelOpen)}
              title="OpenCode Assistant"
            >
              <Bot className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modals */}
        {isReviewOpen && activeSessionId && (
          <DiffViewer sessionId={activeSessionId} onClose={() => setIsReviewOpen(false)} />
        )}

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
      </div>
    </ThemeProvider>
  );
}

export default App;
