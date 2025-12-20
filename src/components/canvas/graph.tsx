/**
 * Flow Graph - Node-based visualization
 * Implements the primary XYFlow canvas for feature orchestration.
 */
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export const FlowCanvas = () => {
  return <ReactFlow nodes={[]} edges={[]} />;
};
