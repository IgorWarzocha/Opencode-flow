import { useState, useCallback } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { Terminal } from "./terminal";
import { cn } from "../../lib/utils";

interface TerminalSession {
  id: string;
  title: string;
  isExpanded: boolean;
}

export function TerminalSidebar({ className }: { className?: string }) {
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: crypto.randomUUID(), title: "Terminal", isExpanded: true },
  ]);

  const addSession = () => {
    setSessions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "Terminal", isExpanded: true },
    ]);
  };

  const removeSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSession = (id: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, isExpanded: !s.isExpanded } : s)));
  };

  const updateTitle = useCallback((id: string, title: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }, []);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/20 shrink-0">
        <span className="text-sm font-medium pl-2">Terminals</span>
        <button
          onClick={addSession}
          className="p-1 hover:bg-accent rounded-md transition-colors"
          title="New Terminal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <div key={session.id} className="border-b border-border/50">
            <div
              className={cn(
                "flex items-center justify-between p-2 cursor-pointer hover:bg-accent/50 transition-colors group",
                session.isExpanded && "bg-accent/30",
              )}
              onClick={() => toggleSession(session.id)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {session.isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs font-mono truncate" title={session.title}>
                  {session.title}
                </span>
              </div>
              <button
                onClick={(e) => removeSession(session.id, e)}
                className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {session.isExpanded && (
              <div className="h-64 border-t border-border/50 bg-black">
                <TerminalWrapper
                  sessionId={session.id}
                  onTitleChange={(t) => updateTitle(session.id, t)}
                />
              </div>
            )}
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No active terminals.
            <br />
            Click + to start one.
          </div>
        )}
      </div>
    </div>
  );
}

function TerminalWrapper({
  sessionId,
  onTitleChange,
}: {
  sessionId: string;
  onTitleChange: (title: string) => void;
}) {
  return <Terminal sessionId={sessionId} onFirstLine={onTitleChange} />;
}
