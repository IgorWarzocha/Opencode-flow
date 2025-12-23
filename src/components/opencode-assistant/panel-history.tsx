/**
 * History panel for managing sessions.
 */
import type { AssistantSession } from "./types";

interface PanelHistoryProps {
  sessions: AssistantSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (id: string) => void;
}

const formatTime = (value: number) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function PanelHistory({
  sessions,
  activeSessionId,
  isLoading,
  onSelectSession,
}: PanelHistoryProps) {
  return (
    <div className="p-4 bg-muted/10 border-b border-border space-y-3 animate-in slide-in-from-top-2 duration-200 flex flex-col max-h-[40%]">
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {isLoading && <p className="text-xs text-muted-foreground p-2">Loading sessions...</p>}
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between group transition-colors ${
              session.id === activeSessionId
                ? "bg-primary/10 text-primary"
                : "hover:bg-background/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="truncate font-medium">{session.title}</span>
            <span className="text-[10px] opacity-50">{formatTime(session.updatedAt)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
