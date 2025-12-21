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
  // Agent info is now handled in the message header, not as a part block.
  // Returning null here prevents it from being rendered twice.
  return null;
};
