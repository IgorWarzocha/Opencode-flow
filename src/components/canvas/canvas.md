# Canvas Module

Visual orchestration layer powered by `@xyflow/react`. Allows users to map features to files and agents through a node-based architecture.

## Components

### GraphCanvas
The `GraphCanvas` component serves as the main entry point for the visual graph. It integrates the `ReactFlow` component along with `Controls`, `MiniMap`, and `Background` to provide a comprehensive workspace.

- **Data Source**: It asynchronously fetches graph data (nodes and edges) from the `/api/graph` endpoint upon mounting.
- **State Management**: Uses `useNodesState` and `useEdgesState` hooks from `@xyflow/react` to manage the graph's state locally.

### FeatureNode
A custom node component designed to represent project features.

- **Display**: Shows the feature `title` and a color-coded `status` badge (pending, in-progress, done).
- **Interactivity**: Equipped with input (`target`) and output (`source`) handles to facilitate connections between different features or entities.
