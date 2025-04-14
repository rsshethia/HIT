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

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('q')) {
        score += parseInt(value as string);
        maxPossibleScore += 5; // Max value for each question is 5
      }
    }

    const percentage = (score / maxPossibleScore) * 100;
    
    // Store results in sessionStorage for the results page
    sessionStorage.setItem('assessmentResults', JSON.stringify({
      score,
      maxPossibleScore,
      percentage: percentage.toFixed(1)
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
              <span className="material-icons text-primary text-3xl">healing</span>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-semibold text-gray-800">Healthcare Integration Self-Assessment</h1>
              <p className="text-gray-500 text-sm mt-1">Evaluate your organization's integration maturity</p>
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
            © {new Date().getFullYear()} Healthcare Integration Assessment Tool | 
            <a href="#" className="text-primary hover:text-primary-700 transition-colors ml-1">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
