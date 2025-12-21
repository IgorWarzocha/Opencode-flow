/**
 * Text renderer extracts displayable content for text parts.
 * It keeps plain text handling separate from other part renderers.
 */

type Part = Record<string, unknown>;

type TextView = {
  label: string;
  content: string;
};

export const getTextView = (part: Part): TextView | null => {
  if (part.type !== "text") return null;

  const label = "text";

  if (typeof part.text === "string") {
    return { label, content: part.text };
  }

  return { label, content: JSON.stringify(part, null, 2) };
};
