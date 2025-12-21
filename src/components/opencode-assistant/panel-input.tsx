/**
 * Input area for composing messages.
 */
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentSelector } from "./agent-selector";
import type { AgentOption } from "./types";
import type { ProviderOption } from "./model-data";

interface PanelInputProps {
  onSendMessage: (text: string) => void;
  isSending: boolean;
  disabled: boolean;
  agents: ReadonlyArray<AgentOption>;
  providers: ReadonlyArray<ProviderOption>;
  selectedAgent: string | null;
  selectedProviderId: string | null;
  selectedModelId: string | null;
  onAgentChange: (id: string | null) => void;
  onProviderChange: (id: string | null) => void;
  onModelChange: (id: string | null) => void;
}

export function PanelInput({
  onSendMessage,
  isSending,
  disabled,
  agents,
  providers,
  selectedAgent,
  selectedProviderId,
  selectedModelId,
  onAgentChange,
  onProviderChange,
  onModelChange,
}: PanelInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSend = () => {
    const text = prompt.trim();
    if (!text) return;
    onSendMessage(text);
    setPrompt("");
  };

  const activeProvider = providers.find((p) => p.id === selectedProviderId);
  const models = activeProvider?.models ?? [];

  return (
    <div className="p-4 border-t border-border bg-background">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask OpenCode..."
          className="min-h-[50px] max-h-[200px] pr-12 resize-none text-sm py-3"
        />
        <Button
          size="icon-sm"
          className="absolute right-2 bottom-2 h-7 w-7 rounded-full"
          onClick={handleSend}
          disabled={disabled || isSending || !prompt.trim()}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
      {/* Selectors Bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="w-[110px]">
          <AgentSelector agents={agents} value={selectedAgent} onChange={onAgentChange} />
        </div>
        <div className="w-[110px]">
          <Select
            value={selectedProviderId ?? ""}
            onValueChange={(val) => onProviderChange(val || null)}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[110px]">
          <Select
            value={selectedModelId ?? ""}
            onValueChange={(val) => onModelChange(val || null)}
            disabled={!selectedProviderId}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        {isSending && (
          <span className="text-[10px] text-muted-foreground animate-pulse">Thinking...</span>
        )}
      </div>
    </div>
  );
}
