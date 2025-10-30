import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, FileCode, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import plantumlEncoder from 'plantuml-encoder';

const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';

const EXAMPLE_TEMPLATES = {
  sequence: `@startuml
title Patient Registration Flow

actor Patient
participant "Patient Portal" as Portal
participant "Interface Engine" as Engine
participant "EMR System" as EMR
database "Patient DB" as DB

Patient -> Portal: Register Account
Portal -> Engine: ADT^A04 (Registration)
Engine -> EMR: Forward HL7 Message
EMR -> DB: Store Patient Record
EMR --> Engine: ACK (Acknowledgment)
Engine --> Portal: Confirmation
Portal --> Patient: Registration Complete
@enduml`,

  component: `@startuml
title Healthcare Integration Architecture

package "Clinical Systems" {
  [EMR System]
  [Lab System]
  [PACS Imaging]
}

package "Integration Layer" {
  [Interface Engine]
  [HL7 Router]
}

package "Business Systems" {
  [Billing]
  [Scheduling]
}

database "Central Repository" {
  [Patient Master Index]
  [Clinical Data Warehouse]
}

[EMR System] --> [Interface Engine] : HL7 v2
[Lab System] --> [Interface Engine] : HL7 v2
[PACS Imaging] --> [Interface Engine] : DICOM
[Interface Engine] --> [HL7 Router]
[HL7 Router] --> [Billing] : HL7 v2
[HL7 Router] --> [Scheduling] : HL7 v2
[HL7 Router] --> [Patient Master Index] : FHIR
[HL7 Router] --> [Clinical Data Warehouse] : FHIR
@enduml`,

  usecase: `@startuml
title Healthcare Integration Use Cases

left to right direction
actor "Clinician" as clinician
actor "Patient" as patient
actor "Administrator" as admin

rectangle "Integration Platform" {
  usecase "Register Patient" as UC1
  usecase "Schedule Appointment" as UC2
  usecase "Order Lab Test" as UC3
  usecase "View Results" as UC4
  usecase "Process Billing" as UC5
  usecase "Generate Reports" as UC6
}

patient --> UC1
patient --> UC2
patient --> UC4

clinician --> UC2
clinician --> UC3
clinician --> UC4

admin --> UC5
admin --> UC6

UC3 --> UC4 : <<include>>
UC2 --> UC5 : <<include>>
@enduml`,

  class: `@startuml
title HL7 Message Structure

class HL7Message {
  +messageType: String
  +sendingApplication: String
  +sendingFacility: String
  +timestamp: DateTime
  +validate()
  +encode()
  +decode()
}

class MSHSegment {
  +fieldSeparator: String
  +encodingCharacters: String
  +sendingApplication: String
  +sendingFacility: String
  +messageType: String
}

class PIDSegment {
  +patientId: String
  +patientName: String
  +dateOfBirth: Date
  +gender: String
  +address: String
}

class OBXSegment {
  +setId: Integer
  +valueType: String
  +observationId: String
  +observationValue: String
  +units: String
  +status: String
}

HL7Message *-- "1" MSHSegment
HL7Message *-- "1..*" PIDSegment
HL7Message *-- "0..*" OBXSegment
@enduml`,

  state: `@startuml
title Patient Order Processing Workflow

[*] --> OrderReceived : Receive ORM Message

OrderReceived --> Validating : Validate Order
Validating --> OrderAccepted : Valid Order
Validating --> OrderRejected : Invalid Order

OrderAccepted --> Processing : Send to Lab System
Processing --> ResultsReceived : Receive ORU Message
ResultsReceived --> NotifyingClinician : Send Alert

NotifyingClinician --> Complete
OrderRejected --> Complete
Complete --> [*]

OrderAccepted : Send ACK
Processing : Generate Requisition
ResultsReceived : Parse Results
@enduml`,

  deployment: `@startuml
title Healthcare Integration Infrastructure

node "Production Environment" {
  node "Web Tier" {
    [Load Balancer]
    [Web Server 1]
    [Web Server 2]
  }
  
  node "Application Tier" {
    [Interface Engine]
    [HL7 Router]
    [FHIR Gateway]
  }
  
  node "Data Tier" {
    database "Primary DB" {
      [Patient Records]
    }
    database "Replica DB" {
      [Backup Records]
    }
  }
}

cloud "External Systems" {
  [EMR]
  [Lab]
  [PACS]
  [Billing]
}

[Load Balancer] --> [Web Server 1]
[Load Balancer] --> [Web Server 2]
[Web Server 1] --> [Interface Engine]
[Web Server 2] --> [Interface Engine]
[Interface Engine] --> [HL7 Router]
[HL7 Router] --> [FHIR Gateway]
[FHIR Gateway] --> [Patient Records]
[Patient Records] ..> [Backup Records] : replicate

[EMR] --> [Interface Engine]
[Lab] --> [Interface Engine]
[PACS] --> [Interface Engine]
[Interface Engine] --> [Billing]
@enduml`
};

