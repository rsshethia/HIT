import React, { useState, useRef } from 'react';
import { Tldraw, Editor, createShapeId, TLGeoShape } from 'tldraw';
import 'tldraw/tldraw.css';
import { Pen, Download, Save, FileText, Network, Layout, RefreshCw } from 'lucide-react';

export default function IntegrationDiagramPage() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const templates = [
    {
      id: 'hub-spoke',
      name: 'Hub & Spoke Architecture',
      description: 'Central integration engine with multiple system connections',
      preview: '🎯 Interface Engine connected to EMR, Lab, PACS, Pharmacy'
    },
    {
      id: 'point-to-point',
      name: 'Point-to-Point Integration',
      description: 'Direct system-to-system connections',
      preview: '🔗 EMR ↔ Lab ↔ PACS direct connections'
    },
    {
      id: 'message-bus',
      name: 'Message Bus Pattern',
      description: 'Shared communication layer for multiple systems',
      preview: '🚌 All systems connected through message bus'
    },
    {
      id: 'api-gateway',
      name: 'API Gateway Integration',
      description: 'RESTful API integration patterns',
      preview: '🌐 API Gateway routing to microservices'
    }
  ];

  const createHubSpokeTemplate = () => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    
    // Clear existing shapes
    editor.selectAll();
    editor.deleteShapes(editor.getSelectedShapeIds());

    // Create a simple visual template with just geometric shapes
    // Central hub
    const hubId = createShapeId();
    editor.createShape({
      id: hubId,
      type: 'geo',
      x: 400,
      y: 300,
      props: {
        geo: 'rectangle',
        w: 160,
        h: 80,
        color: 'blue',
        fill: 'solid'
      }
    });

    // Create 6 spoke systems positioned around the hub
    const spokes = [
      { x: 200, y: 150, color: 'green' },   // EMR (top-left)
      { x: 600, y: 150, color: 'orange' },  // Lab (top-right)
      { x: 650, y: 350, color: 'red' },     // PACS (right)
      { x: 550, y: 500, color: 'violet' },  // Pharmacy (bottom-right)
      { x: 250, y: 500, color: 'yellow' },  // Billing (bottom-left)
      { x: 150, y: 350, color: 'light-blue' } // Patient Portal (left)
    ];

    spokes.forEach((spoke) => {
      const spokeId = createShapeId();
      editor.createShape({
        id: spokeId,
        type: 'geo',
        x: spoke.x,
        y: spoke.y,
        props: {
          geo: 'rectangle',
          w: 120,
          h: 70,
          color: spoke.color,
          fill: 'solid'
        }
      });

      // Create connecting line using arrow type
      const arrowId = createShapeId();
      editor.createShape({
        id: arrowId,
        type: 'arrow',
        x: 0,
        y: 0,
        props: {
          start: { x: spoke.x + 60, y: spoke.y + 35 },
          end: { x: 480, y: 340 },
          color: spoke.color
        }
      });
    });

    // Zoom to fit after a brief delay
    setTimeout(() => {
      editor.zoomToFit();
    }, 200);
  };

  const loadTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowTemplates(false);
    
    switch (templateId) {
      case 'hub-spoke':
        createHubSpokeTemplate();
        break;
      case 'point-to-point':
        console.log('Point-to-Point template would be implemented');
        break;
      case 'message-bus':
        console.log('Message Bus template would be implemented');
        break;
      case 'api-gateway':
        console.log('API Gateway template would be implemented');
        break;
      default:
        console.log(`Template ${templateId} not yet implemented`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Pen className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Integration Diagram Tool</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Create professional integration diagrams, system architecture drawings, and workflow visualizations. 
            Perfect for documenting healthcare system connections, data flows, and technical specifications.
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Integration Architecture</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">Draw systems, connections, and data flows</span>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                <Save className="h-4 w-4 mr-1" />
                Save
              </button>
              <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button 
                onClick={() => setShowTemplates(!showTemplates)}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
              >
                <Layout className="h-4 w-4 mr-1" />
                Templates
              </button>
            </div>
          </div>
        </div>

        {/* Template Selection Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Choose Integration Template</h3>
                <button 
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div 
                    key={template.id}
                    onClick={() => loadTemplate(template.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === template.id 
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <h4 className={`font-medium mb-2 ${
                      selectedTemplate === template.id ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {template.name}
                      {selectedTemplate === template.id && (
                        <span className="ml-2 text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <p className={`text-xs ${
                      selectedTemplate === template.id ? 'text-indigo-700' : 'text-indigo-600'
                    }`}>
                      {template.preview}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Hub & Spoke Legend */}
              {selectedTemplate === 'hub-spoke' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Hub & Spoke Color Guide:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                      <span>Interface Engine (Hub)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                      <span>EMR System</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                      <span>Lab System</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                      <span>PACS Imaging</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-violet-500 rounded mr-2"></div>
                      <span>Pharmacy</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                      <span>Billing</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-sky-500 rounded mr-2"></div>
                      <span>Patient Portal</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Each system connects to the central hub with arrows showing data flow direction.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drawing Canvas */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <Tldraw 
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>

        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center mb-3">
              <Network className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">System Mapping</h3>
            </div>
            <p className="text-sm text-gray-600">
              Draw healthcare systems as boxes and connect them with arrows to show data flows. 
              Use different colors to represent different types of systems (EMR, Lab, PACS, etc.).
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center mb-3">
              <FileText className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Documentation</h3>
            </div>
            <p className="text-sm text-gray-600">
              Add text annotations to document message types, protocols, and business rules. 
              Create comprehensive integration specifications with visual clarity.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center mb-3">
              <Download className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
            </div>
            <p className="text-sm text-gray-600">
              Export your diagrams as PNG, SVG, or PDF for inclusion in technical documentation, 
              presentations, and system architecture specifications.
            </p>
          </div>
        </div>

        {/* Templates Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 text-indigo-600 mr-2" />
            Common Integration Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2">Hub & Spoke</h4>
              <p className="text-xs text-gray-600">Central integration engine with multiple system connections</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2">Point-to-Point</h4>
              <p className="text-xs text-gray-600">Direct system-to-system connections</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2">Message Bus</h4>
              <p className="text-xs text-gray-600">Shared communication layer for multiple systems</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2">API Gateway</h4>
              <p className="text-xs text-gray-600">RESTful API integration patterns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}