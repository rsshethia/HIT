import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ResultCardProps {
  score: number;
  maxScore: number;
  percentage: number;
  onReset: () => void;
}

export default function ResultCard({
  score,
  maxScore,
  percentage,
  onReset
}: ResultCardProps) {
  // Determine maturity level and recommendations based on percentage
  let status = '';
  let statusIcon = '';
  let statusIconClass = '';
  let recommendations: string[] = [];

  if (percentage >= 80) {
    status = 'High Maturity – your integration landscape is robust and well-managed.';
    statusIcon = 'check_circle';
    statusIconClass = 'text-green-500';
    recommendations = [
      'Consider implementing continuous improvement processes for your integration ecosystem.',
      'Explore advanced analytics for deeper insights into your integration patterns.',
      'Mentor other organizations to share your integration best practices.',
      'Investigate AI-powered predictive monitoring to anticipate integration issues.'
    ];
  } else if (percentage >= 60) {
    status = 'Moderate Maturity – there is room for improvement in some areas.';
    statusIcon = 'info';
    statusIconClass = 'text-amber-500';
    recommendations = [
      'Strengthen governance procedures with formal testing and validation workflows.',
      'Implement more comprehensive monitoring dashboards across all integrations.',
      'Standardize integration patterns across the organization.',
      'Create a documented strategy for improving data consistency.'
    ];
  } else {
    status = 'Low Maturity – your integration environment may need significant attention.';
    statusIcon = 'error';
    statusIconClass = 'text-red-500';
    recommendations = [
      'Prioritize the implementation of healthcare integration standards (HL7, FHIR).',
      'Develop a formal integration governance strategy and documentation requirements.',
      'Implement basic monitoring and alerting for critical integration points.',
      'Create a roadmap to systematically address integration gaps.'
    ];
  }

  const handleExport = () => {
    // In a real implementation, this would generate a PDF or CSV
    alert('In a production environment, this would generate a PDF report with detailed assessment results and recommendations.');
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
