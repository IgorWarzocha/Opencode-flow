/**
 * Patch renderer extracts displayable content for patch parts.
 * It keeps diff formatting isolated for later refinement.
 */

type Part = Record<string, unknown>;

type PatchView = {
  label: string;
  content: string;
};

export const getPatchView = (part: Part): PatchView | null => {
  if (part.type !== "patch") return null;

  if (typeof part.patch === "string") {
    return { label: "patch", content: part.patch };
  }

  return { label: "patch", content: JSON.stringify(part, null, 2) };
};
