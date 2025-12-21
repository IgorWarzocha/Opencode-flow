/**
 * Types for the OpenCode Assistant Panel.
 * Simplified versions of SDK types for internal UI state.
 */

export type AssistantPart = {
  id: string;
  type: string;
  text?: string;
  [key: string]: unknown;
};

export type AssistantMessage = {
  id: string;
  role: string;
  text: string;
  createdAt: number;
  completedAt: number | null;
  parts: AssistantPart[];
  agent?: string;
  model?: { providerID: string; modelID: string };
};

export type AssistantSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type AgentOption = {
  id: string;
  label: string;
};

export type EventMessageUpdated = {
  type: "message.updated";
  properties: {
    info: {
      id: string;
      role: string;
      sessionID: string;
      time: { created: number; completed?: number };
      agent?: string;
      model?: { providerID: string; modelID: string };
      providerID?: string;
      modelID?: string;
      [key: string]: unknown;
    };
  };
};

export type EventMessagePartUpdated = {
  type: "message.part.updated";
  properties: {
    part: {
      id: string;
      messageID: string;
      sessionID: string;
      type: string;
      text?: string;
      [key: string]: unknown;
    };
    delta?: string;
  };
};
