/**
 * Tool renderer extracts displayable content for tool parts.
 * It keeps tool output formatting isolated from other part renderers.
 */

type Part = Record<string, unknown>;

type ToolView = {
  label: string;
  content: string;
};

export const getToolView = (part: Part): ToolView | null => {
  if (part.type !== "tool") return null;

  const toolName = typeof part.tool === "string" ? part.tool : "tool";
  if (typeof part.output === "string") {
    return { label: `tool:${toolName}`, content: part.output };
  }

  return { label: `tool:${toolName}`, content: JSON.stringify(part, null, 2) };
};
