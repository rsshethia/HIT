import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Download, 
  Save, 
  RefreshCw, 
  Plus, 
  Workflow,
  Hospital,
  Database,
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react';

// Define node types for healthcare workflows
const nodeTypes = {
  system: 'default',
  process: 'default',
  decision: 'default',
  data: 'default',
};

// Initial workflow nodes for healthcare integration
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Patient Registration',
      description: 'Patient arrives and registers'
    },
    style: { 
      background: '#3B82F6', 
      color: 'white',
      border: '1px solid #1E40AF',
      borderRadius: '8px',
      padding: '10px',
      width: 180
    },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 350, y: 100 },
    data: { 
      label: 'ADT A04 Message',
      description: 'Registration message sent'
    },
    style: { 
      background: '#10B981', 
      color: 'white',
      border: '1px solid #059669',
      borderRadius: '8px',
      padding: '10px',
      width: 180
    },
  },
  {
    id: '3',
    type: 'default',
    position: { x: 600, y: 100 },
    data: { 
      label: 'EMR System',
      description: 'Electronic Medical Record'
    },
    style: { 
      background: '#8B5CF6', 
      color: 'white',
      border: '1px solid #7C3AED',
      borderRadius: '8px',
      padding: '10px',
      width: 180
    },
  },
  {
    id: '4',
    type: 'default',
    position: { x: 350, y: 250 },
    data: { 
      label: 'Lab Order',
      description: 'Physician orders lab tests'
    },
    style: { 
      background: '#F59E0B', 
      color: 'white',
      border: '1px solid #D97706',
      borderRadius: '8px',
      padding: '10px',
      width: 180
    },
  },
  {
    id: '5',
    type: 'default',
    position: { x: 600, y: 250 },
    data: { 
      label: 'Lab System',
      description: 'Laboratory Information System'
    },
    style: { 
      background: '#EF4444', 
      color: 'white',
      border: '1px solid #DC2626',
      borderRadius: '8px',
      padding: '10px',
      width: 180
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    label: 'Triggers',
    style: { stroke: '#3B82F6' },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'smoothstep',
    animated: true,
    label: 'Updates',
    style: { stroke: '#10B981' },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    type: 'smoothstep',
    animated: true,
    label: 'Initiates',
    style: { stroke: '#8B5CF6' },
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    type: 'smoothstep',
    animated: true,
    label: 'Sends to',
    style: { stroke: '#F59E0B' },
  },
];

export default function WorkflowMappingPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('admission');

  const templates = [
    {
      id: 'admission',
      name: 'Patient Admission Workflow',
      description: 'Complete patient admission process with ADT messages'
    },
    {
      id: 'discharge',
      name: 'Patient Discharge Workflow',
      description: 'Patient discharge and billing workflow'
    },
    {
      id: 'lab-results',
      name: 'Lab Results Workflow',
      description: 'Lab order to results delivery process'
    },
    {
      id: 'medication',
      name: 'Medication Administration',
      description: 'Medication ordering and administration workflow'
    }
  ];

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNewNode = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: { 
        label: 'New Process',
        description: 'Click to edit'
      },
      style: { 
        background: '#6B7280', 
        color: 'white',
        border: '1px solid #4B5563',
        borderRadius: '8px',
        padding: '10px',
        width: 180
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const resetWorkflow = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  const exportWorkflow = () => {
    const workflowData = {
      nodes,
      edges,
      template: selectedTemplate,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthcare-workflow-${selectedTemplate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Healthcare Workflow Mapping Tool
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Visualize and map healthcare integration workflows using interactive flowcharts. 
            Design patient journeys, system interactions, and message flows with drag-and-drop simplicity.
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Workflow className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Workflow Designer</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={addNewNode}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Node
              </button>
              <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                <Save className="h-4 w-4 mr-1" />
                Save
              </button>
              <button 
                onClick={exportWorkflow}
                className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button 
                onClick={resetWorkflow}
                className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Template Selector */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Workflow Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-500 mt-1">{template.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Canvas */}
        <div className="bg-white rounded-lg shadow-lg" style={{ height: '600px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Patient Process</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">HL7 Message</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">System</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Clinical Process</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">External System</span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use the Workflow Mapping Tool</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Hospital className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-600">1. Build Your Workflow</h4>
              </div>
              <p className="text-sm text-gray-600">
                Drag nodes to create your healthcare workflow. Connect processes with arrows to show the flow.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-600">2. Add HL7 Messages</h4>
              </div>
              <p className="text-sm text-gray-600">
                Include HL7 messages like ADT, ORM, and ORU to show data exchange between systems.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-600">3. Map System Interactions</h4>
              </div>
              <p className="text-sm text-gray-600">
                Connect EMR, lab systems, and other healthcare applications to visualize integration points.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}