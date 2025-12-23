/**
 * Singleton manager for the Assistant SSE connection.
 * Multiplexes a single EventSource to multiple subscribers.
 */
import type { EventMessageUpdated, EventMessagePartUpdated } from "./types";

type AssistantEvent = EventMessageUpdated | EventMessagePartUpdated;
type AssistantEventHandler = (event: AssistantEvent) => void;

class AssistantEventManager {
  private es: EventSource | null = null;
  private listeners: Set<AssistantEventHandler> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private connect() {
    if (
      this.es?.readyState === EventSource.OPEN ||
      this.es?.readyState === EventSource.CONNECTING
    ) {
      return;
    }

    this.es = new EventSource("/api/opencode/assistant/events");

    this.es.addEventListener("message", this.handleMessage);
    this.es.addEventListener("error", this.handleError);
  }

  private disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.es) {
      this.es.removeEventListener("message", this.handleMessage);
      this.es.removeEventListener("error", this.handleError);
      this.es.close();
      this.es = null;
    }
  }

  private handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as { type: string };
      // Basic type validation could go here, but we trust the server mostly
      if (data.type === "message.updated" || data.type === "message.part.updated") {
        const typedEvent = data as AssistantEvent;
        this.listeners.forEach((listener) => listener(typedEvent));
      }
    } catch (err) {
      console.error("Failed to parse assistant event:", err);
    }
  };

  private handleError = () => {
    // EventSource usually handles reconnection, but if it closes, we might want to manually retry
    // or just let it be. For now, logging.
    console.warn("Assistant EventSource error.");
  };

  /**
   * Subscribe to global assistant events.
   * Returns an unsubscribe function.
   */
  public subscribe(handler: AssistantEventHandler): () => void {
    this.listeners.add(handler);

    if (this.listeners.size === 1) {
      this.connect();
    }

    return () => {
      this.listeners.delete(handler);
      if (this.listeners.size === 0) {
        // Debounce disconnection slightly to avoid thrashing on rapid unmount/remount
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          if (this.listeners.size === 0) {
            this.disconnect();
          }
        }, 1000);
      }
    };
  }
}

export const assistantEventManager = new AssistantEventManager();
