import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { jsPDF } from "jspdf";

interface ResultCardProps {
  score: number;
  maxScore: number;
  percentage: number;
  status?: string;
  recommendations?: string[];
  onReset: () => void;
}

export default function ResultCard({
  score,
  maxScore,
  percentage,
  status: providedStatus,
  recommendations: providedRecommendations,
  onReset
}: ResultCardProps) {
  // Determine maturity level and recommendations based on percentage if not provided
  let status = providedStatus || '';
  let statusIcon = '';
  let statusIconClass = '';
  let recommendations = providedRecommendations || [];

  // Set status icon based on percentage
  if (percentage >= 80) {
    if (!status) status = 'High Maturity – your integration landscape is robust and well-managed.';
    statusIcon = 'check_circle';
    statusIconClass = 'text-green-500';
    if (recommendations.length === 0) {
      recommendations = [
        'Consider implementing continuous improvement processes for your integration ecosystem.',
        'Explore advanced analytics for deeper insights into your integration patterns.',
        'Mentor other organizations to share your integration best practices.',
        'Investigate AI-powered predictive monitoring to anticipate integration issues.'
      ];
    }
  } else if (percentage >= 60) {
    if (!status) status = 'Moderate Maturity – there is room for improvement in some areas.';
    statusIcon = 'info';
    statusIconClass = 'text-amber-500';
    if (recommendations.length === 0) {
      recommendations = [
        'Strengthen governance procedures with formal testing and validation workflows.',
        'Implement more comprehensive monitoring dashboards across all integrations.',
        'Standardize integration patterns across the organization.',
        'Create a documented strategy for improving data consistency.'
      ];
    }
  } else {
    if (!status) status = 'Low Maturity – your integration environment may need significant attention.';
    statusIcon = 'error';
    statusIconClass = 'text-red-500';
    if (recommendations.length === 0) {
      recommendations = [
        'Prioritize the implementation of healthcare integration standards (HL7, FHIR).',
        'Develop a formal integration governance strategy and documentation requirements.',
        'Implement basic monitoring and alerting for critical integration points.',
        'Create a roadmap to systematically address integration gaps.'
      ];
    }
  }

  const handleExport = () => {
    // Create new PDF document - use PDF-A4 format for better layout
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const textWidth = pageWidth - (margin * 2);
    
    // Header with logo and title
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Title and date
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 150); // Dark blue for the title
    doc.text('Healthcare Integration Maturity Assessment', margin, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Gray for the date
    doc.text(`Assessment Date: ${new Date().toLocaleDateString()}`, margin, 25);
    
    // Define a function to draw a box around text with proper wrapping
    const drawTextBox = (text: string, startY: number, title: string | null = null, boxColor: number[] = [245, 245, 245]) => {
      // Split the text into lines that fit within the box width
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      // Calculate total content height
      const lineHeight = 5; // mm
      let contentHeight = lineHeight; // Start with minimum height
      
      if (title) {
        doc.setFontSize(13);
        contentHeight += lineHeight + 2; // Title plus spacing
      }
      
      // Split text and measure total height
      const textLines = doc.splitTextToSize(text, textWidth - 10);
      contentHeight += (textLines.length * lineHeight);
      
      // Draw the box with padding
      const padding = 5; // mm
      const boxHeight = contentHeight + (padding * 2);
      
      doc.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin - padding, startY - padding, textWidth + (padding * 2), boxHeight, 2, 2, 'FD');
      
      // Add title if specified
      let currentY = startY + lineHeight;
      if (title) {
        doc.setFontSize(13);
        doc.setTextColor(60, 60, 60);
        doc.text(title, margin, currentY);
        currentY += lineHeight + 2;
      }
      
      // Add content text
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      textLines.forEach((line: string) => {
        doc.text(line, margin, currentY);
        currentY += lineHeight;
      });
      
      // Return the Y position below this box (for next content)
      return startY + boxHeight;
    };
    
    // Overall score section - title
    let currentY = 45; // Start Y position after the header
    
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text('Assessment Results', margin, currentY);
    currentY += 10;
    
    // Score details box
    const scoreText = `Overall Score: ${score} out of ${maxScore} points (${percentage}%)\n\nMaturity Level: ${status}`;
    currentY = drawTextBox(scoreText, currentY, null, [240, 245, 255]); // Light blue background
    currentY += 10; // Add spacing after the box
    
    // Recommendations section
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text('Recommended Next Steps', margin, currentY);
    currentY += 10;
    
    // Draw individual box for each recommendation
    recommendations.forEach((recommendation, index) => {
      // Check if we need a page break
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = margin;
      }
      
      // Draw box around this recommendation with bullet point
      const recText = `• ${recommendation}`;
      currentY = drawTextBox(recText, currentY, null, [245, 255, 245]); // Light green background
      currentY += 5; // Add spacing between recommendation boxes
    });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    // Draw a light gray line above footer
    doc.setDrawColor(200, 200, 200);
    const footerLineY = pageHeight - 20;
    doc.line(margin, footerLineY, pageWidth - margin, footerLineY);
    
    // First footer line with tool name and generation date
    const footerY1 = pageHeight - 15;
    doc.text('Healthcare Integration Self-Assessment Tool', margin, footerY1);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, footerY1, {align: 'right'});
    
    // Second footer line with developer info
    const footerY2 = pageHeight - 10;
    doc.text('Developed with ❤️ in Bendigo, VIC - Australia. Supported by Rushabh Shethia', margin, footerY2);
    
    // Save the PDF
    doc.save(`healthcare-integration-assessment-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <Card className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <span className="material-icons text-primary mr-2 text-2xl">analytics</span>
        <h2 className="text-xl font-semibold text-gray-800">Assessment Results</h2>
      </div>

      <div className="relative pt-1 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block text-primary">
              Integration Maturity Score
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-primary">
              {percentage}%
            </span>
          </div>
        </div>
        <Progress 
          value={percentage} 
          className="h-2 my-1 bg-gray-200"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0% - Low Maturity</span>
          <span>60% - Moderate</span>
          <span>80% - High Maturity</span>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center mb-2">
          <span className={`material-icons mr-2 ${statusIconClass}`}>{statusIcon}</span>
          <h3 className="text-lg font-medium text-gray-700">Maturity Level</h3>
        </div>
        <p className="text-gray-600">{status}</p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Recommendations</h3>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex items-start">
              <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
              <p className="text-gray-600">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
        <Button 
          variant="outline" 
          onClick={onReset}
          className="inline-flex items-center"
        >
          <span className="material-icons mr-1 text-sm">refresh</span>
          Reset Assessment
        </Button>
        <Button 
          variant="default"
          onClick={handleExport}
          className="inline-flex items-center bg-green-600 hover:bg-green-700"
        >
          <span className="material-icons mr-1 text-sm">download</span>
          Export Results
        </Button>
      </div>
    </Card>
  );
}
