import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { jsPDF } from "jspdf";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { sections } from "@/lib/form-data";

interface ResultCardProps {
  score: number;
  maxScore: number;
  percentage: number;
  status?: string;
  recommendations?: string[];
  userAnswers?: Record<string, { 
    question: string;
    answer: string;
    value: number;
  }>;
  onReset: () => void;
}

export default function ResultCard({
  score,
  maxScore,
  percentage,
  status: providedStatus,
  recommendations: providedRecommendations,
  userAnswers,
  onReset
}: ResultCardProps) {
  // State for export options
  const [exportOptions, setExportOptions] = useState({
    includeScore: true,
    includeMaturityLevel: true,
    includeRecommendations: true,
    includeAnswers: false
  });
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
    
    // Start position after the header
    let currentY = 45;
    
    // Overall score section
    if (exportOptions.includeScore) {
      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      doc.text('Assessment Results', margin, currentY);
      currentY += 10;
      
      let scoreText = `Overall Score: ${score} out of ${maxScore} points (${percentage}%)`;
      
      // Only include maturity level if that option is selected
      if (exportOptions.includeMaturityLevel) {
        scoreText += `\n\nMaturity Level: ${status}`;
      }
      
      currentY = drawTextBox(scoreText, currentY, null, [240, 245, 255]); // Light blue background
      currentY += 10; // Add spacing after the box
    } else if (exportOptions.includeMaturityLevel) {
      // If score isn't included but maturity level is
      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      doc.text('Maturity Assessment', margin, currentY);
      currentY += 10;
      
      const maturityText = `Maturity Level: ${status}`;
      currentY = drawTextBox(maturityText, currentY, null, [240, 245, 255]); // Light blue background
      currentY += 10; // Add spacing after the box
    }
    
    // Recommendations section
    if (exportOptions.includeRecommendations && recommendations.length > 0) {
      // Check if we need a page break
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = margin;
      }
      
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
    }
    
    // User answers section
    if (exportOptions.includeAnswers && userAnswers && Object.keys(userAnswers).length > 0) {
      // Always start answers on a new page regardless of available space
      doc.addPage();
      currentY = margin;
      
      // Add a section header with background to make it clear this is a new section
      doc.setFillColor(240, 240, 255); // Light blue background for answers section header
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(50, 50, 150); // Darker blue for the title
      doc.text('Your Assessment Answers', margin, 20);
      
      // Start content below the header
      currentY = 40;
      
      // Group answers by section
      const sectionIds = new Set();
      for (const section of sections) {
        sectionIds.add(section.id);
      }
      
      // Process each section
      for (const section of sections) {
        // Check if any questions from this section were answered
        const sectionQuestions = section.questions.filter(q => userAnswers[q.id]);
        
        if (sectionQuestions.length > 0) {
          // Check if we need a page break
          if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = margin;
          }
          
          // Section title
          doc.setFontSize(13);
          doc.setTextColor(60, 60, 60);
          doc.text(section.title, margin, currentY);
          currentY += 8;
          
          // Process each question in this section
          for (const question of sectionQuestions) {
            const answer = userAnswers[question.id];
            if (answer) {
              // Check if we need a page break
              if (currentY > pageHeight - 50) {
                doc.addPage();
                currentY = margin;
              }
              
              const answerText = `Q: ${answer.question}\nA: ${answer.answer} (${answer.value}/5)`;
              currentY = drawTextBox(answerText, currentY, null, [250, 250, 255]); // Very light blue
              currentY += 5;
            }
          }
          
          currentY += 5; // Add extra space between sections
        }
      }
    }
    
    // Add page numbers and footer to all pages
    const totalPages = doc.getNumberOfPages();
    
    // Loop through all pages
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      // Draw a light gray line above footer
      doc.setDrawColor(200, 200, 200);
      const footerLineY = pageHeight - 20;
      doc.line(margin, footerLineY, pageWidth - margin, footerLineY);
      
      // First footer line with tool name and page numbers
      const footerY1 = pageHeight - 15;
      doc.text('Healthcare Integration Self-Assessment Tool', margin, footerY1);
      
      // Add page numbers on the right
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY1, {align: 'right'});
      
      // Second footer line with developer info
      const footerY2 = pageHeight - 10;
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Developed with ❤️ in Bendigo, VIC - Australia`, margin, footerY2);
    }
    
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

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Export Options</h3>
        <p className="text-sm text-gray-500 mb-4">Select what to include in your exported PDF report:</p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeScore" 
              checked={exportOptions.includeScore}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeScore: !!checked }))
              }
            />
            <Label htmlFor="includeScore" className="text-sm font-medium">
              Overall Score
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeMaturityLevel" 
              checked={exportOptions.includeMaturityLevel}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeMaturityLevel: !!checked }))
              }
            />
            <Label htmlFor="includeMaturityLevel" className="text-sm font-medium">
              Maturity Level
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeRecommendations" 
              checked={exportOptions.includeRecommendations}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeRecommendations: !!checked }))
              }
            />
            <Label htmlFor="includeRecommendations" className="text-sm font-medium">
              Recommendations
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeAnswers" 
              checked={exportOptions.includeAnswers}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeAnswers: !!checked }))
              }
            />
            <Label htmlFor="includeAnswers" className="text-sm font-medium">
              Assessment Answers
            </Label>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
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
      </div>
    </Card>
  );
}
