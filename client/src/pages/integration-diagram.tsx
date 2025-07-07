import React, { useState, useRef, useCallback } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { 
  Pen, 
  Download, 
  Save, 
  FileText, 
  Network, 
  Layout, 
  RefreshCw,
  Monitor,
  Database,
  MessageSquare,
  Activity,
  ZoomIn,
  ZoomOut,
  Grid,
  RotateCcw,
  Heart,
  Hospital
} from 'lucide-react';

export default function IntegrationDiagramPage() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);

  // Healthcare-specific shape types for tldraw integration
  const shapeTypes = {
    'hl7-message': {
      name: 'HL7 Message',
      icon: '📡',
      color: '#4f46e5',
      description: 'HL7 messages like ADT, ORM, ORU'
    },
    'system-node': {
      name: 'System Node',
      icon: '🏥',
      color: '#22c55e',
      description: 'Healthcare systems like EMR, LIS, PACS'
    },
    'workflow-step': {
      name: 'Workflow Step',
      icon: '📋',
      color: '#48bb78',
      description: 'Process steps in patient workflows'
    },
    'data-flow': {
      name: 'Data Flow',
      icon: '🔄',
      color: '#805ad5',
      description: 'Data exchange between systems'
    }
  };

  const templates = [
    {
      id: 'admission-workflow',
      name: 'Patient Admission Workflow',
      description: 'PAS to EMR admission integration flow',
      icon: '🏥',
      preview: 'Complete patient admission process with ADT messages'
    },
    {
      id: 'hl7-sequence',
      name: 'HL7 Message Sequence',
      description: 'Standard HL7 ADT message flow',
      icon: '📡',
      preview: 'Registration → Order → Results → Discharge sequence'
    },
    {
      id: 'clinical-workflow',
      name: 'Clinical Workflow',
      description: 'Physical + digital process mapping',
      icon: '👩‍⚕️',
      preview: 'End-to-end patient care workflow visualization'
    },
    {
      id: 'hub-spoke',
      name: 'Hub & Spoke Architecture',
      description: 'Central integration engine with multiple system connections',
      icon: '🎯',
      preview: 'Interface Engine connected to EMR, Lab, PACS, Pharmacy'
    },
    {
      id: 'point-to-point',
      name: 'Point-to-Point Integration',
      description: 'Direct system-to-system connections',
      icon: '🔗',
      preview: 'EMR ↔ Lab ↔ PACS direct connections'
    },
    {
      id: 'message-bus',
      name: 'Message Bus Pattern',
      description: 'Shared communication layer for multiple systems',
      icon: '🚌',
      preview: 'All systems connected through message bus'
    }
  ];

  const loadTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowTemplates(false);
    console.log(`Loading template: ${templateId}`);
  };

  const clearCanvas = () => {
    setSelectedTemplate(null);
    console.log('Clearing canvas');
  };

  const exportDiagram = () => {
    console.log('Exporting diagram');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="h-6 w-6" />
            <h1 className="text-xl font-bold">Healthcare Integration Diagram Tool</h1>
          </div>
          <div className="text-sm opacity-90">
            HIT Platform v2.1
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Enhanced Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Tools Section */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Drawing Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedTool('select')}
                className={`p-3 rounded-lg border text-xs flex flex-col items-center gap-2 transition-colors ${
                  selectedTool === 'select' 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Monitor className="h-4 w-4" />
                Select
              </button>
              
              {Object.entries(shapeTypes).map(([key, shape]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTool(key)}
                  className={`p-3 rounded-lg border text-xs flex flex-col items-center gap-2 transition-colors ${
                    selectedTool === key 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  title={shape.description}
                >
                  <span className="text-base">{shape.icon}</span>
                  <span className="text-center leading-tight">{shape.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Templates Section */}
          <div className="p-4 border-b border-gray-200 flex-1 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Healthcare Templates</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedTemplate === template.id 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions Section */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={clearCanvas}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                Clear Canvas
              </button>
              <button
                onClick={exportDiagram}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Download className="h-4 w-4" />
                Export Diagram
              </button>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative bg-white">
          {/* Canvas Controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => setZoom(Math.min(zoom + 10, 200))}
              className="p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom - 10, 50))}
              className="p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg border shadow-sm ${
                showGrid 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              title="Toggle Grid"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom Indicator */}
          <div className="absolute bottom-4 left-4 z-10 bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium shadow-sm">
            {zoom}%
          </div>

          {/* Drawing Canvas */}
          <div className="w-full h-full bg-gray-50" style={{ 
            backgroundImage: showGrid ? 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)' : 'none',
            backgroundSize: showGrid ? '20px 20px' : 'auto'
          }}>
            <Tldraw />
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Choose Healthcare Integration Template</h3>
              <button 
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div 
                  key={template.id}
                  onClick={() => loadTemplate(template.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <p className="text-xs text-indigo-600">{template.preview}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}