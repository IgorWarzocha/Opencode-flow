/**
 * Header component for the OpenCode Assistant Panel.
 */
import { History, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssistantSession } from "./types";

interface PanelHeaderProps {
  activeSession: AssistantSession | null;
  showHistory: boolean;
  showSettings: boolean;
  onToggleHistory: () => void;
  onToggleSettings: () => void;
  onNewSession: () => void;
  onClose: () => void;
}

export function PanelHeader({
  activeSession,
  showHistory,
  showSettings,
  onToggleHistory,
  onToggleSettings,
  onNewSession,
  onClose,
}: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-muted/20">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="font-bold text-sm shrink-0">OpenCode</span>
        {activeSession && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-xs text-muted-foreground truncate" title={activeSession.title}>
              {activeSession.title}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNewSession}
          title="New Session"
          className="h-7 w-7"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant={showHistory ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={onToggleHistory}
          title="Session History"
          className="h-7 w-7"
        >
          <History className="w-4 h-4" />
        </Button>
        <Button
          variant={showSettings ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={onToggleSettings}
          title="Configuration"
          className="h-7 w-7"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="h-7 w-7 ml-1">
          ✕
        </Button>
      </div>
    </div>
  );
}
