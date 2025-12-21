/**
 * Step start renderer extracts displayable content for step-start parts.
 * It keeps step lifecycle formatting isolated from the main panel.
 */

type Part = Record<string, unknown>;

type StepStartView = {
  label: string;
  content: string;
};

export const getStepStartView = (part: Part): StepStartView | null => {
  if (part.type !== "step-start") return null;

  const id = typeof part.id === "string" ? part.id : "step";
  return { label: "step-start", content: id };
};
