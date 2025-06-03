import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileImage, 
  FileText, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import NetworkDiagram from '@/components/network-diagram';
import IntegrationMatrix from '@/components/integration-matrix';
import SankeyDiagram from '@/components/sankey-diagram';
import DependencyMapper from '@/components/dependency-mapper';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface System {
  id: string;
  name: string;
}

interface Connection {
  source: string;
  target: string;
  direction: 'one-way' | 'bidirectional';
  quality: 'automated' | 'semi-automated' | 'manual';
  volume?: number; // Optional volume for Sankey diagram
}

export default function IntegrationMappingPage() {
  const [step, setStep] = useState<number>(1);
  const [systems, setSystems] = useState<System[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [newSystemName, setNewSystemName] = useState<string>('');
  const [activeVisualization, setActiveVisualization] = useState<string>('network');
  
  // For connection setup
  const [sourceSystem, setSourceSystem] = useState<string>('');
  const [targetSystem, setTargetSystem] = useState<string>('');
  const [direction, setDirection] = useState<'one-way' | 'bidirectional'>('one-way');
  const [quality, setQuality] = useState<'automated' | 'semi-automated' | 'manual'>('automated');
  const [dataVolume, setDataVolume] = useState<number>(10);
  
  // Enhanced visualization controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filters, setFilters] = useState({
    automated: true,
    semiAutomated: true,
    manual: true,
    oneWay: true,
    bidirectional: true
  });
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Handle adding a new system
  const handleAddSystem = () => {
    if (newSystemName.trim() === '') {
      toast({
        title: "Error",
        description: "System name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    // Check for duplicate system names
    if (systems.some(system => system.name.toLowerCase() === newSystemName.toLowerCase())) {
      toast({
        title: "Error",
        description: "A system with this name already exists",
        variant: "destructive"
      });
      return;
    }
    
    const newSystem: System = {
      id: Date.now().toString(),
      name: newSystemName
    };
    
    setSystems([...systems, newSystem]);
    setNewSystemName('');
  };
  
  // Handle removing a system
  const handleRemoveSystem = (id: string) => {
    setSystems(systems.filter(system => system.id !== id));
    
    // Remove any connections associated with this system
    setConnections(connections.filter(
      conn => conn.source !== id && conn.target !== id
    ));
  };
  
  // Handle adding a new connection
  const handleAddConnection = () => {
    if (sourceSystem === '' || targetSystem === '') {
      toast({
        title: "Error",
        description: "Please select both source and target systems",
        variant: "destructive"
      });
      return;
    }
    
    if (sourceSystem === targetSystem) {
      toast({
        title: "Error",
        description: "Source and target cannot be the same system",
        variant: "destructive"
      });
      return;
    }
    
    // Check for duplicate connections
    const isDuplicate = connections.some(conn => 
      (conn.source === sourceSystem && conn.target === targetSystem) ||
      (direction === 'bidirectional' && conn.source === targetSystem && conn.target === sourceSystem)
    );
    
    if (isDuplicate) {
      toast({
        title: "Error",
        description: "This connection already exists",
        variant: "destructive"
      });
      return;
    }
    
    const newConnection: Connection = {
      source: sourceSystem,
      target: targetSystem,
      direction,
      quality: 'automated', // Default to automated since we removed the selector
      volume: dataVolume
    };
    
    setConnections([...connections, newConnection]);
    
    // If bidirectional, add the reverse connection too
    if (direction === 'bidirectional') {
      const reverseConnection: Connection = {
        source: targetSystem,
        target: sourceSystem,
        direction,
        quality: 'automated', // Default to automated since we removed the selector
        volume: dataVolume
      };
      setConnections(prevConnections => [...prevConnections, reverseConnection]);
    }
    
    // Reset form
    setSourceSystem('');
    setTargetSystem('');
    setDirection('one-way');
    setQuality('automated');
    setDataVolume(10);
  };
  
  // Handle removing a connection
  const handleRemoveConnection = (source: string, target: string) => {
    setConnections(connections.filter(
      conn => !(conn.source === source && conn.target === target)
    ));
  };
  
  // Handle moving to the next step
  const handleNextStep = () => {
    if (step === 1 && systems.length < 2) {
      toast({
        title: "Error",
        description: "Please add at least two systems to continue",
        variant: "destructive"
      });
      return;
    }
    
    if (step === 2 && connections.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one connection to continue",
        variant: "destructive"
      });
      return;
    }
    
    setStep(step + 1);
  };
  
  // Handle moving to the previous step
  const handlePreviousStep = () => {
    setStep(step - 1);
  };
  
  // Create refs for capturing visualization content
  const vizRef = useRef<HTMLDivElement>(null);

  // Handle generating the PDF
  const handleGeneratePDF = async () => {
    if (!vizRef.current) {
      toast({
        title: "Error",
        description: "No visualization content found to export.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Generating PDF",
        description: "Please wait...",
      });

      // Get current visualization's title based on active tab
      let title = "Healthcare System Integration";
      if (activeVisualization === 'network') {
        title = "Network Diagram - Healthcare System Integration";
      } else if (activeVisualization === 'matrix') {
        title = "Integration Matrix - Healthcare System Integration";
      } else if (activeVisualization === 'sankey') {
        title = "Data Flow Diagram - Healthcare System Integration";
      } else if (activeVisualization === 'reactflow') {
        title = "ReactFlow Dependency Map - Healthcare System Integration";
      }

      // Capture the content of the visualization
      const canvas = await html2canvas(vizRef.current, {
        allowTaint: true,
        useCORS: true,
        scale: 2, // Higher scale for better quality
        backgroundColor: '#ffffff',
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
      });
      
      // Calculate dimensions to fit the image properly
      const imgWidth = 280; // A4 landscape width in mm (with margins)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add title and metadata
      pdf.setFontSize(16);
      pdf.text(title, 15, 15);
      
      // Add date
      const date = new Date().toLocaleDateString();
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${date}`, 15, 22);
      
      // Add image
      pdf.addImage(imgData, 'PNG', 15, 30, imgWidth, imgHeight);
      
      // Add summary of systems and connections
      const pageHeight = pdf.internal.pageSize.height;
      let yPos = 30 + imgHeight + 10;
      
      // Check if we need to add a new page for the summary
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(12);
      pdf.text('Summary:', 15, yPos);
      yPos += 7;
      pdf.setFontSize(10);
      pdf.text(`Total Systems: ${systems.length}`, 15, yPos);
      yPos += 5;
      pdf.text(`Total Connections: ${connections.length}`, 15, yPos);
      
      // Save the PDF
      pdf.save(`healthcare-integration-${activeVisualization}.pdf`);
      
      toast({
        title: "Success!",
        description: "PDF has been generated and downloaded.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle exporting as PNG
  const handleGeneratePNG = async () => {
    if (!vizRef.current) {
      toast({
        title: "Error",
        description: "No visualization content found to export.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      toast({
        title: "Generating PNG",
        description: "Please wait...",
      });
      
      // Capture the content of the visualization
      const canvas = await html2canvas(vizRef.current, {
        allowTaint: true,
        useCORS: true,
        scale: 2, // Higher scale for better quality
        backgroundColor: '#ffffff',
      });
      
      // Convert to PNG and download
      const link = document.createElement('a');
      link.download = `healthcare-integration-${activeVisualization}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "Success!",
        description: "PNG has been generated and downloaded.",
      });
    } catch (error) {
      console.error('Error generating PNG:', error);
      toast({
        title: "Error",
        description: "Failed to generate PNG. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle exporting as SVG
  const handleGenerateSVG = async () => {
    if (!vizRef.current) {
      toast({
        title: "Error",
        description: "No visualization content found to export.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Generating SVG",
        description: "Please wait...",
      });

      // Get the SVG element from the visualization
      const svgElement = vizRef.current.querySelector('svg');
      if (!svgElement) {
        toast({
          title: "Error",
          description: "No SVG content found in the current visualization.",
          variant: "destructive"
        });
        return;
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Add XML declaration and namespace
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clonedSvg);
      
      // Add proper SVG header
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
      
      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `healthcare-integration-${activeVisualization}.svg`;
      link.href = url;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: "SVG has been generated and downloaded.",
      });
    } catch (error) {
      console.error('Error generating SVG:', error);
      toast({
        title: "Error",
        description: "Failed to generate SVG. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter connections based on current filters
  const getFilteredConnections = () => {
    return connections.filter(conn => {
      // Filter by quality
      if (conn.quality === 'automated' && !filters.automated) return false;
      if (conn.quality === 'semi-automated' && !filters.semiAutomated) return false;
      if (conn.quality === 'manual' && !filters.manual) return false;
      
      // Filter by direction
      if (conn.direction === 'one-way' && !filters.oneWay) return false;
      if (conn.direction === 'bidirectional' && !filters.bidirectional) return false;
      
      return true;
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterKey: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Example systems for demonstration purposes
  const populateExampleData = () => {
    const exampleSystems: System[] = [
      { id: '1', name: 'Electronic Health Record (EHR)' },
      { id: '2', name: 'Patient Administration System (PAS)' },
      { id: '3', name: 'Laboratory Information System (LIS)' },
      { id: '4', name: 'Radiology Information System (RIS)' },
      { id: '5', name: 'Pharmacy Management System' },
      { id: '6', name: 'Billing System' }
    ];
    
    const exampleConnections: Connection[] = [
      { source: '1', target: '2', direction: 'bidirectional', quality: 'automated', volume: 100 },
      { source: '2', target: '1', direction: 'bidirectional', quality: 'automated', volume: 100 },
      { source: '1', target: '3', direction: 'one-way', quality: 'automated', volume: 50 },
      { source: '3', target: '1', direction: 'one-way', quality: 'automated', volume: 80 },
      { source: '1', target: '4', direction: 'one-way', quality: 'semi-automated', volume: 40 },
      { source: '4', target: '1', direction: 'one-way', quality: 'semi-automated', volume: 30 },
      { source: '1', target: '5', direction: 'one-way', quality: 'automated', volume: 60 },
      { source: '5', target: '1', direction: 'one-way', quality: 'semi-automated', volume: 20 },
      { source: '1', target: '6', direction: 'one-way', quality: 'semi-automated', volume: 45 },
      { source: '2', target: '6', direction: 'one-way', quality: 'manual', volume: 15 }
    ];
    
    setSystems(exampleSystems);
    setConnections(exampleConnections);
  };

  // Render the step content based on the current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Inventory</h3>
              <p className="text-gray-600 mb-4">
                Enter the names of all healthcare systems in your environment. 
                This will include your EHR, PAS, departmental systems, and any other systems that exchange information.
              </p>
              
              <div className="flex items-end gap-4 mb-6">
                <div className="flex-grow">
                  <Label htmlFor="systemName" className="mb-2 block">System Name</Label>
                  <Input 
                    id="systemName" 
                    placeholder="e.g., Electronic Health Record (EHR)" 
                    value={newSystemName}
                    onChange={(e) => setNewSystemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSystem()}
                  />
                </div>
                <Button onClick={handleAddSystem}>Add System</Button>
              </div>
              
              {systems.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Name</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {systems.map((system) => (
                        <tr key={system.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{system.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveSystem(system.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No systems added yet. Add your first system above.</p>
                  <Button variant="outline" className="mt-4" onClick={populateExampleData}>
                    Load Example Data
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Mapping</h3>
              <p className="text-gray-600 mb-4">
                Define the connections between your systems. For each connection, specify the source and target systems
                and the direction of data flow.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="sourceSystem" className="mb-2 block">Source System</Label>
                  <Select value={sourceSystem} onValueChange={setSourceSystem}>
                    <SelectTrigger id="sourceSystem">
                      <SelectValue placeholder="Select source system" />
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="targetSystem" className="mb-2 block">Target System</Label>
                  <Select value={targetSystem} onValueChange={setTargetSystem}>
                    <SelectTrigger id="targetSystem">
                      <SelectValue placeholder="Select target system" />
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="direction" className="mb-2 block">Direction</Label>
                  <Select value={direction} onValueChange={value => setDirection(value as 'one-way' | 'bidirectional')}>
                    <SelectTrigger id="direction">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-way">One-way</SelectItem>
                      <SelectItem value="bidirectional">Bidirectional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={handleAddConnection} className="w-full">Add Connection</Button>
                </div>
              </div>
              
              {connections.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {connections.map((connection, index) => {
                        const sourceSystem = systems.find(s => s.id === connection.source);
                        const targetSystem = systems.find(s => s.id === connection.target);
                        if (!sourceSystem || !targetSystem) return null;
                        
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sourceSystem.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{targetSystem.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {connection.direction === 'bidirectional' ? 'Bidirectional' : 'One-way'}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveConnection(connection.source, connection.target)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No connections added yet. Define your first connection above.</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case 3:
        const filteredConnections = getFilteredConnections();
        
        return (
          <div className="space-y-6">
            {/* Enhanced Controls Bar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-4 justify-between">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Zoom:</span>
                  <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetZoom}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLegend(!showLegend)}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    {showLegend ? 'Hide' : 'Show'} Legend
                  </Button>
                </div>

                {/* Export Options */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Export:</span>
                  <Button variant="outline" size="sm" onClick={handleGeneratePNG}>
                    <FileImage className="h-4 w-4 mr-1" />
                    PNG
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerateSVG}>
                    <Download className="h-4 w-4 mr-1" />
                    SVG
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                </div>
              </div>
            </div>

            {/* Interactive Legend/Filter Panel */}
            {showLegend && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Connection Quality Filters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Connection Quality</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="filter-automated"
                          checked={filters.automated}
                          onChange={() => handleFilterChange('automated')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="filter-automated" className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          Automated ({connections.filter(c => c.quality === 'automated').length})
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="filter-semi-automated"
                          checked={filters.semiAutomated}
                          onChange={() => handleFilterChange('semiAutomated')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="filter-semi-automated" className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          Semi-automated ({connections.filter(c => c.quality === 'semi-automated').length})
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="filter-manual"
                          checked={filters.manual}
                          onChange={() => handleFilterChange('manual')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="filter-manual" className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          Manual ({connections.filter(c => c.quality === 'manual').length})
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Connection Direction Filters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Connection Direction</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="filter-one-way"
                          checked={filters.oneWay}
                          onChange={() => handleFilterChange('oneWay')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="filter-one-way" className="flex items-center gap-2 text-sm">
                          <span>→</span>
                          One-way ({connections.filter(c => c.direction === 'one-way').length})
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="filter-bidirectional"
                          checked={filters.bidirectional}
                          onChange={() => handleFilterChange('bidirectional')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="filter-bidirectional" className="flex items-center gap-2 text-sm">
                          <span>↔</span>
                          Bidirectional ({connections.filter(c => c.direction === 'bidirectional').length})
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>Total Systems: <strong>{systems.length}</strong></span>
                    <span>Total Connections: <strong>{connections.length}</strong></span>
                    <span>Filtered Connections: <strong>{filteredConnections.length}</strong></span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Interactive Visualization</h3>
              <p className="text-gray-600 mb-4">
                Select a visualization type to view and export your integration map. Use the controls above to zoom, filter, and export.
              </p>
              
              <Tabs defaultValue="network" className="w-full mb-6" onValueChange={setActiveVisualization}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="network">Network Diagram</TabsTrigger>
                  <TabsTrigger value="matrix">Integration Matrix</TabsTrigger>
                  <TabsTrigger value="sankey">Data Flow Diagram</TabsTrigger>
                  <TabsTrigger value="reactflow">ReactFlow Canvas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="network" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Network Diagram</CardTitle>
                      <CardDescription>
                        Systems represented as nodes with connections shown as directional arrows.
                        Visualize your system relationships and data flows.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-6 h-[600px] overflow-hidden">
                      {systems.length > 0 && filteredConnections.length > 0 ? (
                        <div 
                          ref={vizRef}
                          style={{ 
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center',
                            transition: 'transform 0.2s ease-in-out'
                          }}
                        >
                          <NetworkDiagram 
                            systems={systems} 
                            connections={filteredConnections} 
                            width={700} 
                            height={500}
                            title="System Network Diagram"
                            subtitle={`${systems.length} Systems and ${filteredConnections.length} Connections (Filtered)`}
                            showExportLabels={activeVisualization === 'network'}
                          />
                        </div>
                      ) : filteredConnections.length === 0 && connections.length > 0 ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 border rounded-md">
                          <p className="text-gray-500 text-center">
                            No connections match the current filter settings.<br />
                            Adjust the filters above to show connections.
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 border rounded-md">
                          <p className="text-gray-500 text-center">
                            Add systems and connections to generate a network diagram.<br />
                            You can drag nodes to reposition them in the visualization.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="matrix" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Integration Matrix</CardTitle>
                      <CardDescription>
                        Grid showing all systems on both axes with intersection cells showing connection type and direction.
                        Provides a comprehensive view of your integration landscape.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-6 h-[600px] overflow-auto">
                      {systems.length > 0 ? (
                        <div 
                          ref={vizRef}
                          style={{ 
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center',
                            transition: 'transform 0.2s ease-in-out'
                          }}
                        >
                          <IntegrationMatrix 
                            systems={systems} 
                            connections={filteredConnections} 
                            width={Math.max(700, systems.length * 100)} 
                            height={Math.max(500, systems.length * 100)}
                            title="System Integration Matrix"
                            subtitle={`Connection Map for ${systems.length} Systems (${filteredConnections.length} Filtered Connections)`}
                            showExportLabels={activeVisualization === 'matrix'}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 border rounded-md">
                          <p className="text-gray-500 text-center">
                            Add systems and connections to generate an integration matrix.<br />
                            The matrix shows the relationship between each system pair.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="sankey" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Flow Diagram</CardTitle>
                      <CardDescription>
                        Visual representation of data flow between systems.
                        Shows the volume and direction of information exchange between your systems.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-6 h-[600px] overflow-hidden">
                      {systems.length > 1 && filteredConnections.length > 0 ? (
                        <div 
                          ref={vizRef}
                          style={{ 
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center',
                            transition: 'transform 0.2s ease-in-out'
                          }}
                        >
                          <SankeyDiagram 
                            systems={systems} 
                            connections={filteredConnections} 
                            width={700} 
                            height={500}
                            title="Data Flow Diagram"
                            subtitle={`Integration Flow for ${systems.length} Systems (${filteredConnections.length} Filtered Connections)`}
                            showExportLabels={activeVisualization === 'sankey'}
                          />
                        </div>
                      ) : filteredConnections.length === 0 && connections.length > 0 ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 border rounded-md">
                          <p className="text-gray-500 text-center">
                            No connections match the current filter settings.<br />
                            Adjust the filters above to show connections.
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 border rounded-md">
                          <p className="text-gray-500 text-center">
                            Add systems and connections to generate a data flow diagram.<br />
                            The diagram shows the relationships between your systems.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reactflow" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>ReactFlow Canvas</CardTitle>
                      <CardDescription>
                        Interactive draggable network diagram with enhanced controls.
                        Visualize your system relationships with more flexibility.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-6 h-[600px] overflow-hidden">
                      {systems.length > 0 && filteredConnections.length > 0 ? (
                        <div 
                          ref={vizRef} 
                          className="w-full h-full"
                          style={{ 
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center',
                            transition: 'transform 0.2s ease-in-out'
                          }}
                        >
                          <DependencyMapper 
                            systems={systems} 
                            connections={filteredConnections} 
                            title="System Dependency Map"
                            subtitle={`${systems.length} Systems and ${filteredConnections.length} Connections`}
                            showExportLabels={activeVisualization === 'reactflow'}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 border rounded-md">
                          <p className="text-gray-500 text-center">
                            Add systems and connections to generate an interactive flow diagram.<br />
                            You can drag nodes, pan, and zoom to explore your system relationships.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
              
              <div className="flex justify-center mt-6 space-x-4">
                <Button variant="outline" onClick={handleGeneratePDF}>
                  <span className="material-icons mr-2">picture_as_pdf</span>
                  Export as PDF
                </Button>
                <Button variant="outline" onClick={handleGeneratePNG}>
                  <span className="material-icons mr-2">image</span>
                  Export as PNG
                </Button>

              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <Link href="/resources">
              <Button variant="outline" className="mr-4">
                <span className="material-icons mr-1 text-sm">arrow_back</span>
                Back
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Integration Mapping Tool</h2>
              <p className="mt-2 text-lg text-gray-600">
                Create visual representations of your healthcare system integrations
              </p>
            </div>
          </div>
          
          {/* Steps indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="text-sm mt-2">System Inventory</span>
              </div>
              <div className={`h-1 flex-grow mx-2 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="text-sm mt-2">Connection Mapping</span>
              </div>
              <div className={`h-1 flex-grow mx-2 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="text-sm mt-2">Visualizations</span>
              </div>
            </div>
          </div>
          
          {/* Step content */}
          {renderStepContent()}
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="outline" onClick={handlePreviousStep}>
                <span className="material-icons mr-2">arrow_back</span>
                Previous
              </Button>
            ) : (
              <div></div>
            )}
            
            {step < 3 && (
              <Button onClick={handleNextStep}>
                Next
                <span className="material-icons ml-2">arrow_forward</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}