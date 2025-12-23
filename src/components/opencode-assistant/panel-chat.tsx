/**
 * Chat area rendering messages.
 */
import { Send, Bot } from "lucide-react";
import { PartRenderer } from "./part-renderer";
import type { AssistantMessage, AgentOption } from "./types";

interface PanelChatProps {
  messages: AssistantMessage[];
  isLoading: boolean;
  error: string | null;
  agents?: AgentOption[];
}

const formatTime = (value: number) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getAgentLabel = (id: string, agents?: AgentOption[]) => {
  const agent = agents?.find((a) => a.id === id);
  let label = agent?.label ?? id;
  // Clean up noisy suffixes that might be present in the registry labels
  return label
    .replace(/\s*\(primary\)/i, "")
    .replace(/\s*\(subagent\)/i, "")
    .replace(/\s*\(model\)/i, "")
    .trim();
};

export function PanelChat({ messages, isLoading, error, agents }: PanelChatProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
      {isLoading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 opacity-50">
          <Send className="w-8 h-8" />
          <p className="text-sm">Start a conversation</p>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex flex-col gap-1 ${message.role === "user" ? "items-end" : "items-start"}`}
        >
          {message.role === "assistant" && (
            <div className="flex items-center gap-2 px-1 text-xs mb-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Bot className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {message.agent ? getAgentLabel(message.agent, agents) : "Assistant"}
                </span>
              </div>
              {message.model && (
                <div className="flex items-center px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground/80 border border-border/40">
                  {message.model.modelID}
                </div>
              )}
            </div>
          )}
          <div
            className={`px-4 py-3 rounded-2xl max-w-[90%] text-sm ${
              message.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-none"
                : "bg-muted/50 border border-border/50 text-foreground rounded-bl-none"
            }`}
          >
            {message.parts.length === 0 &&
              (typeof message.text === "string"
                ? message.text
                : JSON.stringify(message.text || ""))}
            {message.parts.length > 0 && (
              <div className="space-y-2">
                {message.parts.map((part) => (
                  <PartRenderer key={part.id} part={part} message={message} />
                ))}
              </div>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground px-1">
            {formatTime(message.createdAt)}
          </span>
        </div>
      ))}
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20">
          {error}
        </div>
      )}
    </div>
  );
}
