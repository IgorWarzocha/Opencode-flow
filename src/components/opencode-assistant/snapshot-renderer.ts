/**
 * Snapshot renderer extracts displayable content for snapshot parts.
 * It isolates snapshot payloads for dedicated formatting later.
 */

type Part = Record<string, unknown>;

type SnapshotView = {
  label: string;
  content: string;
};

export const getSnapshotView = (part: Part): SnapshotView | null => {
  if (part.type !== "snapshot") return null;

  return { label: "snapshot", content: JSON.stringify(part, null, 2) };
};
