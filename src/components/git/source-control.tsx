import { useState, useEffect } from "react";
import { GitCommit, RefreshCw, Upload, Download, Plus, Loader2, GitGraph } from "lucide-react";
// import { cn } from "@/lib/utils";

interface GitFileStatus {
  path: string;
  status: string;
}

interface SourceControlProps {
  className?: string;
  onFileSelect?: (path: string) => void;
}

export function SourceControl({ className }: SourceControlProps) {
  const [status, setStatus] = useState<GitFileStatus[]>([]);
  const [branch, setBranch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/git/status");
      if (!res.ok) throw new Error("Failed to fetch git status");
      const data = await res.json();
      setStatus(data.files);
      setBranch(data.branch || "HEAD");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStage = async (path: string) => {
    try {
      const res = await fetch("/api/git/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [path] }),
      });
      if (!res.ok) throw new Error("Failed to stage file");
      fetchData(); // Refresh
    } catch (error) {
      console.error(error);
      alert("Failed to stage file");
    }
  };

  const handleCommit = async () => {
    if (!commitMsg.trim()) return;
    setIsCommitting(true);
    try {
      const res = await fetch("/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commitMsg }),
      });
      if (!res.ok) throw new Error("Failed to commit");
      setCommitMsg("");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to commit");
    } finally {
      setIsCommitting(false);
    }
  };

  const handleSync = async (action: "push" | "pull") => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/git/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert(`Failed to ${action}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const stagedFiles = status.filter((f) => f.status[0] !== " " && f.status[0] !== "?");
  const unstagedFiles = status.filter((f) => f.status[1] !== " " || f.status === "??");

  return (
    <div className={`flex flex-col h-full bg-background border-r border-border ${className || ""}`}>
      {/* Header */}
      <div className="p-2 border-b border-border flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <GitGraph className="w-3 h-3" /> Source Control
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSync("pull")}
              disabled={isSyncing}
              className="p-1 hover:bg-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Pull"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleSync("push")}
              disabled={isSyncing}
              className="p-1 hover:bg-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Push"
            >
              <Upload className="w-3 h-3" />
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1 hover:bg-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-mono truncate px-1 flex items-center gap-1">
          Branch: <span className="text-foreground">{branch}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 flex flex-col gap-4 scrollbar-thin">
        {/* Commit Input */}
        <div className="flex flex-col gap-2">
          <textarea
            className="w-full h-20 bg-background border border-input rounded-md p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Commit message..."
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            disabled={isCommitting}
          />
          <button
            onClick={handleCommit}
            disabled={isCommitting || stagedFiles.length === 0 || !commitMsg.trim()}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCommitting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <GitCommit className="w-3 h-3" />
            )}
            Commit
          </button>
        </div>

        {/* Staged Changes */}
        {stagedFiles.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Staged Changes ({stagedFiles.length})
            </div>
            <div className="flex flex-col">
              {stagedFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between py-1 px-2 hover:bg-accent hover:text-accent-foreground rounded-sm group text-xs"
                >
                  <span className="truncate flex-1 font-mono" title={file.path}>
                    {file.path}
                  </span>
                  <span className="text-[10px] text-muted-foreground w-4 text-center">
                    {file.status[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Changes */}
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex justify-between items-center">
            <span>Changes ({unstagedFiles.length})</span>
          </div>
          <div className="flex flex-col">
            {unstagedFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between py-1 px-2 hover:bg-accent hover:text-accent-foreground rounded-sm group text-xs"
              >
                <span className="truncate flex-1 font-mono" title={file.path}>
                  {file.path}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-4 text-center">
                    {file.status === "??" ? "U" : file.status[1]}
                  </span>
                  <button
                    onClick={() => handleStage(file.path)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-background rounded-sm transition-opacity"
                    title="Stage Changes"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {unstagedFiles.length === 0 && stagedFiles.length === 0 && (
              <div className="text-xs text-muted-foreground px-2 italic">No changes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
