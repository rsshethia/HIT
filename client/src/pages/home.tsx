import { useState } from "react";
import { useLocation } from "wouter";
import ProgressIndicator from "@/components/progress-indicator";
import AssessmentForm from "@/components/assessment-form";
import { sections } from "@/lib/form-data";

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeSectionId, setActiveSectionId] = useState<string>("system-coverage");
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const handleSectionClick = (sectionId: string) => {
    setActiveSectionId(sectionId);
    // Scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSectionComplete = (sectionId: string, isComplete: boolean) => {
    setCompletedSections(prev => {
      const updatedSet = new Set(prev);
      if (isComplete) {
        updatedSet.add(sectionId);
      } else {
        updatedSet.delete(sectionId);
      }
      return updatedSet;
    });
  };

  const handleFormSubmit = (formData: FormData) => {
    // Process the form data and redirect to results page
    let score = 0;
    let maxPossibleScore = 0;
    const userAnswers: Record<string, { question: string, answer: string, value: number }> = {};

    // Convert FormData entries to array and iterate
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (key.startsWith('q')) {
        const numValue = parseInt(value as string);
        score += numValue;
        maxPossibleScore += 5; // Max value for each question is 5
        
        // Find the corresponding question and selected option
        // to store the full text for the report
        const questionId = key;
        let questionText = '';
        let answerLabel = '';
        
        // Find this question in our sections data
        for (const section of sections) {
          const question = section.questions.find(q => q.id === questionId);
          if (question) {
            questionText = question.text;
            const option = question.options.find(opt => opt.value === numValue);
            if (option) {
              answerLabel = option.label;
            }
            break;
          }
        }
        
        // Store the user's answer with context
        userAnswers[questionId] = {
          question: questionText,
          answer: answerLabel,
          value: numValue
        };
      }
    });

    const percentage = (score / maxPossibleScore) * 100;
    
    // Determine maturity level and recommendations based on percentage
    let status = '';
    let recommendations: string[] = [];
    
    if (percentage >= 80) {
      status = 'High Maturity – your integration landscape is robust and well-managed.';
      recommendations = [
        'Consider implementing continuous improvement processes for your integration ecosystem.',
        'Explore advanced analytics for deeper insights into your integration patterns.',
        'Mentor other organizations to share your integration best practices.',
        'Investigate AI-powered predictive monitoring to anticipate integration issues.'
      ];
    } else if (percentage >= 60) {
      status = 'Moderate Maturity – there is room for improvement in some areas.';
      recommendations = [
        'Strengthen governance procedures with formal testing and validation workflows.',
        'Implement more comprehensive monitoring dashboards across all integrations.',
        'Standardize integration patterns across the organization.',
        'Create a documented strategy for improving data consistency.'
      ];
    } else {
      status = 'Low Maturity – your integration environment may need significant attention.';
      recommendations = [
        'Prioritize the implementation of healthcare integration standards (HL7, FHIR).',
        'Develop a formal integration governance strategy and documentation requirements.',
        'Implement basic monitoring and alerting for critical integration points.',
        'Create a roadmap to systematically address integration gaps.'
      ];
    }
    
    // Store results in sessionStorage for the results page
    sessionStorage.setItem('assessmentResults', JSON.stringify({
      score,
      maxPossibleScore,
      percentage: percentage.toFixed(1),
      status,
      recommendations,
      userAnswers
    }));

    // Navigate to results page
    setLocation('/results');
  };

  return (
    <div className="bg-neutral-50 min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="material-icons text-primary text-3xl">device_hub</span>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-semibold text-gray-800">HIT Assessment Tool</h1>
              <p className="text-gray-500 text-sm mt-1">Evaluate your integration maturity across 7 critical domains with personalized recommendations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <ProgressIndicator 
          sections={sections}
          completedSections={completedSections}
          onSectionClick={handleSectionClick}
        />
        
        <AssessmentForm 
          sections={sections}
          onFormSubmit={handleFormSubmit}
          onSectionComplete={handleSectionComplete}
        />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Health Integration Tools | 
            <a href="#" className="text-primary hover:text-primary-700 transition-colors ml-1">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
