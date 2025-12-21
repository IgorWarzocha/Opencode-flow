/**
 * File renderer extracts displayable content for file parts.
 * It surfaces file metadata without altering the raw payload.
 */

type Part = Record<string, unknown>;

type FileView = {
  label: string;
  content: string;
};

export const getFileView = (part: Part): FileView | null => {
  if (part.type !== "file") return null;

  const mime = typeof part.mime === "string" ? part.mime : "unknown";
  const filename = typeof part.filename === "string" ? part.filename : "(no filename)";
  const url = typeof part.url === "string" ? part.url : "(no url)";

  return {
    label: "file",
    content: `filename: ${filename}\nmime: ${mime}\nurl: ${url}`,
  };
};
