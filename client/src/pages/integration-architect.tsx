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
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2
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
        description: "ADT A04 registration with MPI lookup and duplicate checking",
        code: `@startuml
title Patient Registration Flow with Duplicate Check
actor Patient
participant "Registration\\nDesk" as Desk
participant "EMR" as EMR
participant "Interface\\nEngine" as IE
database "MPI" as MPI

Patient -> Desk: Arrives for Registration
Desk -> EMR: Enter Demographics

note right of EMR
  Search locally first
  before creating record
end note

EMR -> IE: Query MPI (QBP^Q22)
IE -> MPI: Search Patient
alt Patient Found
  MPI --> IE: Return Match (RSP^K22)
  IE --> EMR: Existing Patient ID
  EMR -> EMR: Link to Existing Record
else New Patient
  MPI --> IE: No Match Found
  IE --> EMR: Create New Patient
  EMR -> IE: Register Patient (ADT^A04)
  IE -> MPI: Store Patient
  MPI --> IE: ACK^A04
end

EMR --> Desk: Registration Complete
Desk -> Patient: Provide Information
@enduml`
      },
      {
        id: "patient-transfer",
        title: "Patient Transfer (ADT A02)",
        description: "Inpatient bed transfer with bed management",
        code: `@startuml
title Patient Transfer Workflow
participant "Nurse Station" as Nurse
participant "EMR" as EMR
participant "Interface\\nEngine" as IE
participant "Bed\\nManagement" as Bed
participant "EVS" as EVS
participant "Dietary" as Diet

Nurse -> EMR: Initiate Transfer Request
EMR -> Bed: Check Bed Availability
Bed --> EMR: Bed Available (Room 402-B)

EMR -> IE: ADT^A02 (Transfer)
activate IE
IE -> Bed: Update Bed Status
IE -> EVS: Clean Previous Room
IE -> Diet: Update Meal Location
IE -> Nurse: Transfer Complete
deactivate IE

note over IE
  A02 contains:
  - Old Location: PV1-3
  - New Location: PV1-6
  - Transfer Reason: PV1-10
end note

EMR --> Nurse: Patient Ready to Move
@enduml`
      },
      {
        id: "lab-order",
        title: "Lab Order & Results",
        description: "Complete CPOE to LIS cycle with critical result handling",
        code: `@startuml
title Lab Order & Results Workflow
actor Physician
participant "CPOE" as CPOE
participant "Interface\\nEngine" as IE
participant "LIS" as LIS
participant "Lab\\nAnalyzer" as Analyzer

== Order Phase ==
Physician -> CPOE: Order CBC Panel
CPOE -> IE: ORM^O01 (New Order)
IE -> LIS: ORM^O01
LIS --> IE: ACK
IE --> CPOE: Order Accepted

== Collection Phase ==
LIS -> LIS: Print Labels
LIS -> Analyzer: Download Orders

== Analysis Phase ==
Analyzer -> Analyzer: Process Sample
Analyzer -> LIS: ORU^R01 (Preliminary)

== Result Review ==
LIS -> LIS: Validate Results
alt Critical Result
  LIS -> IE: ORU^R01 (CRITICAL)
  IE -> CPOE: Alert Physician
  CPOE -> Physician: CRITICAL ALERT
  note right: WBC 2.1 (Critical Low)
else Normal Result
  LIS -> IE: ORU^R01 (Final)
  IE -> CPOE: Post Results
end
@enduml`
      },
      {
        id: "medication-order",
        title: "Medication Order (CPOE to Pharmacy)",
        description: "e-Prescribing with drug interaction checking",
        code: `@startuml
title Medication Order Workflow
actor Physician
participant "CPOE" as CPOE
participant "Clinical\\nDecision\\nSupport" as CDS
participant "Interface\\nEngine" as IE
participant "Pharmacy\\nSystem" as Pharmacy

Physician -> CPOE: Order Medication\\n(Warfarin 5mg PO)
CPOE -> CDS: Check Interactions

alt Drug Interaction Found
  CDS --> CPOE: WARNING: Interaction\\nwith Current Aspirin
  CPOE -> Physician: Display Alert
  Physician -> CPOE: Acknowledge & Continue
else No Interaction
  CDS --> CPOE: Safe to Prescribe
end

CPOE -> IE: RDE^O11 (Pharmacy Order)
IE -> Pharmacy: RDE^O11

Pharmacy -> Pharmacy: Validate Order
alt Order Valid
  Pharmacy --> IE: ACK (Accepted)
  Pharmacy -> Pharmacy: Dispense Medication
else Order Issue
  Pharmacy --> IE: NACK (Rejected)
  IE --> CPOE: Pharmacist Review Required
end
@enduml`
      },
      {
        id: "discharge",
        title: "Patient Discharge (ADT A03)",
        description: "Complete discharge process with billing and notification",
        code: `@startuml
title Patient Discharge Workflow
participant "Nurse" as Nurse
participant "EMR" as EMR
participant "Interface\\nEngine" as IE
participant "Billing" as Billing
participant "Bed\\nManagement" as Bed
participant "Registration" as Reg

Nurse -> EMR: Initiate Discharge
EMR -> EMR: Complete Discharge Summary

EMR -> IE: ADT^A03 (Discharge)
activate IE

par Parallel Notifications
  IE -> Billing: Trigger Final Billing
  Billing -> Billing: Calculate Charges
  and
  IE -> Bed: Release Bed
  Bed -> Bed: Mark Bed Available
  and
  IE -> Reg: Update Patient Status
  Reg -> Reg: Archive Visit
end

deactivate IE
IE --> EMR: Discharge Complete

note right of EMR
  A03 Message includes:
  - Discharge DateTime: PV1-45
  - Discharge Disposition: PV1-36
  - Attending Physician: PV1-7
end note
@enduml`
      }
    ]
  },
  {
    id: "technical",
    title: "Integration Patterns",
    items: [
      {
        id: "interface-engine",
        title: "Interface Engine Architecture",
        description: "Message routing with transformation and filtering",
        code: `@startuml
title Interface Engine Message Flow
participant "Source\\nSystem" as Source
participant "Inbound\\nAdapter" as Inbound
participant "Message\\nQueue" as Queue
participant "Transform\\nEngine" as Transform
participant "Router" as Router
participant "Outbound\\nAdapter" as Outbound
participant "Target\\nSystem" as Target

Source -> Inbound: HL7 Message
activate Inbound
Inbound -> Inbound: Parse & Validate
Inbound -> Queue: Enqueue Message
deactivate Inbound

Queue -> Transform: Dequeue
activate Transform
Transform -> Transform: Apply Mapping Rules
Transform -> Transform: Filter Fields
Transform -> Router: Transformed Message
deactivate Transform

activate Router
Router -> Router: Determine Destination(s)
Router -> Outbound: Route to Target
deactivate Router

activate Outbound
Outbound -> Outbound: Format for Target
Outbound -> Target: Send Message
Target --> Outbound: ACK
Outbound --> Source: Delivery Confirmation
deactivate Outbound
@enduml`
      },
      {
        id: "api-gateway",
        title: "API Gateway with Rate Limiting",
        description: "RESTful API pattern with authentication and throttling",
        code: `@startuml
title API Gateway Pattern
actor "Mobile\\nApp" as Client
participant "API\\nGateway" as Gateway
participant "Rate\\nLimiter" as Limiter
participant "Auth\\nService" as Auth
participant "Patient\\nService" as Patient
database "Cache" as Cache

Client -> Gateway: GET /api/patients/123
activate Gateway

Gateway -> Limiter: Check Rate Limit
alt Rate Limit Exceeded
  Limiter --> Gateway: 429 Too Many Requests
  Gateway --> Client: Error Response
else Within Limit
  Limiter --> Gateway: Continue
  
  Gateway -> Auth: Validate JWT Token
  Auth --> Gateway: Token Valid
  
  Gateway -> Cache: Check Cache
  alt Cache Hit
    Cache --> Gateway: Cached Data
  else Cache Miss
    Gateway -> Patient: Fetch Patient
    Patient --> Gateway: Patient Data
    Gateway -> Cache: Update Cache
  end
  
  Gateway --> Client: 200 OK + Patient Data
end
deactivate Gateway
@enduml`
      },
      {
        id: "pub-sub",
        title: "Publish-Subscribe Pattern",
        description: "Event-driven architecture with message broker",
        code: `@startuml
title Event-Driven Integration (Pub/Sub)
participant "EMR" as EMR
participant "Message\\nBroker" as Broker
participant "Analytics" as Analytics
participant "Reporting" as Report
participant "Alerting" as Alert

EMR -> Broker: Publish Event\\n(PatientAdmitted)
activate Broker

note right of Broker
  Topic: patient.admitted
  Payload: {
    patientId: "12345",
    location: "ICU-3",
    timestamp: "..."
  }
end note

par Parallel Subscribers
  Broker -> Analytics: Deliver Event
  Analytics -> Analytics: Update Dashboard
  and
  Broker -> Report: Deliver Event
  Report -> Report: Generate Census Report
  and
  Broker -> Alert: Deliver Event
  Alert -> Alert: Check Bed Capacity
  alt Capacity Threshold Reached
    Alert -> Alert: Send Alert to Charge Nurse
  end
end

deactivate Broker
@enduml`
      }
    ]
  },
  {
    id: "error-handling",
    title: "Error Handling & Reliability",
    items: [
      {
        id: "retry-pattern",
        title: "Retry with Exponential Backoff",
        description: "Fault-tolerant message delivery with retry logic",
        code: `@startuml
title Retry Pattern with Exponential Backoff
participant "Interface\\nEngine" as IE
participant "Target\\nSystem" as Target
database "Dead Letter\\nQueue" as DLQ

IE -> Target: Send Message (Attempt 1)
Target --> IE: Connection Timeout
note right: Wait 1 second

IE -> Target: Send Message (Attempt 2)
Target --> IE: 503 Service Unavailable
note right: Wait 2 seconds

IE -> Target: Send Message (Attempt 3)
Target --> IE: Connection Refused
note right: Wait 4 seconds

IE -> Target: Send Message (Attempt 4)
Target --> IE: Connection Refused
note right: Wait 8 seconds

IE -> Target: Send Message (Attempt 5)
Target --> IE: Connection Refused

note over IE
  Max retries (5) exceeded
  Move to Dead Letter Queue
end note

IE -> DLQ: Store Failed Message
IE -> IE: Send Alert to Ops Team
@enduml`
      },
      {
        id: "circuit-breaker",
        title: "Circuit Breaker Pattern",
        description: "Prevent cascading failures in distributed systems",
        code: `@startuml
title Circuit Breaker Pattern
participant "Service A" as ServiceA
participant "Circuit\\nBreaker" as CB
participant "Service B" as ServiceB

== Closed State (Normal) ==
ServiceA -> CB: Request
CB -> ServiceB: Forward Request
ServiceB --> CB: Success
CB --> ServiceA: Response
note right of CB: Success Count++

== Failure Threshold Reached ==
ServiceA -> CB: Request
CB -> ServiceB: Forward Request
ServiceB --> CB: Timeout
CB --> ServiceA: Error
note right of CB
  Failure Count++
  Threshold: 5 failures
end note

ServiceA -> CB: Request
CB -> ServiceB: Forward Request
ServiceB --> CB: Error
note right of CB: Circuit OPENS

== Open State (Fast Fail) ==
ServiceA -> CB: Request
CB --> ServiceA: Fail Fast (Circuit Open)
note right of CB
  Don't call Service B
  Return cached/default response
  Wait 30 seconds
end note

== Half-Open State (Testing) ==
CB -> ServiceB: Test Request
ServiceB --> CB: Success
note right of CB: Circuit CLOSES
@enduml`
      },
      {
        id: "idempotency",
        title: "Idempotent Message Processing",
        description: "Prevent duplicate processing with message deduplication",
        code: `@startuml
title Idempotent Message Processing
participant "Source" as Source
participant "Interface\\nEngine" as IE
database "Message\\nStore" as Store
participant "Target" as Target

Source -> IE: Message (ID: MSG-12345)
activate IE
IE -> Store: Check if Message Exists

alt Message Already Processed
  Store --> IE: Message Found
  IE --> Source: ACK (Already Processed)
  note right: Return success\\nwithout reprocessing
else New Message
  Store --> IE: Message Not Found
  IE -> Store: Store Message ID
  IE -> Target: Process Message
  Target --> IE: Success
  IE -> Store: Mark as Processed
  IE --> Source: ACK
end
deactivate IE

note over Store
  Message Store tracks:
  - Message ID
  - Timestamp
  - Processing Status
  - TTL (e.g., 24 hours)
end note
@enduml`
      }
    ]
  },
  {
    id: "fhir",
    title: "FHIR & Modern Standards",
    items: [
      {
        id: "fhir-patient",
        title: "FHIR Patient Query",
        description: "RESTful FHIR API patient search and retrieve",
        code: `@startuml
title FHIR Patient Resource Query
actor "Clinical\\nApp" as App
participant "FHIR\\nServer" as FHIR
database "EHR\\nDatabase" as DB

== Search Patient by Name ==
App -> FHIR: GET /Patient?name=Smith&birthdate=1980-01-15
activate FHIR
FHIR -> DB: Query Patients
DB --> FHIR: Patient Bundle
FHIR --> App: 200 OK + Bundle
deactivate FHIR

note right
  Response: {
    "resourceType": "Bundle",
    "total": 1,
    "entry": [{
      "resource": {
        "resourceType": "Patient",
        "id": "12345",
        "name": [{
          "family": "Smith",
          "given": ["John"]
        }]
      }
    }]
  }
end note

== Retrieve Specific Patient ==
App -> FHIR: GET /Patient/12345
activate FHIR
FHIR -> DB: Get Patient by ID
DB --> FHIR: Patient Resource
FHIR --> App: 200 OK + Patient
deactivate FHIR

== Get Patient's Observations ==
App -> FHIR: GET /Observation?patient=12345&category=vital-signs
FHIR -> DB: Query Observations
DB --> FHIR: Observation Bundle
FHIR --> App: 200 OK + Vitals Bundle
@enduml`
      },
      {
        id: "fhir-create",
        title: "FHIR Resource Creation",
        description: "Create and update FHIR resources with validation",
        code: `@startuml
title FHIR Resource Creation & Update
actor "Provider\\nApp" as App
participant "FHIR\\nServer" as FHIR
participant "Validator" as Valid
database "Database" as DB

== Create New Observation ==
App -> FHIR: POST /Observation
activate FHIR

note left
  {
    "resourceType": "Observation",
    "status": "final",
    "code": {
      "coding": [{
        "system": "http://loinc.org",
        "code": "85354-9",
        "display": "Blood pressure"
      }]
    },
    "subject": {
      "reference": "Patient/12345"
    },
    "valueQuantity": {
      "value": 120,
      "unit": "mmHg"
    }
  }
end note

FHIR -> Valid: Validate Resource
alt Validation Failed
  Valid --> FHIR: Invalid LOINC Code
  FHIR --> App: 400 Bad Request\\n+ OperationOutcome
else Valid Resource
  Valid --> FHIR: Resource Valid
  FHIR -> DB: Store Observation
  DB --> FHIR: ID: obs-789
  FHIR --> App: 201 Created\\nLocation: /Observation/obs-789
end
deactivate FHIR

== Update Existing Resource ==
App -> FHIR: PUT /Observation/obs-789
FHIR -> Valid: Validate Update
Valid --> FHIR: Valid
FHIR -> DB: Update Resource
FHIR --> App: 200 OK + Updated Resource
@enduml`
      },
      {
        id: "oauth-smart",
        title: "SMART on FHIR Authorization",
        description: "OAuth 2.0 authorization flow for FHIR apps",
        code: `@startuml
title SMART on FHIR Authorization Flow
actor "User" as User
participant "App" as App
participant "EHR\\nAuth Server" as Auth
participant "FHIR\\nServer" as FHIR

== Authorization Request ==
User -> App: Launch App
App -> Auth: Authorization Request\\n+ scope=patient/*.read
Auth -> User: Login & Consent Screen
User -> Auth: Approve Access

Auth --> App: Authorization Code
App -> Auth: Exchange Code for Token
Auth --> App: Access Token + Refresh Token

note right of App
  Token includes:
  - patient context
  - scopes granted
  - expiration time
end note

== Access Protected Resources ==
App -> FHIR: GET /Patient/123\\nAuthorization: Bearer {token}
activate FHIR
FHIR -> Auth: Validate Token
Auth --> FHIR: Token Valid + Scopes
FHIR -> FHIR: Check User has Access\\nto Patient 123
FHIR --> App: 200 OK + Patient Data
deactivate FHIR

== Token Refresh ==
App -> Auth: Refresh Token Request
Auth --> App: New Access Token
@enduml`
      }
    ]
  },
  {
    id: "deployment",
    title: "Infrastructure & Deployment",
    items: [
      {
        id: "ha-deployment",
        title: "High Availability Deployment",
        description: "Load-balanced redundant system architecture",
        code: `@startuml
title High Availability Architecture
!define RECTANGLE node

cloud "Internet" as Internet {
}

node "Load Balancer\\n(Active)" as LB1
node "Load Balancer\\n(Standby)" as LB2

package "Application Tier" {
  node "App Server 1" as App1 {
    [API Service]
  }
  node "App Server 2" as App2 {
    [API Service]
  }
  node "App Server 3" as App3 {
    [API Service]
  }
}

package "Database Tier" {
  database "Primary DB" as DB1
  database "Replica DB" as DB2
}

package "Caching Tier" {
  node "Redis Primary" as Redis1
  node "Redis Replica" as Redis2
}

Internet --> LB1
Internet -[dashed]-> LB2: Failover

LB1 --> App1
LB1 --> App2
LB1 --> App3

App1 --> DB1
App2 --> DB1
App3 --> DB1

DB1 -right-> DB2: Replication

App1 --> Redis1
App2 --> Redis1
App3 --> Redis1

Redis1 -right-> Redis2: Sync
@enduml`
      },
      {
        id: "microservices",
        title: "Microservices Architecture",
        description: "Component diagram showing service boundaries",
        code: `@startuml
title Microservices Architecture

package "Client Applications" {
  [Web Portal]
  [Mobile App]
  [Provider App]
}

package "API Gateway Layer" {
  [API Gateway]
  [Auth Service]
}

package "Core Services" {
  [Patient Service]
  [Appointment Service]
  [Billing Service]
  [Clinical Service]
}

package "Supporting Services" {
  [Notification Service]
  [Audit Service]
  [Document Service]
}

database "Patient DB" as PatientDB
database "Appointment DB" as ApptDB
database "Billing DB" as BillDB
database "Clinical DB" as ClinicalDB

queue "Event Bus" as EventBus

[Web Portal] --> [API Gateway]
[Mobile App] --> [API Gateway]
[Provider App] --> [API Gateway]

[API Gateway] --> [Auth Service]
[API Gateway] --> [Patient Service]
[API Gateway] --> [Appointment Service]
[API Gateway] --> [Billing Service]
[API Gateway] --> [Clinical Service]

[Patient Service] --> PatientDB
[Appointment Service] --> ApptDB
[Billing Service] --> BillDB
[Clinical Service] --> ClinicalDB

[Patient Service] ..> EventBus: Publish Events
[Appointment Service] ..> EventBus: Publish Events
[Billing Service] ..> EventBus: Subscribe
[Notification Service] ..> EventBus: Subscribe
[Audit Service] ..> EventBus: Subscribe
@enduml`
      },
      {
        id: "disaster-recovery",
        title: "Disaster Recovery Architecture",
        description: "Multi-region failover deployment",
        code: `@startuml
title Disaster Recovery Architecture

package "Primary Region (US-East)" {
  cloud "DNS\\nFailover" as DNS
  
  node "Production\\nCluster" as ProdCluster {
    [App 1]
    [App 2]
    [App 3]
  }
  
  database "Primary\\nDatabase" as PrimaryDB
  
  node "Backup\\nSystem" as Backup1
}

package "DR Region (US-West)" {
  node "Standby\\nCluster" as DRCluster {
    [App 1 DR]
    [App 2 DR]
    [App 3 DR]
  }
  
  database "Standby\\nDatabase" as StandbyDB
  
  node "Backup\\nSystem" as Backup2
}

cloud "Replication\\nService" as Replication

DNS --> ProdCluster: Active Traffic
DNS -[dashed]-> DRCluster: Failover

PrimaryDB --> Replication: Async\\nReplication
Replication --> StandbyDB

Backup1 -[dashed]-> Backup2: Backup\\nCopy

note right of DNS
  Health checks every 30s
  Auto-failover if primary
  region is unreachable
end note

note right of Replication
  RPO: 15 minutes
  RTO: 1 hour
end note
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
  const [zoom, setZoom] = useState(100);

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
    window.open(imageUrl, '_blank');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(imageUrl);
    toast({ title: 'Copied!', description: 'Image URL copied to clipboard' });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleZoomReset = () => {
    setZoom(100);
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
              <div className="flex items-center gap-2">
                {isLoading && <span className="text-xs text-primary animate-pulse mr-2">Rendering...</span>}
                <div className="flex items-center gap-1 border rounded-md px-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={handleZoomOut}
                    disabled={zoom <= 25}
                    data-testid="button-zoom-out"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-gray-600 min-w-[3rem] text-center font-medium">{zoom}%</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    data-testid="button-zoom-in"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={handleZoomReset}
                    data-testid="button-zoom-reset"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-auto p-8 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Diagram Preview"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="shadow-lg bg-white rounded-lg transition-transform"
                  style={{ 
                    display: imageError ? 'none' : 'block',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center'
                  }}
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
