/**
 * Step finish renderer extracts displayable content for step-finish parts.
 * It highlights completion state without mixing with other renderers.
 */

type Part = Record<string, unknown>;

type StepFinishView = {
  label: string;
  content: string;
};

export const getStepFinishView = (part: Part): StepFinishView | null => {
  if (part.type !== "step-finish") return null;

  const reason = typeof part.reason === "string" ? part.reason : "complete";
  return { label: "step-finish", content: reason };
};
