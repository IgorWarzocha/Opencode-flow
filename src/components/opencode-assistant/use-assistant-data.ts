/**
 * Hooks for managing Assistant data (Sessions, Agents, Models).
 */
import { useState, useCallback } from "react";
import { normalizeProviders, type ProvidersPayload, type ProviderOption } from "./model-data";
import type { AgentOption, AssistantSession } from "./types";

export function useAssistantData() {
  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [modelDefaults, setModelDefaults] = useState<Record<string, string>>({});

  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Defaults for selection logic
  const [defaultAgentId, setDefaultAgentId] = useState<string | null>(null);
  const [defaultProviderId, setDefaultProviderId] = useState<string | null>(null);
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/opencode/assistant/agents");
      if (!res.ok) return;

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
      if (mapped.length > 0) {
        setDefaultAgentId(mapped[0]?.id ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadModels = useCallback(async () => {
    try {
      const res = await fetch("/api/opencode/assistant/models");
      if (!res.ok) return;

      const payload = (await res.json()) as ProvidersPayload;
      const normalized = normalizeProviders(payload);
      setProviders(normalized.providers);
      setModelDefaults(normalized.defaults);

      if (normalized.providers.length > 0) {
        const defProv = Object.keys(normalized.defaults)[0];
        const provId = defProv || normalized.providers[0]?.id || null;
        setDefaultProviderId(provId);
        if (provId) {
          const defModel = normalized.defaults[provId];
          if (defModel) setDefaultModelId(defModel);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setError(null);
    try {
      const res = await fetch("/api/opencode/assistant/sessions");
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to load sessions");
      }
      const data = (await res.json()) as AssistantSession[];
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const createSession = useCallback(async (title: string) => {
    const res = await fetch("/api/opencode/assistant/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.length ? title : undefined }),
    });

    if (!res.ok) {
      throw new Error((await res.text()) || "Failed to create session");
    }

    const created = (await res.json()) as AssistantSession;
    setSessions((prev) => [created, ...prev]);
    return created;
  }, []);

  return {
    sessions,
    agents,
    providers,
    modelDefaults,
    isLoadingSessions,
    error,
    defaultAgentId,
    defaultProviderId,
    defaultModelId,
    loadAgents,
    loadModels,
    loadSessions,
    createSession,
    setSessions, // exposed for optimistic updates or reordering if needed
  };
}
