/**
 * Workspace Selector Component
 * Allows users to browse the system filesystem and select a working directory.
 */
import { useState, useEffect } from "react";
import { Folder, File, ChevronRight, Check, Home, ArrowUp, GitGraph } from "lucide-react";
import { Input } from "../ui/input";

interface SystemFile {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface WorkspaceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string, ensureGit: boolean) => void;
}

export function WorkspaceSelector({ isOpen, onClose, onSelect }: WorkspaceSelectorProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [ensureGit, setEnsureGit] = useState(false);
  const [files, setFiles] = useState<SystemFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load: get user home
  useEffect(() => {
    if (isOpen && !currentPath) {
      fetch("/api/files/home")
        .then((r) => r.json())
        .then((d) => loadPath(d.path))
        .catch(console.error);
    }
  }, [isOpen]);

  const loadPath = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/files/system/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });

      if (!res.ok) throw new Error("Access denied or invalid path");

      const data = await res.json();
      setFiles(data.files);
      setCurrentPath(data.path);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    loadPath(path);
  };

  const handleUp = () => {
    // Simple parent directory logic
    const parts = currentPath.split("/");
    parts.pop();
    const parent = parts.join("/") || "/";
    loadPath(parent);
  };

  const handleSelect = () => {
    onSelect(currentPath, ensureGit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-background border border-border rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
          <h2 className="font-semibold flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-400" />
            Open Workspace
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => loadPath(currentPath)}
              className="text-xs hover:underline text-muted-foreground"
            >
              Refresh
            </button>
            <button onClick={onClose} className="text-xs hover:underline text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="p-2 border-b border-border flex gap-2 items-center bg-muted/10">
          <button
            onClick={handleUp}
            className="p-1.5 hover:bg-accent rounded-md"
            title="Go Up"
            disabled={currentPath === "/"}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <Input
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadPath(currentPath)}
              className="h-8 text-sm font-mono"
            />
          </div>
          <button
            onClick={() =>
              fetch("/api/files/home")
                .then((r) => r.json())
                .then((d) => loadPath(d.path))
            }
            className="p-1.5 hover:bg-accent rounded-md"
            title="Go Home"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto p-2 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading...
            </div>
          ) : error ? (
            <div className="text-red-400 p-4 text-center">{error}</div>
          ) : (
            <div className="grid grid-cols-1 gap-0.5">
              {files
                .filter((f) => f.isDirectory)
                .map((file) => (
                  <div
                    key={file.path}
                    onClick={() => handleNavigate(file.path)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md transition-colors text-sm group"
                  >
                    <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                    <span className="truncate flex-1">{file.name}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-50" />
                  </div>
                ))}
              {files.filter((f) => !f.isDirectory).length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground px-2 mb-1 uppercase tracking-wider">
                    Files (Read Only)
                  </div>
                  {files
                    .filter((f) => !f.isDirectory)
                    .map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm cursor-default"
                      >
                        <File className="w-4 h-4" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                </div>
              )}
              {files.length === 0 && (
                <div className="text-center py-10 text-muted-foreground italic">
                  Empty Directory
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ensureGit}
              onChange={(e) => setEnsureGit(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
            />
            <GitGraph className="w-4 h-4" />
            Initialize Git Repository
          </label>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium"
            >
              <Check className="w-4 h-4" />
              Open This Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
