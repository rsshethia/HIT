import React, { useState, useEffect } from 'react';
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
import { toast } from '@/hooks/use-toast';
// Network diagram removed per user request
import IntegrationMatrix from '@/components/integration-matrix';
import ForceDirectedGraph from '@/components/sankey-diagram';

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
  const [activeVisualization, setActiveVisualization] = useState<string>('matrix');
  
  // For connection setup
  const [sourceSystem, setSourceSystem] = useState<string>('');
  const [targetSystem, setTargetSystem] = useState<string>('');
  const [direction, setDirection] = useState<'one-way' | 'bidirectional'>('one-way');
  const [quality, setQuality] = useState<'automated' | 'semi-automated' | 'manual'>('automated');
  const [dataVolume, setDataVolume] = useState<number>(10);

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
      quality,
      volume: dataVolume
    };
    
    setConnections([...connections, newConnection]);
    
    // If bidirectional, add the reverse connection too
    if (direction === 'bidirectional') {
      const reverseConnection: Connection = {
        source: targetSystem,
        target: sourceSystem,
        direction,
        quality,
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
  
  // Handle generating the PDF (placeholder for future implementation)
  const handleGeneratePDF = () => {
    toast({
      title: "PDF Generation",
      description: "PDF export functionality will be implemented in a future update.",
    });
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
                Define the connections between your systems. For each connection, specify the source and target systems,
                the direction of data flow, and the quality of integration.
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
                
                <div>
                  <Label htmlFor="quality" className="mb-2 block">Integration Quality</Label>
                  <Select value={quality} onValueChange={value => setQuality(value as 'automated' | 'semi-automated' | 'manual')}>
                    <SelectTrigger id="quality">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automated">Automated</SelectItem>
                      <SelectItem value="semi-automated">Semi-automated</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="dataVolume" className="mb-2 block">Data Volume (messages/hour)</Label>
                  <Input 
                    id="dataVolume" 
                    type="number" 
                    min="1" 
                    max="1000"
                    value={dataVolume} 
                    onChange={(e) => setDataVolume(parseInt(e.target.value) || 10)}
                  />
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                connection.quality === 'automated' ? 'bg-green-100 text-green-800' :
                                connection.quality === 'semi-automated' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {connection.quality === 'automated' ? 'Automated' :
                                 connection.quality === 'semi-automated' ? 'Semi-automated' : 'Manual'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {connection.volume} msg/hr
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
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Visualization Selection</h3>
              <p className="text-gray-600 mb-4">
                Select a visualization type to view and export your integration map.
              </p>
              
              <Tabs defaultValue="matrix" className="w-full mb-6" onValueChange={setActiveVisualization}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="matrix">Integration Matrix</TabsTrigger>
                  <TabsTrigger value="sankey">Force-Directed Graph</TabsTrigger>
                </TabsList>
                
                <TabsContent value="matrix" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Integration Matrix</CardTitle>
                      <CardDescription>
                        Grid showing all systems on both axes with intersection cells showing connection type and direction.
                        Color-coded cells based on integration quality.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-6 h-[600px] overflow-auto">
                      {systems.length > 0 ? (
                        <IntegrationMatrix 
                          systems={systems} 
                          connections={connections} 
                          width={Math.max(700, systems.length * 100)} 
                          height={Math.max(500, systems.length * 100)}
                        />
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
                      <CardTitle>Patent Suits Style Force-Directed Graph</CardTitle>
                      <CardDescription>
                        Interactive force-directed graph showing systems and their connections with directional arrows.
                        Colors represent integration quality and line thickness shows data volume.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-6 h-[600px] overflow-hidden">
                      {systems.length > 1 && connections.length > 0 ? (
                        <SankeyDiagram 
                          systems={systems} 
                          connections={connections} 
                          width={700} 
                          height={500}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 border rounded-md">
                          <p className="text-gray-500 text-center">
                            Add systems and connections to generate an interactive force-directed graph.<br />
                            You can drag nodes to better visualize system relationships.
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
                <Button variant="outline">
                  <span className="material-icons mr-2">image</span>
                  Export as PNG
                </Button>
                {activeVisualization === 'matrix' && (
                  <Button variant="outline">
                    <span className="material-icons mr-2">table_view</span>
                    Export as Excel
                  </Button>
                )}
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