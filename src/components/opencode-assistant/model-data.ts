/**
 * Model data helpers normalize provider payloads for UI selectors.
 * They keep provider parsing logic separate from presentation.
 */

type ProviderRecord = Record<string, unknown>;

type ProviderModel = {
  id: string;
  label: string;
};

type ProviderOption = {
  id: string;
  label: string;
  models: ProviderModel[];
};

type ProvidersPayload = {
  providers?: ReadonlyArray<ProviderRecord>;
  default?: Record<string, string>;
};

const getProviderId = (provider: ProviderRecord) => {
  if (typeof provider.id === "string") return provider.id;
  if (typeof provider.providerID === "string") return provider.providerID;
  return "unknown";
};

const getProviderLabel = (provider: ProviderRecord, id: string) => {
  if (typeof provider.name === "string") return provider.name;
  if (typeof provider.label === "string") return provider.label;
  return id;
};

const getModelId = (model: ProviderRecord) => {
  if (typeof model.id === "string") return model.id;
  if (typeof model.modelID === "string") return model.modelID;
  return "unknown";
};

const getModelLabel = (model: ProviderRecord, id: string) => {
  if (typeof model.name === "string") return model.name;
  if (typeof model.label === "string") return model.label;
  return id;
};

export const normalizeProviders = (payload: ProvidersPayload) => {
  const providersRaw = Array.isArray(payload.providers) ? payload.providers : [];
  const providers: ProviderOption[] = [];

  for (const provider of providersRaw) {
    if (typeof provider !== "object" || provider === null) continue;
    const id = getProviderId(provider as ProviderRecord);
    const label = getProviderLabel(provider as ProviderRecord, id);
    const modelsRaw = (provider as ProviderRecord).models;
    const models: ProviderModel[] = [];

    if (Array.isArray(modelsRaw)) {
      for (const model of modelsRaw) {
        if (typeof model !== "object" || model === null) continue;
        const modelId = getModelId(model as ProviderRecord);
        const modelLabel = getModelLabel(model as ProviderRecord, modelId);
        models.push({ id: modelId, label: modelLabel });
      }
    } else if (typeof modelsRaw === "object" && modelsRaw !== null) {
      for (const [modelId, modelValue] of Object.entries(modelsRaw as Record<string, unknown>)) {
        if (typeof modelValue !== "object" || modelValue === null) continue;
        const modelLabel = getModelLabel(modelValue as ProviderRecord, modelId);
        models.push({ id: modelId, label: modelLabel });
      }
    }

    providers.push({ id, label, models });
  }

  return {
    providers,
    defaults: payload.default ?? {},
  };
};

export type { ProviderOption, ProviderModel, ProvidersPayload };
