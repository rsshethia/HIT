import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Section } from "@/lib/form-data";

interface ProgressIndicatorProps {
  sections: Section[];
  completedSections: Set<string>;
  onSectionClick: (sectionId: string) => void;
}

export default function ProgressIndicator({ 
  sections, 
  completedSections,
  onSectionClick 
}: ProgressIndicatorProps) {
  const progressPercentage = 
    sections.length > 0 
      ? (completedSections.size / sections.length) * 100 
      : 0;

  return (
    <Card className="mb-8 bg-white shadow-sm border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium text-gray-700">Assessment Progress</h2>
          <span className="text-sm font-medium text-primary">
            {completedSections.size} of {sections.length} sections complete
          </span>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="w-full h-2.5 bg-gray-200"
        />
        
        <div className="flex flex-wrap gap-2 mt-4">
          {sections.map(section => (
            <Button
              key={section.id}
              variant="outline"
              size="sm"
              className={`px-3 py-1 text-sm rounded-full hover:bg-gray-200 transition ${
                completedSections.has(section.id)
                  ? "bg-primary-100 text-primary-700 border-primary-300"
                  : "bg-gray-100 text-gray-600 border-gray-300"
              }`}
              onClick={() => onSectionClick(section.id)}
            >
              {section.title}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
