/**
 * Agent renderer extracts displayable content for agent parts.
 * It highlights agent handoffs without mixing with other part types.
 */

type Part = Record<string, unknown>;

type AgentView = {
  label: string;
  content: string;
};

export const getAgentView = (part: Part): AgentView | null => {
  if (part.type !== "agent") return null;

  const name = typeof part.name === "string" ? part.name : "agent";
  return { label: "agent", content: name };
};
