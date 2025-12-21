/**
 * Reasoning renderer extracts displayable content for reasoning parts.
 * It keeps reasoning-specific formatting isolated from the rest of the assistant UI.
 */

import type { AssistantMessage } from "./types";

type Part = Record<string, unknown>;

type ReasoningView = {
  label: string;
  content: string;
  collapsible?: boolean;
  initialOpen?: boolean;
};

export const getReasoningView = (part: Part, message: AssistantMessage): ReasoningView | null => {
  if (part.type !== "reasoning") return null;
  const isThinking = !message.completedAt;
  const content = typeof part.text === "string" ? part.text : "";

  // Only show the reasoning block when there's actual content.
  // This prevents showing an empty "Thinking" block before tokens arrive.
  if (!content) return null;

  return {
    label: "Thinking",
    content,
    collapsible: true,
    initialOpen: isThinking,
  };
};
