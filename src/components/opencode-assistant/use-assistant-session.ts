/**
 * Hook for managing the live Assistant conversation (SSE + Messages).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import type {
  AssistantMessage,
  AssistantPart,
  EventMessageUpdated,
  EventMessagePartUpdated,
} from "./types";

export function useAssistantSession(activeSessionId: string | null) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Load initial messages when session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    let mounted = true;
    const load = async () => {
      setIsLoadingMessages(true);
      setError(null);
      try {
        const res = await fetch(`/api/opencode/assistant/sessions/${activeSessionId}/messages`);
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as AssistantMessage[];
        if (mounted) setMessages(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        if (mounted) setIsLoadingMessages(false);
      }
    };
    void load();

    return () => {
      mounted = false;
    };
  }, [activeSessionId]);

  // SSE Event Listener
  useEffect(() => {
    const es = new EventSource("/api/opencode/assistant/events");

    const handleMessageUpdated = (data: EventMessageUpdated) => {
      const info = data.properties.info;
      if (info.sessionID !== activeSessionIdRef.current) return;

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === info.id);
        if (exists) {
          return prev.map((m) => {
            if (m.id !== info.id) return m;
            const updated: AssistantMessage = {
              ...m,
              completedAt: info.time.completed ?? m.completedAt,
              role: info.role,
            };
            if (info.agent) updated.agent = info.agent;
            else if (m.agent) updated.agent = m.agent;

            if (info.model) {
              updated.model = info.model;
            } else if (
              info.role === "assistant" &&
              typeof info.providerID === "string" &&
              typeof info.modelID === "string"
            ) {
              updated.model = { providerID: info.providerID, modelID: info.modelID };
            } else if (m.model) {
              updated.model = m.model;
            }
            return updated;
          });
        }

        // Check for an optimistic message to replace (only for user messages)
        if (info.role === "user") {
          // Find the oldest local message to replace.
          const optimisticMatch = prev.find((m) => m.id.startsWith("local-"));

          if (optimisticMatch) {
            return prev.map((m) => {
              if (m.id !== optimisticMatch.id) return m;
              const updated: AssistantMessage = {
                ...m,
                id: info.id, // Update to real ID
                createdAt: info.time.created,
                completedAt: info.time.completed ?? m.completedAt,
              };
              if (info.agent) updated.agent = info.agent;
              if (info.model) updated.model = info.model;
              return updated;
            });
          }
        }

        const newMessage: AssistantMessage = {
          id: info.id,
          role: info.role,
          text: "",
          createdAt: info.time.created,
          completedAt: info.time.completed ?? null,
          parts: [],
        };
        if (info.agent) newMessage.agent = info.agent;
        if (info.model) {
          newMessage.model = info.model;
        } else if (
          info.role === "assistant" &&
          typeof info.providerID === "string" &&
          typeof info.modelID === "string"
        ) {
          newMessage.model = { providerID: info.providerID, modelID: info.modelID };
        }

        return [...prev, newMessage];
      });

      if (info.role === "assistant") {
        setIsSending(false);
      }
    };

    const handleMessagePartUpdated = (data: EventMessagePartUpdated) => {
      const { part, delta } = data.properties;
      if (part.sessionID !== activeSessionIdRef.current) return;

      setMessages((prev) => {
        const messageIndex = prev.findIndex((m) => m.id === part.messageID);
        if (messageIndex === -1) return prev;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const message = prev[messageIndex]!;
        const newParts = [...message.parts];
        const partIndex = newParts.findIndex((p) => p.id === part.id);

        if (partIndex === -1) {
          const newPart: AssistantPart = {
            ...part,
            id: part.id,
            type: part.type,
            text: part.text ?? "",
          };

          // Check for optimistic parts to replace
          const optimisticPartIndex = newParts.findIndex((p) => p.id.startsWith("part-local-"));

          if (optimisticPartIndex !== -1) {
            newParts[optimisticPartIndex] = newPart;
          } else {
            newParts.push(newPart);
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const existingPart = newParts[partIndex]!;
          if (delta) {
            if (part.type === "text" || part.type === "reasoning") {
              newParts[partIndex] = {
                ...existingPart,
                text: (existingPart.text || "") + delta,
              };
            }
          } else {
            newParts[partIndex] = {
              ...existingPart,
              ...part,
              text: part.text ?? existingPart.text ?? "",
            };
          }
        }

        const updatedMessage: AssistantMessage = { ...message, parts: newParts };
        const newMessages = [...prev];
        newMessages[messageIndex] = updatedMessage;
        return newMessages;
      });
    };

    const handleEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as { type: string };
        switch (data.type) {
          case "message.updated":
            handleMessageUpdated(data as unknown as EventMessageUpdated);
            break;
          case "message.part.updated":
            handleMessagePartUpdated(data as unknown as EventMessagePartUpdated);
            break;
        }
      } catch {
        /* ignore */
      }
    };

    es.addEventListener("message", handleEvent);

    return () => {
      es.close();
    };
  }, []);

  const sendMessage = useCallback(
    async (
      text: string,
      options?: { agent?: string; model?: { providerID: string; modelID: string } },
    ) => {
      if (!activeSessionId) return;

      setIsSending(true);
      setError(null);

      // Optimistic message
      const optimisticId = `local-${Date.now()}`;
      const optimisticMessage: AssistantMessage = {
        id: optimisticId,
        role: "user",
        text,
        createdAt: Date.now(),
        completedAt: null,
        parts: [{ id: `part-${optimisticId}`, type: "text", text }],
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const res = await fetch(`/api/opencode/assistant/sessions/${activeSessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            agent: options?.agent,
            model: options?.model,
          }),
        });

        if (!res.ok) {
          const msg = await res.text();
          setError(msg || "Failed to send message");
          setIsSending(false);
          // Remove optimistic message on error?
          // For now, leave it or user loses text.
        } else {
          try {
            const savedMessage = (await res.json()) as AssistantMessage;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === optimisticId
                  ? {
                      ...savedMessage,
                      parts: savedMessage.parts?.length ? savedMessage.parts : m.parts,
                    }
                  : m,
              ),
            );
          } catch {
            // Ignore JSON parse error if any, or strict type issues
          }
        }
      } catch {
        setError("Network error sending message");
        setIsSending(false);
      }
    },
    [activeSessionId],
  );

  return {
    messages,
    isLoadingMessages,
    isSending,
    error,
    sendMessage,
  };
}
