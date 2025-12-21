/**
 * OpenCodeAssistantPanel renders a live session timeline and prompt composer.
 * It talks to the backend assistant endpoints that proxy opencode serve.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Plus, Send } from "lucide-react";

import { PartRenderer } from "./part-renderer";
import { AgentSelector } from "./agent-selector";
import { ModelSelector } from "./model-selector";
import { normalizeProviders, type ProvidersPayload, type ProviderOption } from "./model-data";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AssistantSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

type AssistantMessage = {
  id: string;
  role: string;
  text: string;
  createdAt: number;
  completedAt: number | null;
  parts: ReadonlyArray<Record<string, unknown>>;
};

type AgentOption = {
  id: string;
  label: string;
};

interface OpenCodeAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (value: number) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString();
};

export function OpenCodeAssistantPanel({ isOpen, onClose }: OpenCodeAssistantPanelProps) {
  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [modelDefaults, setModelDefaults] = useState<Record<string, string>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  const loadAgents = useCallback(async () => {
    const res = await fetch("/api/opencode/assistant/agents");
    if (!res.ok) {
      return;
    }

    const data = (await res.json()) as ReadonlyArray<Record<string, unknown>>;
    const mapped: AgentOption[] = data
      .map((agent) => {
        const id = typeof agent.name === "string" ? agent.name : "unknown";
        const mode = typeof agent.mode === "string" ? agent.mode : "";
        const label = mode ? `${id} (${mode})` : id;
        return { id, label };
      })
      .filter((agent) => agent.id !== "unknown");

    setAgents(mapped);
    if (!selectedAgent && mapped.length > 0) {
      setSelectedAgent(mapped[0]?.id ?? null);
    }
  }, [selectedAgent]);

  const loadModels = useCallback(async () => {
    const res = await fetch("/api/opencode/assistant/models");
    if (!res.ok) {
      return;
    }

    const payload = (await res.json()) as ProvidersPayload;
    const normalized = normalizeProviders(payload);
    setProviders(normalized.providers);
    setModelDefaults(normalized.defaults);

    if (!selectedProviderId && normalized.providers.length > 0) {
      const defaultProvider = Object.keys(normalized.defaults)[0];
      const providerId = defaultProvider || normalized.providers[0]?.id || null;
      setSelectedProviderId(providerId);
      if (providerId) {
        const defaultModel = normalized.defaults[providerId];
        if (defaultModel) setSelectedModelId(defaultModel);
      }
    }
  }, [selectedProviderId]);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setError(null);

    const res = await fetch("/api/opencode/assistant/sessions");
    if (!res.ok) {
      const message = await res.text();
      setError(message || "Failed to load OpenCode sessions.");
      setIsLoadingSessions(false);
      return;
    }

    const data = (await res.json()) as AssistantSession[];
    setSessions(data);
    if (!data.find((session) => session.id === activeSessionId)) {
      setActiveSessionId(data[0]?.id ?? null);
    }
    setIsLoadingSessions(false);
  }, [activeSessionId]);

  const loadMessages = useCallback(async (sessionId: string) => {
    setIsLoadingMessages(true);
    setError(null);

    const res = await fetch(`/api/opencode/assistant/sessions/${sessionId}/messages`);
    if (!res.ok) {
      const message = await res.text();
      setError(message || "Failed to load OpenCode messages.");
      setIsLoadingMessages(false);
      return;
    }

    const data = (await res.json()) as AssistantMessage[];
    setMessages(data);
    setIsLoadingMessages(false);
  }, []);

  const handleCreateSession = async () => {
    const title = sessionTitle.trim();
    setError(null);

    const res = await fetch("/api/opencode/assistant/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.length ? title : undefined }),
    });

    if (!res.ok) {
      const message = await res.text();
      setError(message || "Failed to create OpenCode session.");
      return;
    }

    const created = (await res.json()) as AssistantSession;
    setSessions((prev) => [created, ...prev]);
    setActiveSessionId(created.id);
    setSessionTitle("");
  };

  const handleSendMessage = async () => {
    if (!activeSessionId) return;
    const text = prompt.trim();
    if (!text) return;

    setIsSending(true);
    setError(null);

    const optimisticMessage: AssistantMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      text,
      createdAt: Date.now(),
      completedAt: null,
      parts: [{ type: "text", text }],
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setPrompt("");

    const model =
      selectedProviderId && selectedModelId
        ? { providerID: selectedProviderId, modelID: selectedModelId }
        : undefined;

    const res = await fetch(`/api/opencode/assistant/sessions/${activeSessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        agent: selectedAgent ?? undefined,
        model,
      }),
    });

    if (!res.ok) {
      const message = await res.text();
      setError(message || "Failed to send message.");
      setIsSending(false);
      return;
    }

    const reply = (await res.json()) as AssistantMessage;
    setMessages((prev) => [...prev, reply]);
    setIsSending(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    void loadSessions();
    void loadAgents();
    void loadModels();
  }, [isOpen, loadSessions, loadAgents, loadModels]);

  useEffect(() => {
    if (!isOpen) return;
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    void loadMessages(activeSessionId);
  }, [isOpen, activeSessionId, loadMessages]);

  if (!isOpen) return null;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">OpenCode Assistant</span>
          <span className="text-xs text-muted-foreground">Scoped to the active workspace</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={loadSessions}
            disabled={isLoadingSessions}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSessions ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close OpenCode panel"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="p-3 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <Select value={activeSessionId ?? ""} onValueChange={setActiveSessionId}>
            <SelectTrigger className="w-full" size="sm">
              <SelectValue placeholder="Select a session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={sessionTitle}
            onChange={(event) => setSessionTitle(event.target.value)}
            placeholder="New session title"
            className="h-8 text-xs"
          />
          <Button size="icon-sm" variant="secondary" onClick={handleCreateSession}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <AgentSelector agents={agents} value={selectedAgent} onChange={setSelectedAgent} />
        <ModelSelector
          providers={providers}
          value={{ providerId: selectedProviderId, modelId: selectedModelId }}
          onChange={(value) => {
            setSelectedProviderId(value.providerId);
            setSelectedModelId(value.modelId);
            if (!value.providerId) return;
            const defaultModel = modelDefaults[value.providerId];
            if (defaultModel && !value.modelId) setSelectedModelId(defaultModel);
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {activeSession && (
          <p className="text-[11px] text-muted-foreground">
            Updated {formatTime(activeSession.updatedAt)}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoadingMessages && <p className="text-xs text-muted-foreground">Loading messages...</p>}
        {!isLoadingMessages && messages.length === 0 && (
          <p className="text-xs text-muted-foreground">No messages yet. Start the conversation.</p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg border px-3 py-2 text-xs whitespace-pre-wrap ${
              message.role === "user"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-card border-border text-foreground"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
              <span className="uppercase">{message.role}</span>
              <span>{formatTime(message.createdAt)}</span>
            </div>
            {message.parts.length === 0 && (message.text || "(no text)")}
            {message.parts.length > 0 && (
              <div className="space-y-2">
                {message.parts.map((part, index) => (
                  <PartRenderer key={`${message.id}-${index}`} part={part} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3 space-y-2">
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Send a prompt to OpenCode"
          className="min-h-[80px] text-xs"
        />
        <Button
          className="w-full"
          onClick={handleSendMessage}
          disabled={isSending || !activeSessionId}
        >
          <Send className="w-4 h-4 mr-2" />
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
