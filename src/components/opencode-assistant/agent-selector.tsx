/**
 * Agent selector renders the available agent list for OpenCode prompts.
 * It isolates agent selection UI from the main assistant panel.
 */
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AgentOption = {
  id: string;
  label: string;
};

type AgentSelectorProps = {
  agents: ReadonlyArray<AgentOption>;
  value: string | null;
  onChange: (value: string | null) => void;
};

export const AgentSelector = ({ agents, value, onChange }: AgentSelectorProps) => {
  return (
    <Select value={value ?? ""} onValueChange={(next) => onChange(next || null)}>
      <SelectTrigger className="w-full" size="sm">
        <SelectValue placeholder="Select agent" />
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
