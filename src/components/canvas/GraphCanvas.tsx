/**
 * Graph Canvas Component
 * Renders an interactive graph visualization using @xyflow/react.
 * Fetches graph data (nodes/edges) from the API and provides zoom, pan, and minimap controls.
 */
"use client";

import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FeatureNode from "./nodes/FeatureNode";
import { useMemo, useEffect } from "react";
import { useTheme } from "../theme/theme-provider";

/** API response shape for the graph endpoint */
interface GraphApiResponse {
  nodes?: Node[];
  edges?: unknown[];
}

export function GraphCanvas() {
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  // We use edges state but default typing is fine here if we don't pass generic or if we suppress
  // The error was "default value for type parameter", meaning useEdgesState() is enough if defaults are used.
  // But we want explicit types usually.
  // Let's just use the non-generic version to satisfy the linter if defaults match, or suppress correctly.
  // Actually, standard usage is `useEdgesState([])`.
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(
    () => ({
      feature: FeatureNode,
    }),
    [],
  );

  useEffect(() => {
    let ignore = false;

    async function fetchGraphData() {
      try {
        const response = await fetch("/api/graph");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data: GraphApiResponse = await response.json();

        if (!ignore) {
          setNodes(data.nodes ?? []);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
          setEdges((data.edges as any) ?? []);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Failed to fetch graph data:", message);
      }
    }

    void fetchGraphData();

    return () => {
      ignore = true;
    };
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        colorMode={theme}
        className="bg-background"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background color="#888" gap={16} size={1} className="opacity-10" />
        <Controls className="bg-card border border-border text-foreground" />
        <MiniMap
          className="bg-card border border-border !bottom-4 !right-4"
          nodeColor={(n) => {
            if (n.type === "feature") return "#64748b";
            return "#eee";
          }}
        />
      </ReactFlow>
    </div>
  );
}
