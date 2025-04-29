import React, { useCallback } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

interface System {
  id: string;
  name: string;
}

interface ConnectionData {
  source: string;
  target: string;
  direction: 'one-way' | 'bidirectional';
  quality: 'automated' | 'semi-automated' | 'manual';
  volume?: number;
}

interface DependencyMapperProps {
  systems: System[];
  connections: ConnectionData[];
  className?: string;
  title?: string;
  subtitle?: string;
  showExportLabels?: boolean;
}

// Define color mappings for different connection qualities
const qualityColors = {
  'automated': '#4ade80', // green
  'semi-automated': '#fb923c', // orange
  'manual': '#ef4444', // red
};

// Protocol mapping based on quality
const protocolMapping = {
  'automated': 'HL7 FHIR',
  'semi-automated': 'HL7 v2',
  'manual': 'Manual Entry'
};

export default function DependencyMapper({
  systems,
  connections,
  className = "",
  title = "System Dependencies",
  subtitle = "Interactive visualization of system dependencies",
  showExportLabels = false,
}: DependencyMapperProps) {
  // Transform systems into ReactFlow nodes with automatic layout
  const initialNodes = systems.map((system, index) => {
    // Calculate position in a circular layout
    const radius = Math.min(systems.length * 50, 300);
    const angle = (index / systems.length) * 2 * Math.PI;
    const x = radius * Math.cos(angle) + radius;
    const y = radius * Math.sin(angle) + radius;

    return {
      id: system.id,
      data: { label: system.name },
      position: { x, y },
      style: {
        backgroundColor: '#4f46e5',
        color: 'white',
        borderRadius: 8,
        padding: 12,
        fontWeight: 600,
        width: Math.max(150, system.name.length * 8), // Dynamic width based on name length
        textAlign: 'center' as const,
      },
    };
  });

  // Transform connections into ReactFlow edges
  const initialEdges = connections.map((conn, index) => {
    // Get color based on the connection quality
    const color = qualityColors[conn.quality] || '#888888';
    const protocol = protocolMapping[conn.quality] || 'Unknown';
    
    return {
      id: `e${index}`,
      source: conn.source,
      target: conn.target,
      type: 'smoothstep',
      animated: conn.quality === 'automated',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
      },
      style: {
        stroke: color,
        strokeWidth: conn.volume ? Math.max(1, Math.min(conn.volume / 20, 5)) : 2,
      },
      data: {
        protocol,
        direction: conn.direction,
        quality: conn.quality,
        volume: conn.volume,
      },
      label: showExportLabels ? protocol : undefined,
      labelStyle: { fill: '#555', fontSize: 12 },
      labelBgStyle: { fill: 'rgba(255, 255, 255, 0.8)' },
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={`w-full h-[65vh] ${className}`}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-right"
        >
          <MiniMap
            nodeColor={(n) => n.style?.backgroundColor || '#4f46e5'}
            className="bg-white rounded shadow-sm border"
          />
          <Controls />
          <Background color="#e5e7eb" gap={24} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}