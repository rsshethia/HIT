import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Download,
  Copy,
  FileCode,
  Save,
  History,
  Trash2,
  Play,
  Book,
  LayoutTemplate,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import plantumlEncoder from 'plantuml-encoder';

const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';

// Template Library Data
const TEMPLATE_LIBRARY = [
  {
    id: "clinical",
    title: "Clinical Workflows",
    items: [
      {
        id: "patient-reg",
        title: "Patient Registration",
        description: "Standard ADT A04 registration flow with MPI query",
        code: `@startuml
title Patient Registration Flow
actor Patient
participant "Registration Desk" as Desk
participant "ADT System" as ADT
database "MPI" as MPI

Patient -> Desk: Request Registration
Desk -> ADT: Enter Patient Details
ADT -> MPI: Query Existing Patient (QBP^Q22)
MPI --> ADT: Patient Not Found (RSP^K22)
ADT -> ADT: Create New Record
ADT -> MPI: Register Patient (ADT^A04)
MPI --> ADT: ACK
ADT --> Desk: Registration Complete
@enduml`
      },
      {
        id: "lab-order",
        title: "Lab Order Cycle",
        description: "CPOE to LIS order and result workflow",
        code: `@startuml
title Lab Order Workflow
actor Physician
participant "CPOE" as CPOE
participant "Interface Engine" as IE
participant "LIS" as LIS
participant "Analyzer" as Machine

Physician -> CPOE: Place Lab Order
CPOE -> IE: ORM^O01 (Order)
IE -> LIS: ORM^O01
LIS -> Machine: Download Order
Machine -> Machine: Process Sample
Machine -> LIS: ORU^R01 (Results)
LIS -> IE: ORU^R01
IE -> CPOE: ORU^R01
CPOE -> Physician: Alert Results Available
@enduml`
      },
      {
        id: "radiology",
        title: "Radiology Workflow",
        description: "Order to PACS image storage flow",
        code: `@startuml
title Radiology Workflow
participant "RIS" as RIS
participant "Modality" as Modality
participant "PACS" as PACS

RIS -> Modality: DICOM MWL (Worklist)
Modality -> Modality: Perform Scan
Modality -> PACS: DICOM Store (Images)
PACS --> Modality: ACK
Modality -> RIS: MPPS (Completed)
@enduml`
      }
    ]
  },
  {
    id: "technical",
    title: "Technical Architecture",
    items: [
      {
        id: "system-integration",
        title: "Point-to-Point Integration",
        description: "Basic system-to-system message exchange",
        code: `@startuml
title System Integration
participant "Source System" as Source
participant "Integration Engine" as Engine
participant "Destination System" as Dest

Source -> Engine: Send Message
Engine -> Engine: Transform Data
Engine -> Dest: Forward Message
Dest --> Engine: Acknowledge
Engine --> Source: ACK
@enduml`
      },
      {
        id: "api-gateway",
        title: "API Gateway Pattern",
        description: "REST API facade pattern",
        code: `@startuml
title API Gateway Pattern
actor Client
participant "API Gateway" as Gateway
participant "Auth Service" as Auth
participant "Patient Service" as Patient
participant "Billing Service" as Billing

Client -> Gateway: GET /patients/123
Gateway -> Auth: Validate Token
Auth --> Gateway: Token Valid
Gateway -> Patient: Get Patient Details
Patient --> Gateway: Patient Data
Gateway -> Billing: Get Balance
Billing --> Gateway: Balance Data
Gateway --> Client: Combined Response
@enduml`
      }
    ]
  },
  {
    id: "network",
    title: "Network Diagrams",
    items: [
      {
        id: "deployment",
        title: "Simple Deployment",
        description: "Web server and database deployment",
        code: `@startuml
title Simple Deployment
node "Web Server" {
  [Web App]
}
database "Database" {
  [SQL DB]
}
[Web App] --> [SQL DB]: JDBC
@enduml`
      }
    ]
  }
];

interface SavedDiagram {
  id: number;
  name: string;
  code: string;
  createdAt: string;
}

