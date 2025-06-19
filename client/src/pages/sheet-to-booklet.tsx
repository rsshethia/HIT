import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  Settings, 
  Eye, 
  BookOpen,
  Grid,
  Layout,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

interface ProcessingOptions {
  includeHeaders: boolean;
  autoDetectSections: boolean;
  pageBreakOnSheets: boolean;
  includeTOC: boolean;
  headerStyle: 'simple' | 'professional' | 'modern';
  fontSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  margins: 'narrow' | 'normal' | 'wide';
  useTemplate: boolean;
  templateType: 'system-profile' | 'integration-flow' | 'custom';
}

interface ProcessedSheet {
  name: string;
  data: any[][];
  preview: string;
  rowCount: number;
  columnCount: number;
}

export default function SheetToBookletPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processedSheets, setProcessedSheets] = useState<ProcessedSheet[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    includeHeaders: true,
    autoDetectSections: true,
    pageBreakOnSheets: true,
    includeTOC: true,
    headerStyle: 'professional',
    fontSize: 'medium',
    orientation: 'portrait',
    margins: 'normal',
    useTemplate: false,
    templateType: 'system-profile'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      processFile(uploadedFile);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    
    // Simulate file processing - in a real implementation, this would parse Excel/CSV files
    setTimeout(() => {
      const mockSheets: ProcessedSheet[] = [
        {
          name: "System Inventory",
          data: [
            ["System Name", "Vendor", "Version", "Environment", "Status"],
            ["Epic EHR", "Epic Systems", "2023.1", "Production", "Active"],
            ["Cerner PowerChart", "Oracle Health", "2024.1", "Production", "Active"],
            ["Lab Information System", "Sunquest", "8.2", "Production", "Active"],
            ["PACS", "GE Healthcare", "4.5", "Production", "Active"]
          ],
          preview: "System inventory with 4 active healthcare systems...",
          rowCount: 5,
          columnCount: 5
        },
        {
          name: "Interface Mappings",
          data: [
            ["Source System", "Target System", "Message Type", "Frequency", "Protocol"],
            ["Epic EHR", "Lab System", "ORU^R01", "Real-time", "TCP/IP"],
            ["Epic EHR", "PACS", "ORM^O01", "Real-time", "TCP/IP"],
            ["Lab System", "Epic EHR", "ORU^R01", "Real-time", "TCP/IP"],
            ["PACS", "Epic EHR", "ORU^R01", "Real-time", "TCP/IP"]
          ],
          preview: "Interface mappings between healthcare systems...",
          rowCount: 5,
          columnCount: 5
        },
        {
          name: "Data Flow Specifications",
          data: [
            ["Flow ID", "Description", "Source", "Target", "Business Rules"],
            ["DF001", "Patient Demographics", "Epic", "Lab System", "Real-time sync on updates"],
            ["DF002", "Lab Orders", "Epic", "Lab System", "Immediate transmission"],
            ["DF003", "Lab Results", "Lab System", "Epic", "Auto-result on completion"]
          ],
          preview: "Data flow specifications and business rules...",
          rowCount: 4,
          columnCount: 5
        }
      ];
      
      setProcessedSheets(mockSheets);
      setIsProcessing(false);
    }, 2000);
  };

  const generateBooklet = () => {
    // In a real implementation, this would generate a PDF booklet
    const content = generateBookletContent();
    downloadBooklet(content);
  };

  const getSystemProfileTemplate = () => {
    return `
# System Profile Template

**SYSTEM NAME:** _________________________
**TYPE:** □ EMR  □ Laboratory  □ Pharmacy  □ Imaging  □ Other: _______

## TECHNICAL DETAILS:
- **Vendor:** _________________  
- **Version:** _______________
- **Database:** _______________  
- **OS:** ___________________
- **IP Address:** _____________  
- **Ports:** ________________
- **Interface Engine:** _______________________________

## INTEGRATION CAPABILITIES:
□ HL7 v2.x    Version: ________
□ HL7 FHIR    Version: ________
□ API         Type: ___________
□ File Transfer  Method: ______
□ Database    Direct: _________

## MESSAGE TYPES SUPPORTED:
□ ADT  □ ORM  □ ORU  □ DFT  □ SIU  □ MDM
□ Custom: ____________________________________

## CONTACT INFORMATION:
**Technical Lead:** ______________________________
- **Phone:** _____________ 
- **Email:** __________________

**Vendor Support:** _____________________________
- **Phone:** _____________ 
- **Email:** __________________

## BUSINESS OWNER:
- **Name:** _______________________________________
- **Department:** _________________________________
- **Phone:** _____________ 
- **Email:** __________________

## OPERATING SCHEDULE:
- **Maintenance Windows:** _________________________
- **Peak Usage Times:** ____________________________
- **24/7 Operation:** □ Yes  □ No

---
`;
  };

  const getIntegrationFlowTemplate = () => {
    return `
# Integration Flow Template

**INTEGRATION NAME:** ____________________________
**SOURCE SYSTEM:** ______________________________
**TARGET SYSTEM:** ______________________________

## BUSINESS PURPOSE:
_____________________________________________
_____________________________________________

## TRIGGER EVENT:
What starts this integration?
_____________________________________________

## MESSAGE FLOW:
Source → [Processing Steps] → Target

1. **Step 1:** _____________________________________
2. **Step 2:** _____________________________________
3. **Step 3:** _____________________________________
4. **Step 4:** _____________________________________

## DATA TRANSFORMATION:

| Source Field | Target Field | Notes |
|-------------|-------------|-------|
| ____________ | ____________ | _____ |
| ____________ | ____________ | _____ |
| ____________ | ____________ | _____ |

## ERROR HANDLING:
**What happens when it fails?**
_____________________________________________

**Who gets notified?**
_____________________________________________

**Retry logic:**
_____________________________________________

## TESTING CRITERIA:
□ _________________________________________
□ _________________________________________
□ _________________________________________

## SUCCESS METRICS:
- **Volume:** ___________________________________
- **Timing:** ___________________________________
- **Accuracy:** _________________________________

---
`;
  };

  const generateBookletContent = () => {
    let content = `# Integration Architecture Documentation
## Generated on ${new Date().toLocaleDateString()}

`;

    if (processingOptions.useTemplate) {
      content += `## Documentation Templates\n\n`;
      
      if (processingOptions.templateType === 'system-profile') {
        content += getSystemProfileTemplate();
      } else if (processingOptions.templateType === 'integration-flow') {
        content += getIntegrationFlowTemplate();
      }
      
      content += `\n## Processed Data\n\n`;
    }

    if (processingOptions.includeTOC && processedSheets.length > 0) {
      content += `## Table of Contents
${processedSheets.map((sheet, index) => `${index + 1}. ${sheet.name}`).join('\n')}

---

`;
    }

    if (processedSheets.length > 0) {
      content += processedSheets.map((sheet, index) => `
${processingOptions.pageBreakOnSheets && index > 0 ? '\n---\n' : ''}

## ${index + 1}. ${sheet.name}

${sheet.data.map((row, rowIndex) => {
  if (rowIndex === 0 && processingOptions.includeHeaders) {
    return `| **${row.join('** | **')}** |`;
  }
  return `| ${row.join(' | ')} |`;
}).join('\n')}

**Summary:** ${sheet.preview}
**Data Points:** ${sheet.rowCount} rows × ${sheet.columnCount} columns

`).join('\n');
    }

    content += `\n---
*Generated by HIT Platform - Integration Architecture Documentation Tool*
*Template-based documentation for Integration Architects*`;
    
    return content;
  };

  const downloadBooklet = (content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integration-documentation-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setFile(null);
    setProcessedSheets([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadSampleData = () => {
    setIsProcessing(true);
    
    // Create a mock file object for the sample data
    const mockFile = new File(['sample-data'], 'sample-integration-data.csv', { type: 'text/csv' });
    setFile(mockFile);
    
    // Use the actual sample data from our CSV files
    setTimeout(() => {
      const sampleSheets: ProcessedSheet[] = [
        {
          name: "System Inventory",
          data: [
            ["System Name", "Vendor", "Version", "Environment", "Status", "Message Types", "Integration Method", "IP Address", "Contact"],
            ["Epic EHR", "Epic Systems", "2023.1", "Production", "Active", "ADT, ORM, ORU, DFT", "HL7 v2.5", "10.1.100.50", "john.smith@hospital.org"],
            ["Cerner PowerChart", "Oracle Health", "2024.1", "Production", "Active", "ADT, ORM, ORU, SIU", "HL7 v2.5", "10.1.100.51", "sarah.jones@hospital.org"],
            ["Lab Information System", "Sunquest", "8.2", "Production", "Active", "ORU, ORM", "HL7 v2.3", "10.1.100.52", "lab.admin@hospital.org"],
            ["PACS", "GE Healthcare", "4.5", "Production", "Active", "ORM, ORU", "DICOM", "10.1.100.53", "imaging@hospital.org"],
            ["Pharmacy System", "Epic Willow", "2023.1", "Production", "Active", "RDE, RDS", "HL7 v2.5", "10.1.100.54", "pharmacy@hospital.org"],
            ["Radiology Information System", "Epic Radiant", "2023.1", "Production", "Active", "ORM, ORU", "HL7 v2.5", "10.1.100.55", "radiology@hospital.org"]
          ],
          preview: "Healthcare system inventory with 6 active production systems across EMR, lab, imaging, and pharmacy domains.",
          rowCount: 7,
          columnCount: 9
        },
        {
          name: "Interface Mappings",
          data: [
            ["Source System", "Target System", "Message Type", "Frequency", "Protocol", "Data Elements", "Business Rule", "Error Handling"],
            ["Epic EHR", "Lab System", "ORU^R01", "Real-time", "TCP/IP", "PID, OBR, OBX", "Auto-result on completion", "Retry 3x then alert"],
            ["Epic EHR", "PACS", "ORM^O01", "Real-time", "TCP/IP", "PID, ORC, OBR", "Immediate transmission", "Dead letter queue"],
            ["Lab System", "Epic EHR", "ORU^R01", "Real-time", "TCP/IP", "PID, OBR, OBX", "Real-time sync on updates", "Exponential backoff"],
            ["PACS", "Epic EHR", "ORU^R01", "Real-time", "TCP/IP", "PID, OBR, OBX", "Image availability notification", "Manual intervention"],
            ["Pharmacy System", "Epic EHR", "RDE^O11", "Real-time", "TCP/IP", "PID, RXE, RXR", "Medication order processing", "Pharmacist review"],
            ["RIS", "PACS", "ORM^O01", "Real-time", "TCP/IP", "PID, ORC, OBR", "Imaging order routing", "Auto-retry 5 times"]
          ],
          preview: "Integration interface mappings showing real-time HL7 message flows between healthcare systems with error handling strategies.",
          rowCount: 7,
          columnCount: 8
        }
      ];
      
      setProcessedSheets(sampleSheets);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Sheet to Booklet</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Transform your integration documentation spreadsheets into professional, 
            structured booklets. Perfect for Integration Architects creating comprehensive 
            system documentation, interface specifications, and technical guides.
          </p>
          
          {/* Sample Files Section */}
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md border max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Files & Expected Output</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Grid className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-900 mb-2">Sample Data</h4>
                <p className="text-sm text-blue-700 mb-3">Healthcare system inventory with integration details</p>
                <a
                  href="/samples/sample-integration-data.csv"
                  download
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download CSV
                </a>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Layout className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-900 mb-2">Interface Mappings</h4>
                <p className="text-sm text-green-700 mb-3">System integration flows and message types</p>
                <a
                  href="/samples/interface-mappings.csv"
                  download
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download CSV
                </a>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium text-purple-900 mb-2">Sample Output</h4>
                <p className="text-sm text-purple-700 mb-3">Generated booklet with professional templates</p>
                <a
                  href="/samples/sample-booklet-output.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Sample
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4 mb-4">
              Download the sample files to see the expected input format, then view the sample output to understand how your booklet will be generated.
            </p>
            <button
              onClick={loadSampleData}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Try Sample Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-indigo-600" />
                Upload Documentation
              </h2>
              
              {!file ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-2">
                    Click to upload your spreadsheet
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports Excel (.xlsx, .xls) and CSV files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-900">{file.name}</p>
                        <p className="text-sm text-green-700">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-1 hover:bg-green-100 rounded"
                    >
                      <X className="h-4 w-4 text-green-600" />
                    </button>
                  </div>
                  
                  {isProcessing && (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span className="ml-3 text-gray-600">Processing spreadsheet...</span>
                    </div>
                  )}
                  
                  {processedSheets.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Processed Sheets:</h3>
                      {processedSheets.map((sheet, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{sheet.name}</h4>
                            <span className="text-sm text-gray-500">
                              {sheet.rowCount} rows × {sheet.columnCount} columns
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{sheet.preview}</p>
                        </div>
                      ))}
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </button>
                        <button
                          onClick={generateBooklet}
                          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate Booklet
                        </button>
                      </div>
                      
                      {processingOptions.useTemplate && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-amber-900">Professional Template Included</h4>
                              <p className="text-xs text-amber-700">
                                {processingOptions.templateType === 'system-profile' ? 'System Profile' : 'Integration Flow'} template will be added to your booklet
                              </p>
                            </div>
                            <FileText className="h-5 w-5 text-amber-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview Section */}
            {showPreview && processedSheets.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-indigo-600" />
                  Booklet Preview
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {generateBookletContent()}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Options Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-indigo-600" />
                Formatting Options
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={processingOptions.includeHeaders}
                      onChange={(e) => setProcessingOptions(prev => ({
                        ...prev,
                        includeHeaders: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Include column headers</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={processingOptions.autoDetectSections}
                      onChange={(e) => setProcessingOptions(prev => ({
                        ...prev,
                        autoDetectSections: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Auto-detect sections</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={processingOptions.pageBreakOnSheets}
                      onChange={(e) => setProcessingOptions(prev => ({
                        ...prev,
                        pageBreakOnSheets: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Page break between sheets</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={processingOptions.includeTOC}
                      onChange={(e) => setProcessingOptions(prev => ({
                        ...prev,
                        includeTOC: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Include table of contents</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Header Style</label>
                  <select
                    value={processingOptions.headerStyle}
                    onChange={(e) => setProcessingOptions(prev => ({
                      ...prev,
                      headerStyle: e.target.value as any
                    }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="simple">Simple</option>
                    <option value="professional">Professional</option>
                    <option value="modern">Modern</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Font Size</label>
                  <select
                    value={processingOptions.fontSize}
                    onChange={(e) => setProcessingOptions(prev => ({
                      ...prev,
                      fontSize: e.target.value as any
                    }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Orientation</label>
                  <select
                    value={processingOptions.orientation}
                    onChange={(e) => setProcessingOptions(prev => ({
                      ...prev,
                      orientation: e.target.value as any
                    }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Margins</label>
                  <select
                    value={processingOptions.margins}
                    onChange={(e) => setProcessingOptions(prev => ({
                      ...prev,
                      margins: e.target.value as any
                    }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="narrow">Narrow</option>
                    <option value="normal">Normal</option>
                    <option value="wide">Wide</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Professional Templates</h4>
                  <div>
                    <label className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        checked={processingOptions.useTemplate}
                        onChange={(e) => setProcessingOptions(prev => ({
                          ...prev,
                          useTemplate: e.target.checked
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Include documentation template</span>
                    </label>
                  </div>
                  
                  {processingOptions.useTemplate && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Template Type</label>
                      <select
                        value={processingOptions.templateType}
                        onChange={(e) => setProcessingOptions(prev => ({
                          ...prev,
                          templateType: e.target.value as any
                        }))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="system-profile">System Profile Template</option>
                        <option value="integration-flow">Integration Flow Template</option>
                        <option value="custom">Custom Template</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {processingOptions.templateType === 'system-profile' && 
                          'Comprehensive system documentation template with technical details, contacts, and capabilities.'}
                        {processingOptions.templateType === 'integration-flow' && 
                          'Integration workflow template with message flows, transformations, and error handling.'}
                        {processingOptions.templateType === 'custom' && 
                          'Customizable template for specific documentation needs.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Integration Architect Tool</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Transform spreadsheets into professional documentation with 
                      standardized templates for system profiles, integration flows, 
                      and technical specifications.
                    </p>
                  </div>
                </div>
              </div>
              
              {processingOptions.useTemplate && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="text-xs font-medium text-green-900 mb-1">Template Preview</h5>
                  <p className="text-xs text-green-700">
                    {processingOptions.templateType === 'system-profile' && 
                      'System documentation with technical details, integration capabilities, contact information, and operating schedules.'}
                    {processingOptions.templateType === 'integration-flow' && 
                      'Integration workflow with business purpose, message flows, data transformations, error handling, and success metrics.'}
                    {processingOptions.templateType === 'custom' && 
                      'Flexible template structure for specialized documentation requirements.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}