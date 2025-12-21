/**
 * Settings configuration panel.
 */
import { AgentSelector } from "./agent-selector";
import { ModelSelector } from "./model-selector";
import type { AgentOption } from "./types";
import type { ProviderOption } from "./model-data";

interface PanelSettingsProps {
  agents: AgentOption[];
  providers: ProviderOption[];
  modelDefaults: Record<string, string>;
  selectedAgent: string | null;
  selectedProviderId: string | null;
  selectedModelId: string | null;
  onAgentChange: (id: string | null) => void;
  onProviderChange: (id: string | null) => void;
  onModelChange: (id: string | null) => void;
}

export function PanelSettings({
  agents,
  providers,
  modelDefaults,
  selectedAgent,
  selectedProviderId,
  selectedModelId,
  onAgentChange,
  onProviderChange,
  onModelChange,
}: PanelSettingsProps) {
  return (
    <div className="p-4 bg-muted/10 border-b border-border space-y-4 animate-in slide-in-from-top-2 duration-200">
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Agent
        </label>
        <AgentSelector agents={agents} value={selectedAgent} onChange={onAgentChange} />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Model
        </label>
        <ModelSelector
          providers={providers}
          value={{ providerId: selectedProviderId, modelId: selectedModelId }}
          onChange={(value) => {
            onProviderChange(value.providerId);
            onModelChange(value.modelId);
            if (!value.providerId) return;
            const defaultModel = modelDefaults[value.providerId];
            if (defaultModel && !value.modelId) onModelChange(defaultModel);
          }}
        />
      </div>
    </div>
  );
}
