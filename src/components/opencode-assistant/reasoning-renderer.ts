/**
 * Reasoning renderer extracts displayable content for reasoning parts.
 * It keeps reasoning-specific formatting isolated from the rest of the assistant UI.
 */

type Part = Record<string, unknown>;

type ReasoningView = {
  label: string;
  content: string;
};

export const getReasoningView = (part: Part): ReasoningView | null => {
  if (part.type !== "reasoning") return null;
  if (typeof part.text === "string") {
    return { label: "reasoning", content: part.text };
  }

  return { label: "reasoning", content: JSON.stringify(part, null, 2) };
};
