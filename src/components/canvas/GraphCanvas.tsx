'use client';

import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FeatureNode from './nodes/FeatureNode';
import { useMemo, useEffect } from 'react';

export function GraphCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodeTypes = useMemo(() => ({
    feature: FeatureNode,
  }), []);

  useEffect(() => {
    let ignore = false;
    
    async function fetchGraphData() {
      try {
        const response = await fetch('/api/graph');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!ignore) {
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
        }
      } catch (error) {
        console.error("Failed to fetch graph data:", error);
      }
    }

    fetchGraphData();

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
        className="bg-background"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background color="#888" gap={16} size={1} className="opacity-10" />
        <Controls className="bg-card border border-border text-foreground" />
        <MiniMap 
            className="bg-card border border-border !bottom-4 !right-4" 
            nodeColor={(n) => {
                if (n.type === 'feature') return '#64748b';
                return '#eee';
            }}
        />
      </ReactFlow>
    </div>
  );
}
