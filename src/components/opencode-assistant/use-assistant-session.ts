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

    const handleMessageUpdated = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as EventMessageUpdated;
        if (data.type !== "message.updated") return;

        const info = data.properties.info;
        if (info.sessionID !== activeSessionIdRef.current) return;

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === info.id);
          if (exists) {
            return prev.map((m) =>
              m.id === info.id
                ? {
                    ...m,
                    completedAt: info.time.completed ?? m.completedAt,
                    role: info.role,
                  }
                : m,
            );
          }

          const newMessage: AssistantMessage = {
            id: info.id,
            role: info.role,
            text: "",
            createdAt: info.time.created,
            completedAt: info.time.completed ?? null,
            parts: [],
          };
          return [...prev, newMessage];
        });

        if (info.role === "assistant") {
          setIsSending(false);
        }
      } catch {
        /* ignore */
      }
    };

    const handleMessagePartUpdated = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as EventMessagePartUpdated;
        if (data.type !== "message.part.updated") return;

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
            newParts.push(newPart);
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
      } catch {
        /* ignore */
      }
    };

    es.addEventListener("message.updated", handleMessageUpdated);
    es.addEventListener("message.part.updated", handleMessagePartUpdated);

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
