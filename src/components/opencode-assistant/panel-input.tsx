/**
 * Input area for composing messages.
 */
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PanelInputProps {
  onSendMessage: (text: string) => void;
  isSending: boolean;
  disabled: boolean;
  agentLabel: string;
  modelLabel: string;
}

export function PanelInput({
  onSendMessage,
  isSending,
  disabled,
  agentLabel,
  modelLabel,
}: PanelInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSend = () => {
    const text = prompt.trim();
    if (!text) return;
    onSendMessage(text);
    setPrompt("");
  };

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
      {/* Info Bar */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground px-1">
        <div className="flex items-center gap-1">
          <span className="font-medium text-foreground/80">{agentLabel}</span>
          <span className="opacity-50">•</span>
          <span>{modelLabel}</span>
        </div>
        {isSending && <span className="animate-pulse">Thinking...</span>}
      </div>
    </div>
  );
}
