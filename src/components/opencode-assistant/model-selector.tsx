/**
 * Model selector renders provider and model dropdowns for OpenCode prompts.
 * It keeps model selection logic isolated from the main assistant panel.
 */
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProviderOption } from "./model-data";

type ModelSelection = {
  providerId: string | null;
  modelId: string | null;
};

type ModelSelectorProps = {
  providers: ReadonlyArray<ProviderOption>;
  value: ModelSelection;
  onChange: (value: ModelSelection) => void;
};

export const ModelSelector = ({ providers, value, onChange }: ModelSelectorProps) => {
  const activeProvider = providers.find((provider) => provider.id === value.providerId) ?? null;
  const models = activeProvider?.models ?? [];

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={value.providerId ?? ""}
        onValueChange={(next) => onChange({ providerId: next || null, modelId: null })}
      >
        <SelectTrigger className="w-full" size="sm">
          <SelectValue placeholder="Select provider" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              {provider.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.modelId ?? ""}
        onValueChange={(next) => onChange({ providerId: value.providerId, modelId: next || null })}
      >
        <SelectTrigger className="w-full" size="sm">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
