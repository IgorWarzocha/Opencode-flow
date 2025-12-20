import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { memo } from 'react';

export type FeatureNodeData = {
  title: string;
  status: 'pending' | 'in-progress' | 'done';
};

export type FeatureNode = Node<FeatureNodeData, 'feature'>;

const FeatureNode = ({ data }: NodeProps<FeatureNode>) => {
  return (
    <div className="bg-card text-card-foreground shadow-sm border border-border rounded-xl min-w-[200px] overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
      <div className="bg-muted/50 p-3 border-b border-border flex items-center justify-between">
         <span className="font-semibold text-sm">{data.title}</span>
         <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
            data.status === 'done' ? 'bg-green-500/15 text-green-600' :
            data.status === 'in-progress' ? 'bg-blue-500/15 text-blue-600' :
            'bg-gray-500/15 text-gray-600'
         }`}>
            {data.status}
         </span>
      </div>
      
      <div className="p-3 text-xs text-muted-foreground">
        <p>Double-click to edit details...</p>
      </div>

      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-3 !h-3" />
    </div>
  );
};

export default memo(FeatureNode);
