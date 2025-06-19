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
import jsPDF from 'jspdf';

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
    const content = generateBookletContent();
    generatePDFBooklet(content);
  };

  const generatePDFBooklet = (content: string) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    let currentY = margin;

    // Set font
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    // Split content into lines and process
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }

      // Handle different types of content
      if (line.startsWith('# ')) {
        // Main heading
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(line.replace('# ', ''), margin, currentY);
        currentY += lineHeight * 2;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
      } else if (line.startsWith('## ')) {
        // Section heading
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(line.replace('## ', ''), margin, currentY);
        currentY += lineHeight * 1.5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        doc.setFont('helvetica', 'bold');
        doc.text(line.replace(/\*\*/g, ''), margin, currentY);
        currentY += lineHeight;
        doc.setFont('helvetica', 'normal');
      } else if (line.startsWith('| ')) {
        // Table row - simplified table handling
        const cells = line.split(' | ').map(cell => cell.replace(/^\| |\|$/g, '').trim());
        let xPos = margin;
        const cellWidth = (pageWidth - margin * 2) / cells.length;
        
        cells.forEach(cell => {
          const cleanCell = cell.replace(/\*\*/g, ''); // Remove markdown bold
          doc.text(cleanCell.substring(0, 25), xPos, currentY); // Truncate long text
          xPos += cellWidth;
        });
        currentY += lineHeight;
      } else if (line.startsWith('- ')) {
        // Bullet point
        doc.text('• ' + line.replace('- ', ''), margin + 5, currentY);
        currentY += lineHeight;
      } else if (line.trim() === '---') {
        // Page break
        doc.addPage();
        currentY = margin;
      } else if (line.trim()) {
        // Regular text
        const splitText = doc.splitTextToSize(line, pageWidth - margin * 2);
        doc.text(splitText, margin, currentY);
        currentY += lineHeight * splitText.length;
      } else {
        // Empty line
        currentY += lineHeight * 0.5;
      }
    });

    // Save the PDF
    doc.save(`integration-documentation-${new Date().toISOString().split('T')[0]}.pdf`);
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

  const generateSamplePDF = () => {
    const doc = new jsPDF();
    
    // Add title page
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Integration Architecture Documentation', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated on ' + new Date().toLocaleDateString(), 20, 45);
    
    // Add System Profile Template
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('System Profile Template', 20, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 50;
    
    const templateLines = [
      'SYSTEM NAME: _________________________',
      'TYPE: □ EMR  □ Laboratory  □ Pharmacy  □ Imaging  □ Other: _______',
      '',
      'TECHNICAL DETAILS:',
      '• Vendor: _________________',
      '• Version: _______________', 
      '• Database: _______________',
      '• IP Address: _____________',
      '',
      'INTEGRATION CAPABILITIES:',
      '□ HL7 v2.x    Version: ________',
      '□ HL7 FHIR    Version: ________',
      '□ API         Type: ___________',
      '',
      'MESSAGE TYPES SUPPORTED:',
      '□ ADT  □ ORM  □ ORU  □ DFT  □ SIU  □ MDM'
    ];
    
    templateLines.forEach(line => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 30;
      }
      doc.text(line, 20, yPos);
      yPos += 8;
    });
    
    // Add sample data page
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('System Inventory', 20, 30);
    
    // Table headers
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    yPos = 45;
    doc.text('System Name', 20, yPos);
    doc.text('Vendor', 70, yPos);
    doc.text('Version', 120, yPos);
    doc.text('Status', 160, yPos);
    
    // Sample data rows
    doc.setFont('helvetica', 'normal');
    const systems = [
      ['Epic EHR', 'Epic Systems', '2023.1', 'Active'],
      ['Cerner PowerChart', 'Oracle Health', '2024.1', 'Active'],
      ['Lab System', 'Sunquest', '8.2', 'Active'],
      ['PACS', 'GE Healthcare', '4.5', 'Active']
    ];
    
    systems.forEach(system => {
      yPos += 10;
      doc.text(system[0], 20, yPos);
      doc.text(system[1], 70, yPos);
      doc.text(system[2], 120, yPos);
      doc.text(system[3], 160, yPos);
    });
    
    doc.save('sample-integration-booklet.pdf');
  };

  const loadSampleData = () => {
    setIsProcessing(true);
    
    const mockFile = new File(['sample-data'], 'sample-integration-data.csv', { type: 'text/csv' });
    setFile(mockFile);
    
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
            ["Source System", "Target System", "Message Type", "Interface Type", "Frequency", "Protocol", "Source IP", "Source Port", "Target IP", "Target Port", "Data Elements", "Business Rule", "Error Handling"],
            ["Epic EHR", "Lab System", "ORM^O01", "Sender", "Real-time", "TCP/IP", "10.1.100.50", "5555", "10.1.100.52", "6661", "PID, ORC, OBR", "Lab order transmission", "Retry 3x then alert"],
            ["Lab System", "Epic EHR", "ORU^R01", "Receiver", "Real-time", "TCP/IP", "10.1.100.52", "6663", "10.1.100.50", "5557", "PID, OBR, OBX", "Lab results processing", "Exponential backoff"],
            ["Epic EHR", "PACS", "ORM^O01", "Sender", "Real-time", "TCP/IP", "10.1.100.50", "5556", "10.1.100.53", "6662", "PID, ORC, OBR", "Imaging order routing", "Dead letter queue"],
            ["PACS", "Epic EHR", "ORU^R01", "Receiver", "Real-time", "TCP/IP", "10.1.100.53", "6664", "10.1.100.50", "5558", "PID, OBR, OBX", "Image result notification", "Manual intervention"],
            ["Epic EHR", "Pharmacy System", "RDE^O11", "Sender", "Real-time", "TCP/IP", "10.1.100.50", "5559", "10.1.100.54", "6665", "PID, RXE, RXR", "Medication order processing", "Pharmacist review"],
            ["Pharmacy System", "Epic EHR", "RDS^O13", "Receiver", "Real-time", "TCP/IP", "10.1.100.54", "6666", "10.1.100.50", "5560", "PID, RXD, RXR", "Dispense status update", "Auto-acknowledge"],
            ["Interface Engine", "All Systems", "ACK^A01", "Receiver", "Real-time", "TCP/IP", "10.1.100.61", "7000", "10.1.100.0/24", "Various", "MSA, ERR", "Acknowledgment processing", "Log and forward"]
          ],
          preview: "Complete interface mappings with bidirectional communication patterns, IP addresses, ports, and interface types (Sender/Receiver).",
          rowCount: 8,
          columnCount: 13
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
            Transform your integration documentation spreadsheets into professional PDF booklets. 
            Perfect for Integration Architects creating comprehensive system documentation, 
            interface specifications, and technical guides with professional templates.
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
                <p className="text-sm text-green-700 mb-3">Complete interface details with IP addresses, ports, and Sender/Receiver types</p>
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
                <h4 className="font-medium text-purple-900 mb-2">Sample PDF Output</h4>
                <p className="text-sm text-purple-700 mb-3">Professional PDF booklet with templates and data</p>
                <button
                  onClick={generateSamplePDF}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Sample PDF
                </button>
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
                          Generate PDF Booklet
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
                  PDF Content Preview
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