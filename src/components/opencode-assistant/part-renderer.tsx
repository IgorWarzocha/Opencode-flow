/**
 * Part renderer normalizes all assistant parts into a consistent UI block.
 * It delegates to specialized renderers before falling back to generic output.
 */
"use client";

import { getAgentView } from "./agent-renderer";
import { getCompactionView } from "./compaction-renderer";
import { getFileView } from "./file-renderer";
import { getPatchView } from "./patch-renderer";
import { getReasoningView } from "./reasoning-renderer";
import { getRetryView } from "./retry-renderer";
import { getSnapshotView } from "./snapshot-renderer";
import { getStepFinishView } from "./step-finish-renderer";
import { getStepStartView } from "./step-start-renderer";
import { getSubtaskView } from "./subtask-renderer";
import { getTextView } from "./text-renderer";
import { getToolView } from "./tool-renderer";

type Part = Record<string, unknown>;

type PartView = {
  label: string;
  content: string;
};

type PartRendererFn = (part: Part) => PartView | null;

const renderers: PartRendererFn[] = [
  getTextView,
  getToolView,
  getReasoningView,
  getAgentView,
  getSubtaskView,
  getStepStartView,
  getStepFinishView,
  getSnapshotView,
  getPatchView,
  getCompactionView,
  getRetryView,
  getFileView,
];

const getGenericView = (part: Part): PartView => {
  if (typeof part.type === "string") {
    if (typeof part.text === "string") {
      return { label: part.type, content: part.text };
    }
  }

  if (typeof part.output === "string") {
    return { label: "output", content: part.output };
  }

  if (typeof part.patch === "string") {
    return { label: "patch", content: part.patch };
  }

  if (typeof part.reason === "string") {
    return { label: "reason", content: part.reason };
  }

  const label = typeof part.type === "string" ? part.type : "part";
  return { label, content: JSON.stringify(part, null, 2) };
};

export const PartRenderer = ({ part }: { part: Part }) => {
  for (const render of renderers) {
    const view = render(part);
    if (view) {
      return <PartBlock label={view.label} content={view.content} />;
    }
  }

  const generic = getGenericView(part);
  return <PartBlock label={generic.label} content={generic.content} />;
};

const PartBlock = ({ label, content }: PartView) => (
  <div className="rounded-md border border-border/60 bg-muted/20">
    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
      {label}
    </div>
    <pre className="px-2 py-1 whitespace-pre-wrap font-mono text-[11px]">{content}</pre>
  </div>
);
