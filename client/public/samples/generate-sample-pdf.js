// This is a utility script to generate the sample PDF
// Note: This would be run in the browser environment with jsPDF loaded

const generateSamplePDF = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Integration Architecture Documentation', 20, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated on January 20, 2025', 20, 40);
  
  // Add System Profile Template section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('System Profile Template', 20, 60);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const templateContent = [
    'SYSTEM NAME: _________________________',
    'TYPE: □ EMR  □ Laboratory  □ Pharmacy  □ Imaging  □ Other: _______',
    '',
    'TECHNICAL DETAILS:',
    '• Vendor: _________________',
    '• Version: _______________',
    '• Database: _______________',
    '• OS: ___________________',
    '• IP Address: _____________',
    '• Ports: ________________',
    '• Interface Engine: _______________________________',
    '',
    'INTEGRATION CAPABILITIES:',
    '□ HL7 v2.x    Version: ________',
    '□ HL7 FHIR    Version: ________',
    '□ API         Type: ___________',
    '□ File Transfer  Method: ______',
    '□ Database    Direct: _________',
    '',
    'MESSAGE TYPES SUPPORTED:',
    '□ ADT  □ ORM  □ ORU  □ DFT  □ SIU  □ MDM',
    '□ Custom: ____________________________________'
  ];
  
  let yPosition = 75;
  templateContent.forEach(line => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    if (line.startsWith('•')) {
      doc.text(line, 25, yPosition);
    } else {
      doc.text(line, 20, yPosition);
    }
    yPosition += 7;
  });
  
  // Add new page for data
  doc.addPage();
  yPosition = 30;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('System Inventory', 20, yPosition);
  yPosition += 20;
  
  // Add table headers
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const headers = ['System Name', 'Vendor', 'Version', 'Status'];
  let xPos = 20;
  headers.forEach(header => {
    doc.text(header, xPos, yPosition);
    xPos += 45;
  });
  yPosition += 10;
  
  // Add sample data
  doc.setFont('helvetica', 'normal');
  const sampleData = [
    ['Epic EHR', 'Epic Systems', '2023.1', 'Active'],
    ['Cerner PowerChart', 'Oracle Health', '2024.1', 'Active'],
    ['Lab System', 'Sunquest', '8.2', 'Active'],
    ['PACS', 'GE Healthcare', '4.5', 'Active']
  ];
  
  sampleData.forEach(row => {
    xPos = 20;
    row.forEach(cell => {
      doc.text(cell.substring(0, 12), xPos, yPosition);
      xPos += 45;
    });
    yPosition += 8;
  });
  
  // Save the PDF
  doc.save('sample-integration-booklet.pdf');
};

// Export for use in browser
if (typeof window !== 'undefined') {
  window.generateSamplePDF = generateSamplePDF;
}