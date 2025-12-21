/**
 * OpenCodeAssistantPanel renders a live session timeline and prompt composer.
 * It talks to the backend assistant endpoints that proxy opencode serve.
 */
"use client";

import { useEffect, useState, useMemo } from "react";

import { useAssistantData } from "./use-assistant-data";
import { useAssistantSession } from "./use-assistant-session";

import { PanelHeader } from "./panel-header";
import { PanelSettings } from "./panel-settings";
import { PanelHistory } from "./panel-history";
import { PanelChat } from "./panel-chat";
import { PanelInput } from "./panel-input";

interface OpenCodeAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpenCodeAssistantPanel({ isOpen, onClose }: OpenCodeAssistantPanelProps) {
  // Data Hooks
  const {
    sessions,
    agents,
    providers,
    modelDefaults,
    isLoadingSessions,
    defaultAgentId,
    defaultProviderId,
    defaultModelId,
    loadAgents,
    loadModels,
    loadSessions,
    createSession,
  } = useAssistantData();

  // Local Selection State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
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

  // Set initial active session
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0]?.id ?? null);
    }
  }, [sessions, activeSessionId]);

  // Session Logic (SSE + Messages)
  const {
    messages,
    isLoadingMessages,
    isSending,
    error: sessionError,
    sendMessage,
  } = useAssistantSession(activeSessionId);

  // UI Toggles
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Computed
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  const currentAgentLabel = selectedAgent
    ? agents.find((a) => a.id === selectedAgent)?.label
    : "Auto";

  // Effects to load data on open
  useEffect(() => {
    if (!isOpen) return;
    void loadSessions();
    void loadAgents();
    void loadModels();
  }, [isOpen, loadSessions, loadAgents, loadModels]);

  if (!isOpen) return null;

  return (
    <div className="h-full w-full flex flex-col bg-background">
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
        onClose={onClose}
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
          onCreateSession={(title) => {
            void createSession(title).then((session) => {
              setActiveSessionId(session.id);
              setShowHistory(false);
            });
          }}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setShowHistory(false);
          }}
        />
      )}

      <PanelChat messages={messages} isLoading={isLoadingMessages} error={sessionError} />

      <PanelInput
        onSendMessage={(text) => {
          const model =
            selectedProviderId && selectedModelId
              ? { providerID: selectedProviderId, modelID: selectedModelId }
              : undefined;

          const options: { agent?: string; model?: { providerID: string; modelID: string } } = {};
          if (selectedAgent) options.agent = selectedAgent;
          if (model) options.model = model;

          void sendMessage(text, options);
        }}
        isSending={isSending}
        disabled={!activeSessionId}
        agentLabel={currentAgentLabel ?? "Auto"}
        modelLabel={selectedModelId || "Default Model"}
      />
    </div>
  );
}
