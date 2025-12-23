/**
 * SessionView encapsulates the Chat and Input for a single session.
 * It manages its own message state via useAssistantSession, allowing
 * background updates when hidden (tabbed out).
 */
import { memo } from "react";
import { useAssistantSession } from "./use-assistant-session";
import { PanelChat } from "./panel-chat";
import { PanelInput } from "./panel-input";
import type { ProviderOption } from "./model-data";
import type { AgentOption } from "./types";

interface SessionViewProps {
  sessionId: string;
  isActive: boolean;
  agents: AgentOption[];
  providers: ProviderOption[];
  selectedAgent: string | null;
  selectedProviderId: string | null;
  selectedModelId: string | null;
  onAgentChange: (id: string | null) => void;
  onProviderChange: (id: string | null) => void;
  onModelChange: (id: string | null) => void;
}

export const SessionView = memo(function SessionView({
  sessionId,
  isActive,
  agents,
  providers,
  selectedAgent,
  selectedProviderId,
  selectedModelId,
  onAgentChange,
  onProviderChange,
  onModelChange,
}: SessionViewProps) {
  const { messages, isLoadingMessages, isSending, error, sendMessage } =
    useAssistantSession(sessionId);

  return (
    <div className="flex flex-col h-full w-full" style={{ display: isActive ? "flex" : "none" }}>
      <PanelChat messages={messages} isLoading={isLoadingMessages} error={error} agents={agents} />

      <PanelInput
        onSendMessage={(text) => {
          const model =
            selectedProviderId && selectedModelId
              ? { providerID: selectedProviderId, modelID: selectedModelId }
              : undefined;

          const options: {
            agent?: string;
            model?: { providerID: string; modelID: string };
          } = {};
          if (selectedAgent) options.agent = selectedAgent;
          if (model) options.model = model;

          void sendMessage(text, options);
        }}
        isSending={isSending}
        disabled={false}
        agents={agents}
        providers={providers}
        selectedAgent={selectedAgent}
        selectedProviderId={selectedProviderId}
        selectedModelId={selectedModelId}
        onAgentChange={onAgentChange}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
      />
    </div>
  );
});
