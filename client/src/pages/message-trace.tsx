import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Terminal,
  Search,
  FileText,
  Zap,
  Shield,
  Clock,
  Copy,
  ChevronRight,
  Monitor,
  HardDrive,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useLocation } from 'wouter';

const USAGE_EXAMPLES = [
  {
    title: 'Search by Patient ID',
    command: '.\\Search-HL7Message.ps1 -FolderPath "C:\\HL7\\Archive" -PID "MRN12345"',
    description: 'Searches all .hl7 files recursively for messages where PID-3 contains MRN12345.',
  },
  {
    title: 'Search by Visit Number with Full Message',
    command: '.\\Search-HL7Message.ps1 -FolderPath "D:\\Interfaces\\Inbound" -Visit "V20240215001" -ShowFullMessage',
    description: 'Finds messages with the specified visit number and displays the complete HL7 message content.',
  },
  {
    title: 'Search by Location',
    command: '.\\Search-HL7Message.ps1 -FolderPath "C:\\HL7\\Archive\\2024" -Location "ICU"',
    description: 'Locates all messages where PV1-3 (patient location) contains ICU.',
  },
  {
    title: 'Multi-Criteria Search',
    command: '.\\Search-HL7Message.ps1 -FolderPath "C:\\HL7\\Archive" -PID "12345" -Location "ER" -Visit "V2024"',
    description: 'Combined search: messages must match Patient ID, location, AND visit number criteria.',
  },
  {
    title: 'Wildcard Search',
    command: '.\\Search-HL7Message.ps1 -FolderPath "C:\\HL7\\Today" -PID "*789"',
    description: 'Finds any Patient ID ending with 789 using wildcard notation.',
  },
];

const SCENARIOS = [
  {
    icon: <Search className="w-5 h-5" />,
    title: 'Patient Data Investigation',
    description: 'A patient reports missing lab results. Verify if ADT or ORU messages were sent by scanning archived HL7 files with the patient MRN.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Interface Troubleshooting',
    description: 'An interface between the EMR and billing system fails. Filter by PV1-3 location to check if location codes are transmitted correctly.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Visit Number Audit',
    description: 'Compliance officers trace all HL7 messages for a specific visit. Search by PV1-19 to find all ADT, ORM, ORU messages for that encounter.',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Emergency Production Support',
    description: 'At 2 AM, a critical interface stops. Rapidly examine recent messages to identify patterns without needing database access or complex tools.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Multi-Criteria Investigation',
    description: 'Duplicate medication orders for a patient in a specific unit. Search by both Patient ID AND location to narrow down the exact messages.',
  },
];

const PARAMETERS = [
  { name: '-FolderPath', required: true, description: 'Path to the folder containing .hl7 files. The script recursively searches all subdirectories.' },
  { name: '-PID', required: false, description: 'Patient Identifier to search for in PID-3 field. Supports partial matches and wildcards. Extracts the first component before the ^ symbol.' },
  { name: '-Visit', required: false, description: 'Visit Number to search for in PV1-19 field. Supports partial matches.' },
  { name: '-Location', required: false, description: 'Patient Location to search for in PV1-3 field. Supports partial matches.' },
  { name: '-ShowFullMessage', required: false, description: 'When specified, displays the complete HL7 message content for each match. Useful for detailed debugging.' },
];

