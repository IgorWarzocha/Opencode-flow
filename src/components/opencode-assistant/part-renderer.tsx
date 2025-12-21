/**
 * Part renderer normalizes all assistant parts into a consistent UI block.
 * It delegates to specialized renderers before falling back to generic output.
 */
"use client";

import { useState, useEffect } from "react";
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
import type { AssistantMessage } from "./types";

type Part = Record<string, unknown>;

type PartView = {
  label: string;
  content: string;
  collapsible?: boolean | undefined;
  initialOpen?: boolean | undefined;
};

type PartRendererFn = (part: Part, message: AssistantMessage) => PartView | null;

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

export const PartRenderer = ({ part, message }: { part: Part; message: AssistantMessage }) => {
  if (part.type === "step-start" || part.type === "step-finish" || part.type === "agent") {
    return null;
  }

  for (const render of renderers) {
    const view = render(part, message);
    if (view) {
      return <PartBlock {...view} />;
    }
  }

  const generic = getGenericView(part);
  return <PartBlock {...generic} />;
};

const PartBlock = ({ label, content, collapsible, initialOpen }: PartView) => {
  const [isOpen, setIsOpen] = useState(initialOpen ?? false);

  useEffect(() => {
    // Sync external open state if provided
    if (initialOpen !== undefined) {
      setIsOpen(initialOpen);
    }
  }, [initialOpen]);

  if (collapsible) {
    return (
      <details
        className="rounded-md border border-border/60 bg-muted/20 open:bg-muted/30 group"
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
      >
        <summary className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-transparent group-open:border-border/60 cursor-pointer select-none hover:text-foreground transition-colors flex items-center gap-1">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span>
          {label}
        </summary>
        <pre className="px-2 py-1 whitespace-pre-wrap font-mono text-[11px]">
          {content || <span className="animate-pulse">...</span>}
        </pre>
      </details>
    );
  }

  return (
    <div className="rounded-md border border-border/60 bg-muted/20">
      {label !== "text" && (
        <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
          {label}
        </div>
      )}
      <pre className="px-2 py-1 whitespace-pre-wrap font-mono text-[11px]">
        {content || <span className="animate-pulse">...</span>}
      </pre>
    </div>
  );
};
