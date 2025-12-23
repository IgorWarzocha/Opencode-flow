import { useEffect, useState, useMemo } from "react";

import { PanelHeader } from "./panel-header";
import { PanelSettings } from "./panel-settings";
import { PanelHistory } from "./panel-history";
import { SessionView } from "./session-view";
import { useNewSessionDialog } from "./use-new-session-dialog";
import type { AssistantSession, AgentOption } from "./types";
import type { ProviderOption } from "./model-data";

interface OpenCodeAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Controlled State
  sessions: AssistantSession[];
  agents: AgentOption[];
  providers: ProviderOption[];
  modelDefaults: Record<string, string>;
  isLoadingSessions: boolean;
  activeSessionId: string | null;
  openSessionIds: string[];

  onSessionSelect: (id: string) => void;
  onSessionClose: (id: string) => void;
  onSessionCreate: (title: string, baseBranch?: string) => void;

  // Selection Props
  defaultAgentId: string | null;
  defaultProviderId: string | null;
  defaultModelId: string | null;
}

export function OpenCodeAssistantPanel({
  isOpen,
  onClose,
  sessions,
  agents,
  providers,
  modelDefaults,
  isLoadingSessions,
  activeSessionId,
  openSessionIds,
  onSessionSelect,
  onSessionCreate,
  defaultAgentId,
  defaultProviderId,
  defaultModelId,
}: OpenCodeAssistantPanelProps) {
  const {
    isOpen: isNewSessionOpen,
    openDialog: openNewSessionDialog,
    closeDialog: closeNewSessionDialog,
    handleCreate: handleCreateSession,
    NewSessionDialogComponent,
  } = useNewSessionDialog(async (title, baseBranch) => {
    onSessionCreate(title, baseBranch);
  });

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Initialize defaults once loaded
  useEffect(() => {
    if (defaultAgentId && !selectedAgent) setSelectedAgent(defaultAgentId);
  }, [defaultAgentId, selectedAgent]);

  useEffect(() => {
    if (defaultProviderId && !selectedProviderId) setSelectedProviderId(defaultProviderId);
    if (defaultModelId && !selectedModelId) setSelectedModelId(defaultModelId);
  }, [defaultProviderId, defaultModelId, selectedProviderId, selectedModelId]);

  // UI Toggles
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Computed
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  if (!isOpen) return null;

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      <PanelHeader
        activeSession={activeSession}
        showHistory={showHistory}
        showSettings={showSettings}
        onToggleHistory={() => {
          setShowHistory(!showHistory);
          setShowSettings(false);
        }}
        onToggleSettings={() => {
          setShowSettings(!showSettings);
          setShowHistory(false);
        }}
        onNewSession={openNewSessionDialog}
        onClose={onClose}
      />

      <NewSessionDialogComponent
        isOpen={isNewSessionOpen}
        onClose={closeNewSessionDialog}
        onCreate={handleCreateSession}
      />

      {showSettings && (
        <PanelSettings
          agents={agents}
          providers={providers}
          modelDefaults={modelDefaults}
          selectedAgent={selectedAgent}
          selectedProviderId={selectedProviderId}
          selectedModelId={selectedModelId}
          onAgentChange={setSelectedAgent}
          onProviderChange={setSelectedProviderId}
          onModelChange={setSelectedModelId}
        />
      )}

      {showHistory && (
        <PanelHistory
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoading={isLoadingSessions}
          onSelectSession={(id) => {
            onSessionSelect(id);
            setShowHistory(false);
          }}
        />
      )}

      {/* Content Area - Render all open sessions (hidden if inactive) */}
      <div className="flex-1 overflow-hidden relative">
        {openSessionIds.length === 0 && !showHistory && !showSettings && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
            <p>No open sessions.</p>
            <button
              onClick={() => setShowHistory(true)}
              className="text-primary hover:underline mt-2"
            >
              Open from History
            </button>
            <button onClick={openNewSessionDialog} className="text-primary hover:underline mt-2">
              Start New Chat
            </button>
          </div>
        )}

        {openSessionIds.map((sessionId) => (
          <SessionView
            key={sessionId}
            sessionId={sessionId}
            isActive={sessionId === activeSessionId}
            agents={agents}
            providers={providers}
            selectedAgent={selectedAgent}
            selectedProviderId={selectedProviderId}
            selectedModelId={selectedModelId}
            onAgentChange={setSelectedAgent}
            onProviderChange={setSelectedProviderId}
            onModelChange={setSelectedModelId}
          />
        ))}
      </div>
    </div>
  );
}