export default function MessageTracePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeExample, setActiveExample] = useState(0);
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);

  const fetchScriptContent = async () => {
    if (scriptContent) return;
    setLoadingScript(true);
    try {
      const res = await fetch('/api/downloads/message-trace/content');
      const data = await res.json();
      setScriptContent(data.content);
    } catch {
      toast({ title: 'Error', description: 'Failed to load script content.', variant: 'destructive' });
    } finally {
      setLoadingScript(false);
    }
  };

  const downloadScript = () => {
    const link = document.createElement('a');
    link.href = '/api/downloads/message-trace';
    link.download = 'Search-HL7Message.ps1';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Download started', description: 'Search-HL7Message.ps1 has been downloaded.' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Command copied to clipboard.' });
  };

  const copyScript = async () => {
    if (!scriptContent) {
      const res = await fetch('/api/downloads/message-trace/content');
      const data = await res.json();
      setScriptContent(data.content);
      navigator.clipboard.writeText(data.content);
    } else {
      navigator.clipboard.writeText(scriptContent);
    }
    toast({ title: 'Copied', description: 'Script copied to clipboard.' });
  };

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-gray-500 hover:text-gray-700"
          onClick={() => setLocation('/resources')}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Resources
        </Button>

        <div className="mb-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Terminal className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">MessageTrace</h1>
                  <p className="text-lg text-primary font-medium">Find patient messages in seconds — zero dependencies.</p>
                </div>
              </div>
              <p className="mt-3 text-gray-600 max-w-3xl">
                MessageTrace is a lightweight PowerShell tool for healthcare IT professionals to rapidly locate HL7 messages in production archives. Search by patient ID, visit number, or location across thousands of files in seconds. No database setup, no external dependencies — just pure PowerShell efficiency for critical incident response.
              </p>
            </div>
            <Button size="lg" onClick={downloadScript} className="shrink-0 shadow-md">
              <Download className="w-5 h-5 mr-2" />
              Download Script
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <Badge variant="secondary" className="text-xs"><Terminal className="w-3 h-3 mr-1" /> PowerShell 5.1+</Badge>
            <Badge variant="secondary" className="text-xs"><HardDrive className="w-3 h-3 mr-1" /> Zero Dependencies</Badge>
            <Badge variant="secondary" className="text-xs"><Zap className="w-3 h-3 mr-1" /> Sub-Second Search</Badge>
            <Badge variant="secondary" className="text-xs"><Monitor className="w-3 h-3 mr-1" /> Windows Server / Desktop</Badge>
            <Badge variant="outline" className="text-xs">v2.0</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full" onValueChange={(val) => { if (val === 'script') fetchScriptContent(); }}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage & Examples</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
            <TabsTrigger value="script">View Script</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="w-5 h-5 text-primary" />
                      Key Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { icon: <FileText className="w-4 h-4" />, title: 'Multi-Message Files', desc: 'Handles .hl7 files with multiple messages separated by MSH segments' },
                        { icon: <Search className="w-4 h-4" />, title: 'Flexible Search', desc: 'Search by Patient ID (PID-3), Visit Number (PV1-19), or Location (PV1-3)' },
                        { icon: <Shield className="w-4 h-4" />, title: 'Robust Error Handling', desc: 'Continues processing when encountering corrupted or malformed files' },
                        { icon: <Clock className="w-4 h-4" />, title: 'Performance Metrics', desc: 'Reports execution time, files scanned, messages processed, and match count' },
                        { icon: <Terminal className="w-4 h-4" />, title: 'Full Message Display', desc: 'Optional -ShowFullMessage parameter for complete HL7 message content' },
                        { icon: <Zap className="w-4 h-4" />, title: 'Intelligent Parsing', desc: 'Extracts primary identifiers from composite HL7 fields (ID^Type^System)' },
                      ].map((feature, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                          <div className="text-primary mt-0.5">{feature.icon}</div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-900">{feature.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Use Case Scenarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {SCENARIOS.map((scenario, i) => (
                        <div key={i} className="flex gap-3 p-3 border rounded-lg">
                          <div className="text-primary mt-0.5">{scenario.icon}</div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-900">{scenario.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{scenario.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Monitor className="w-5 h-5 text-primary" />
                      System Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'OS', value: 'Windows Server 2012 R2+, Windows 10/11' },
                      { label: 'PowerShell', value: '5.1 or higher (7+ recommended)' },
                      { label: 'Permissions', value: 'Read access to HL7 directories' },
                      { label: 'Disk Space', value: 'Minimal (no installation)' },
                      { label: 'Dependencies', value: 'None' },
                    ].map((req, i) => (
                      <div key={i} className="flex justify-between items-start text-sm">
                        <span className="text-gray-500 font-medium">{req.label}</span>
                        <span className="text-gray-800 text-right max-w-[60%]">{req.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Quick Start
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {[
                        { step: 'Download the script using the button above' },
                        { step: 'Save as Search-HL7Message.ps1' },
                        { step: 'Set execution policy if needed:', code: 'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser' },
                        { step: 'Run your first search:', code: '.\\Search-HL7Message.ps1 -FolderPath "C:\\HL7\\Archive" -PID "12345"' },
                      ].map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          <div className="text-sm">
                            <p className="text-gray-700">{item.step}</p>
                            {item.code && (
                              <div className="mt-1 bg-gray-900 text-green-400 text-xs font-mono p-2 rounded flex items-center justify-between gap-2">
                                <code className="break-all">{item.code}</code>
                                <button onClick={() => copyToClipboard(item.code!)} className="text-gray-400 hover:text-white shrink-0">
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">Performance</h4>
                        <ul className="mt-2 space-y-1 text-xs text-gray-600">
                          <li>&lt; 100 files: 1-3 seconds</li>
                          <li>100-1,000 files: 5-30 seconds</li>
                          <li>&gt; 1,000 files: 30s - 2 minutes</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Syntax</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg overflow-x-auto">
                      <code>.\\Search-HL7Message.ps1 -FolderPath &lt;path&gt; [-PID &lt;id&gt;] [-Visit &lt;number&gt;] [-Location &lt;loc&gt;] [-ShowFullMessage]</code>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Examples</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {USAGE_EXAMPLES.map((example, i) => (
                        <div
                          key={i}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${activeExample === i ? 'border-primary bg-primary/5' : 'hover:border-gray-300'}`}
                          onClick={() => setActiveExample(i)}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2">
                              <ChevronRight className={`w-4 h-4 transition-transform ${activeExample === i ? 'rotate-90 text-primary' : 'text-gray-400'}`} />
                              {example.title}
                            </h4>
                            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(example.command); }} className="text-gray-400 hover:text-primary">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          {activeExample === i && (
                            <div className="mt-3 ml-6">
                              <div className="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded mb-2 overflow-x-auto">
                                <code>{example.command}</code>
                              </div>
                              <p className="text-xs text-gray-500">{example.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sample Output</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-gray-300 font-mono text-xs p-4 rounded-lg space-y-1 overflow-x-auto">
                      <p className="text-cyan-400">========================================</p>
                      <p className="text-cyan-400">       HL7 MESSAGE SEARCH TOOL</p>
                      <p className="text-cyan-400">========================================</p>
                      <p>Search Folder: C:\HL7\Archive</p>
                      <p className="text-yellow-400">Search Criteria:</p>
                      <p>  - Patient ID (PID-3): 12345</p>
                      <p className="text-cyan-400">========================================</p>
                      <p></p>
                      <p className="text-green-400">█████ MATCH FOUND █████</p>
                      <p className="text-green-400">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                      <p>File Path:        <span className="text-white">C:\HL7\Archive\2024-02-15\messages.hl7</span></p>
                      <p>Message ID:       <span className="text-white">MSG20240215123456</span></p>
                      <p>Patient ID:       <span className="text-cyan-400">12345</span></p>
                      <p>  Full PID-3:     <span className="text-gray-500">12345^MRN^HospitalA</span></p>
                      <p>Visit Number:     <span className="text-cyan-400">V20240215001</span></p>
                      <p>Location:         <span className="text-cyan-400">ER^EmergencyDept^Building1</span></p>
                      <p className="text-green-400">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                      <p></p>
                      <p className="text-white">╔════════════════════════════════════════╗</p>
                      <p className="text-white">║       SEARCH SUMMARY REPORT            ║</p>
                      <p className="text-white">╚════════════════════════════════════════╝</p>
                      <p></p>
                      <p>Files Scanned:       <span className="text-cyan-400">157</span></p>
                      <p>Messages Scanned:    <span className="text-cyan-400">3,842</span></p>
                      <p>Matches Found:       <span className="text-green-400">12</span></p>
                      <p>Errors Encountered:  <span className="text-gray-500">0</span></p>
                      <p>Execution Time:      <span className="text-gray-500">4.73 seconds</span></p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Start with broad criteria, then narrow down</li>
                      <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Use wildcards (*) when unsure of exact format</li>
                      <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Organize HL7 files by date for faster targeted searches</li>
                      <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Only use -ShowFullMessage when needed to keep output clean</li>
                      <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Save search commands as shortcuts for recurring investigations</li>
                      <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Copy output to incident docs for reference</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Troubleshooting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { issue: 'No matches found', fix: 'Verify search criteria format matches your HL7 files. Try wildcards or partial matches.' },
                      { issue: 'Script execution blocked', fix: 'Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser' },
                      { issue: 'Slow on large folders', fix: 'Narrow the folder path to a specific date range. Use more specific search criteria.' },
                      { issue: 'File processing errors', fix: 'Usually caused by corrupted files or permission issues. Check the error count in the summary.' },
                    ].map((item, i) => (
                      <div key={i}>
                        <h4 className="text-sm font-medium text-gray-900">{item.issue}</h4>
                        <p className="text-xs text-gray-500 mt-1">{item.fix}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reference">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {PARAMETERS.map((param, i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-bold text-primary">{param.name}</code>
                          <Badge variant={param.required ? 'default' : 'outline'} className="text-[10px]">
                            {param.required ? 'Required' : 'Optional'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{param.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">HL7 Fields Searched</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { field: 'MSH-10', desc: 'Message Control ID (unique identifier for each message)' },
                        { field: 'PID-3', desc: 'Patient Identifier List (composite: ID^Type^System). Extracts primary ID component.' },
                        { field: 'PV1-3', desc: 'Assigned Patient Location' },
                        { field: 'PV1-19', desc: 'Visit Number' },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-primary font-bold shrink-0">{item.field}</code>
                          <p className="text-xs text-gray-600">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Search Logic</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-600">
                    <p>Uses PowerShell's <code className="bg-gray-100 px-1 rounded">-like</code> operator with wildcards:</p>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-1 font-mono text-xs">
                      <p><span className="text-primary">*</span> matches any number of characters</p>
                      <p><span className="text-primary">?</span> matches a single character</p>
                    </div>
                    <p>Searches are <strong>case-insensitive</strong> by default. All provided criteria must match (AND logic).</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sample HL7 Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-gray-300 font-mono text-[11px] p-3 rounded-lg leading-relaxed overflow-x-auto">
                      <p>MSH|^~\&|SENDING_APP|FACILITY|RECEIVING_APP|FACILITY|20240215123456||ADT^A01|MSG20240215123456|P|2.5</p>
                      <p>EVN|A01|20240215123456</p>
                      <p>PID|||<span className="text-cyan-400">12345^MRN^HospitalA</span>||DOE^JOHN||19800101|M</p>
                      <p>PV1||I|<span className="text-cyan-400">ER^EmergencyDept^Building1</span>|||||||||||||||<span className="text-cyan-400">V20240215001</span></p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                      <Badge variant="outline" className="text-[10px]">PID-3: Patient ID</Badge>
                      <Badge variant="outline" className="text-[10px]">PV1-3: Location</Badge>
                      <Badge variant="outline" className="text-[10px]">PV1-19: Visit Number</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="script">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Search-HL7Message.ps1
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyScript}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" onClick={downloadScript}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full">
                  {loadingScript ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-gray-500">Loading script...</span>
                    </div>
                  ) : scriptContent ? (
                    <pre className="bg-gray-900 text-gray-300 font-mono text-xs p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {scriptContent}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-gray-500">Loading script...</span>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}