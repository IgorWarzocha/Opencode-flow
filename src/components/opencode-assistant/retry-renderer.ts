/**
 * Retry renderer extracts displayable content for retry parts.
 * It keeps retry details isolated for troubleshooting workflows.
 */

type Part = Record<string, unknown>;

type RetryView = {
  label: string;
  content: string;
};

export const getRetryView = (part: Part): RetryView | null => {
  if (part.type !== "retry") return null;

  const reason = typeof part.reason === "string" ? part.reason : "retry";
  return { label: "retry", content: reason };
};