export default function PlantUMLMapperPage() {
  const { toast } = useToast();
  const [code, setCode] = useState(EXAMPLE_TEMPLATES.sequence);
  const [imageUrl, setImageUrl] = useState('');
  const [format, setFormat] = useState<'svg' | 'png'>('svg');
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!code.trim()) {
      setImageUrl('');
      return;
    }

    setIsLoading(true);
    setImageError(false);

    try {
      const encoded = plantumlEncoder.encode(code);
      const url = `${PLANTUML_SERVER}/${format}/${encoded}`;
      setImageUrl(url);
    } catch (error) {
      console.error('Encoding error:', error);
      toast({
        title: 'Encoding Error',
        description: 'Failed to encode PlantUML diagram',
        variant: 'destructive'
      });
    }
  }, [code, format, toast]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const loadTemplate = (template: keyof typeof EXAMPLE_TEMPLATES) => {
    setCode(EXAMPLE_TEMPLATES[template]);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'PlantUML code copied to clipboard'
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(imageUrl);
    toast({
      title: 'Copied!',
      description: 'Image URL copied to clipboard'
    });
  };

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `diagram.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Downloaded!',
      description: `Diagram saved as diagram.${format}`
    });
  };

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PlantUML Mapping Tool
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Create professional UML diagrams for healthcare integration using PlantUML syntax. 
            Design sequence diagrams, component diagrams, workflow states, and system architectures 
            with simple text-based notation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadTemplate('sequence')}
                data-testid="template-sequence"
              >
                <FileCode className="mr-2 h-4 w-4" />
                Patient Registration Flow
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadTemplate('component')}
                data-testid="template-component"
              >
                <FileCode className="mr-2 h-4 w-4" />
                Integration Architecture
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadTemplate('usecase')}
                data-testid="template-usecase"
              >
                <FileCode className="mr-2 h-4 w-4" />
                Integration Use Cases
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadTemplate('class')}
                data-testid="template-class"
              >
                <FileCode className="mr-2 h-4 w-4" />
                HL7 Message Structure
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadTemplate('state')}
                data-testid="template-state"
              >
                <FileCode className="mr-2 h-4 w-4" />
                Order Processing Workflow
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadTemplate('deployment')}
                data-testid="template-deployment"
              >
                <FileCode className="mr-2 h-4 w-4" />
                Integration Infrastructure
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Getting Started</CardTitle>
              <CardDescription>
                PlantUML uses simple text notation to create diagrams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Basic Syntax:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Start with @startuml, end with @enduml</li>
                    <li>• Arrow: -&gt; for connections</li>
                    <li>• Title: title Your Title Here</li>
                    <li>• Actors: actor Name or participant Name</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Healthcare Examples:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Message flow between systems</li>
                    <li>• HL7 segment relationships</li>
                    <li>• Integration architecture diagrams</li>
                    <li>• Patient journey workflows</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>PlantUML Code</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  data-testid="button-copy-code"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <CardDescription>
                Write your PlantUML diagram syntax here
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter PlantUML code here..."
                className="font-mono text-sm flex-grow min-h-[500px] resize-none"
                data-testid="textarea-plantuml-code"
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Diagram Preview</CardTitle>
                <div className="flex gap-2">
                  <Tabs value={format} onValueChange={(v) => setFormat(v as 'svg' | 'png')}>
                    <TabsList>
                      <TabsTrigger value="svg" data-testid="format-svg">SVG</TabsTrigger>
                      <TabsTrigger value="png" data-testid="format-png">PNG</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUrl}
                    disabled={!imageUrl}
                    data-testid="button-copy-url"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    URL
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!imageUrl || isLoading}
                    data-testid="button-download"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <CardDescription>
                Live preview of your diagram
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center bg-white rounded-md border min-h-[500px] relative overflow-auto">
              {isLoading && (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">Rendering diagram...</span>
                </div>
              )}
              {!isLoading && imageError && (
                <div className="text-center text-gray-400 p-8">
                  <p className="text-sm mb-2">Unable to render diagram</p>
                  <p className="text-xs">Check your PlantUML syntax</p>
                </div>
              )}
              {!isLoading && !imageError && imageUrl && (
                <img
                  src={imageUrl}
                  alt="PlantUML diagram"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="max-w-full h-auto"
                  data-testid="img-diagram-preview"
                />
              )}
              {!imageUrl && !isLoading && (
                <div className="text-center text-gray-400">
                  <p className="text-sm">Enter PlantUML code to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">PlantUML Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <a
                href="https://plantuml.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Official PlantUML Documentation →
              </a>
              <a
                href="https://plantuml.com/sequence-diagram"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Sequence Diagram Guide →
              </a>
              <a
                href="https://plantuml.com/component-diagram"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Component Diagram Guide →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