export default function IntegrationArchitect() {
  const { toast } = useToast();
  const [code, setCode] = useState(TEMPLATE_LIBRARY[1].items[0].code); // Default to System Integration
  const [imageUrl, setImageUrl] = useState('');
  const [format, setFormat] = useState<'svg' | 'png'>('svg');
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Saved Diagrams State
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [diagramName, setDiagramName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load saved diagrams on mount
  useEffect(() => {
    fetchDiagrams();
  }, []);

  const fetchDiagrams = async () => {
    try {
      const res = await fetch('/api/diagrams');
      if (res.ok) {
        const data = await res.json();
        setSavedDiagrams(data);
      }
    } catch (error) {
      console.error("Failed to fetch diagrams", error);
      toast({
        title: "Error",
        description: "Failed to load saved diagrams.",
        variant: "destructive"
      });
    }
  };

  // Update image when code changes
  useEffect(() => {
    if (!code.trim()) {
      setImageUrl('');
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      setImageError(false);
      try {
        const encoded = plantumlEncoder.encode(code);
        const url = `${PLANTUML_SERVER}/${format}/${encoded}`;
        setImageUrl(url);
      } catch (error) {
        console.error('Encoding error:', error);
        setIsLoading(false);
        setImageError(true);
      }
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [code, format]);

  const handleImageLoad = () => setIsLoading(false);
  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // Save Diagram Logic
  const handleSaveDiagram = async () => {
    if (!diagramName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your diagram.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/diagrams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: diagramName,
          code: code,
          createdAt: new Date().toLocaleDateString()
        })
      });

      if (res.ok) {
        await fetchDiagrams();
        setDiagramName('');
        toast({
          title: "Saved",
          description: "Diagram saved successfully.",
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save diagram.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDiagram = (diagramCode: string, name: string) => {
    setCode(diagramCode);
    toast({
      title: "Loaded",
      description: `Loaded: ${name}`,
    });
  };

  const handleDeleteDiagram = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/diagrams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDiagrams();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete diagram.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `diagram.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(imageUrl);
    toast({ title: 'Copied!', description: 'Image URL copied to clipboard' });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-neutral-50">
      {/* Header Toolbar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Integration Architect</h1>
              <p className="text-xs text-gray-500">Design & Visualize Healthcare Flows</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Template Library Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Book className="h-4 w-4" />
                Templates
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                  Template Library
                </SheetTitle>
                <SheetDescription>
                  Browse and select from a collection of pre-built integration patterns and workflows.
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
                <Accordion type="single" collapsible className="w-full" defaultValue="clinical">
                  {TEMPLATE_LIBRARY.map((category) => (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="text-sm font-semibold text-gray-800">
                        {category.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-3 pt-2">
                          {category.items.map((template) => (
                            <div
                              key={template.id}
                              className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-all hover:border-primary/50 group"
                              onClick={() => handleLoadDiagram(template.code, template.title)}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-sm text-primary group-hover:text-primary/80">
                                    {template.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {template.description}
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Saved Diagrams Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                Saved
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Saved Diagrams</SheetTitle>
                <SheetDescription>
                  Your personal library of integration diagrams.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex gap-2">
                <Input
                  placeholder="Name current diagram..."
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                />
                <Button onClick={handleSaveDiagram} size="icon">
                  <Save className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
                <div className="space-y-3">
                  {savedDiagrams.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No saved diagrams yet.</p>
                  )}
                  {savedDiagrams.map((diagram) => (
                    <div
                      key={diagram.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors group relative"
                      onClick={() => handleLoadDiagram(diagram.code, diagram.name)}
                    >
                      <div className="font-medium text-sm">{diagram.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{diagram.createdAt}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-red-600"
                        onClick={(e) => handleDeleteDiagram(diagram.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <Button variant="outline" size="sm" onClick={handleCopyUrl} disabled={!imageUrl}>
            <Copy className="h-4 w-4 mr-2" />
            Link
          </Button>

          <Button variant="default" size="sm" onClick={handleDownload} disabled={!imageUrl}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        {/* Editor Panel */}
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="h-full flex flex-col bg-slate-900 text-slate-50">
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">PLANTUML EDITOR</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => navigator.clipboard.writeText(code)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-grow bg-slate-900 border-0 text-slate-50 font-mono text-sm resize-none focus-visible:ring-0 p-4 leading-relaxed"
              spellCheck={false}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Preview Panel */}
        <ResizablePanel defaultSize={60}>
          <div className="h-full flex flex-col bg-neutral-100/50">
            <div className="px-4 py-2 bg-white border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">PREVIEW</span>
                <Tabs value={format} onValueChange={(v) => setFormat(v as 'svg' | 'png')} className="h-6">
                  <TabsList className="h-6 p-0 bg-transparent">
                    <TabsTrigger value="svg" className="h-6 text-xs px-2 data-[state=active]:bg-gray-100">SVG</TabsTrigger>
                    <TabsTrigger value="png" className="h-6 text-xs px-2 data-[state=active]:bg-gray-100">PNG</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {isLoading && <span className="text-xs text-primary animate-pulse">Rendering...</span>}
            </div>

            <div className="flex-grow overflow-auto p-8 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Diagram Preview"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="max-w-full shadow-lg bg-white rounded-lg"
                  style={{ display: imageError ? 'none' : 'block' }}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Play className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Enter code to generate diagram</p>
                </div>
              )}

              {imageError && !isLoading && (
                <div className="text-red-500 flex flex-col items-center">
                  <p>Failed to render diagram.</p>
                  <p className="text-xs mt-1">Check your syntax.</p>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
