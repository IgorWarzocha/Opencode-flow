/**
 * Subtask renderer extracts displayable content for subtask parts.
 * It keeps nested task formatting isolated for easier iteration.
 */

type Part = Record<string, unknown>;

type SubtaskView = {
  label: string;
  content: string;
};

export const getSubtaskView = (part: Part): SubtaskView | null => {
  if (part.type !== "subtask") return null;

  const agent = typeof part.agent === "string" ? part.agent : "agent";
  const prompt = typeof part.prompt === "string" ? part.prompt : "(no prompt)";
  const description = typeof part.description === "string" ? part.description : "";
  const command = typeof part.command === "string" ? part.command : "";

  const lines = [
    `agent: ${agent}`,
    description ? `description: ${description}` : null,
    command ? `command: ${command}` : null,
    `prompt: ${prompt}`,
  ].filter((line): line is string => Boolean(line));

  return { label: "subtask", content: lines.join("\n") };
};
