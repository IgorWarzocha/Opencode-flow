/**
 * Compaction renderer extracts displayable content for compaction parts.
 * It keeps compaction summaries isolated from other part renderers.
 */

type Part = Record<string, unknown>;

type CompactionView = {
  label: string;
  content: string;
};

export const getCompactionView = (part: Part): CompactionView | null => {
  if (part.type !== "compaction") return null;

  if (typeof part.summary === "string") {
    return { label: "compaction", content: part.summary };
  }

  return { label: "compaction", content: JSON.stringify(part, null, 2) };
};
