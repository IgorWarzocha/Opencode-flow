/**
 * File Browser component for navigating the project structure.
 * Uses the /api/files endpoints to recursively fetch directories.
 */
import { useState, useEffect } from "react";
import { Folder, FileCode, ChevronRight, ChevronDown, RefreshCw } from "lucide-react";

interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface FileBrowserProps {
  onFileSelect: (path: string, content: string) => void;
  className?: string;
}

export function FileBrowser({ onFileSelect, className }: FileBrowserProps) {
  const [rootPath, setRootPath] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/files/root")
      .then((r) => r.json())
      .then((d) => setRootPath(d.path))
      .catch(console.error);
  }, []);

  const reload = () => setRefreshKey((prev) => prev + 1);

  return (
    <div className={`flex flex-col h-full bg-background border-r border-border ${className}`}>
      <div className="p-2 border-b border-border flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explorer
          </span>
          <button
            onClick={reload}
            className="p-1 hover:bg-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div className="text-xs text-muted-foreground font-mono truncate px-1" title={rootPath}>
          {rootPath}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2 scrollbar-thin">
        <FileTreeItem
          key={refreshKey} // Force remount on refresh
          path="."
          name="Root"
          isDirectory={true}
          onFileSelect={onFileSelect}
          defaultOpen={true}
        />
      </div>
    </div>
  );
}

function FileTreeItem({
  path,
  name,
  isDirectory,
  onFileSelect,
  defaultOpen = false,
}: {
  path: string;
  name: string;
  isDirectory: boolean;
  onFileSelect: (path: string, content: string) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [children, setChildren] = useState<FileEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!isDirectory) {
      // Load file
      try {
        const res = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error("Failed to load file");
        const text = await res.text();
        onFileSelect(path, text);
      } catch (e) {
        console.error("Failed to load file", e);
        alert("Failed to load file content");
      }
      return;
    }

    // Toggle directory
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (!children && nextState) {
      loadChildren();
    }
  };

  const loadChildren = async () => {
    setLoading(true);
    try {
      const queryPath = path === "." ? "" : path;
      const res = await fetch(`/api/files?path=${encodeURIComponent(queryPath)}`);
      const data = await res.json();
      setChildren(data.files);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load children if defaultOpen (root)
  useEffect(() => {
    if (defaultOpen && isDirectory && !children) {
      loadChildren();
    }
  }, [defaultOpen, isDirectory, children]);

  return (
    <div className="pl-2">
      <div
        className="flex items-center gap-1 py-1 px-1 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer text-sm select-none transition-colors"
        onClick={toggle}
      >
        {isDirectory ? (
          isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {isDirectory ? (
          <Folder className="w-4 h-4 text-blue-400 shrink-0" />
        ) : (
          <FileCode className="w-4 h-4 text-zinc-400 shrink-0" />
        )}
        <span className="truncate">{name}</span>
      </div>
      {isDirectory && isOpen && (
        <div className="border-l border-border ml-2.5 pl-0.5">
          {loading && <div className="pl-6 text-xs text-muted-foreground py-1">Loading...</div>}
          {children?.map((child) => (
            <FileTreeItem
              key={child.path}
              path={child.path}
              name={child.name}
              isDirectory={child.isDirectory}
              onFileSelect={onFileSelect}
            />
          ))}
          {children && children.length === 0 && !loading && (
            <div className="pl-6 text-xs text-muted-foreground py-1 italic">Empty</div>
          )}
        </div>
      )}
    </div>
  );
}
