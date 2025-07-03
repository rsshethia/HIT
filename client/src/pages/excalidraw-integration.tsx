import React, { useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Download, Save, FileText, Network, Layout, RefreshCw, Share2 } from 'lucide-react';

export default function ExcalidrawIntegrationPage() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const templates = [
    {
      id: 'ehr-integration',
      name: 'EHR Integration Hub',
      description: 'Electronic Health Record system with clinical integrations',
      preview: '🏥 EHR connected to Lab, Pharmacy, Imaging, and Billing systems'
    },
    {
      id: 'hl7-workflow',
      name: 'HL7 Message Workflow',
      description: 'ADT, ORM, ORU message flow patterns',
      preview: '📋 Patient admission → Lab orders → Results → Discharge flow'
    },
    {
      id: 'pacs-integration',
      name: 'PACS Integration',
      description: 'Picture Archiving and Communication System setup',
      preview: '📻 Modalities → PACS → Viewing stations → Archive'
    },
    {
      id: 'cloud-migration',
      name: 'Cloud Migration Architecture',
      description: 'On-premise to cloud integration patterns',
      preview: '☁️ Legacy systems → API Gateway → Cloud services'
    }
  ];

  const loadTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowTemplates(false);
    console.log(`Loading template: ${templateId}`);
    // Template loading would be implemented through Excalidraw's API
  };

  const handleExport = () => {
    console.log('Export functionality would be implemented here');
    // Export functionality would use Excalidraw's built-in export capabilities
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Healthcare Integration Designer
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Create detailed healthcare integration diagrams with Excalidraw's powerful drawing tools. 
            Perfect for system architects and integration specialists.
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Network className="h-6 w-6 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Integration Designer</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700">
                <Save className="h-4 w-4 mr-1" />
                Save
              </button>
              <button 
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
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
              <button className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Template Selection Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Healthcare Integration Templates</h3>
                <button 
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div 
                    key={template.id}
                    onClick={() => loadTemplate(template.id)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <p className="text-xs text-emerald-600 font-medium">{template.preview}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Click any template to load it into your canvas. You can then modify and customize it for your specific needs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Drawing Canvas */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '700px' }}>
          <Excalidraw
            initialData={{
              elements: [],
              appState: {
                viewBackgroundColor: '#ffffff',
              }
            }}
          />
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-emerald-600">1. Choose a Template</h4>
              <p className="text-sm text-gray-600">
                Start with one of our healthcare-specific templates or begin with a blank canvas.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-emerald-600">2. Design Your Architecture</h4>
              <p className="text-sm text-gray-600">
                Use Excalidraw's drawing tools to create systems, connections, and data flows.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-emerald-600">3. Export & Share</h4>
              <p className="text-sm text-gray-600">
                Export your diagrams as PNG images or save scenes for later editing.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-6 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium text-gray-900">Rich Drawing Tools</h4>
              <p className="text-sm text-gray-600">Shapes, arrows, text, and freehand drawing</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Network className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium text-gray-900">System Mapping</h4>
              <p className="text-sm text-gray-600">Visualize complex integration patterns</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Layout className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium text-gray-900">Professional Templates</h4>
              <p className="text-sm text-gray-600">Healthcare-specific starting points</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium text-gray-900">Collaboration</h4>
              <p className="text-sm text-gray-600">Share and collaborate on diagrams</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}