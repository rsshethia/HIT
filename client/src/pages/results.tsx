import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ResultCard from "@/components/result-card";
import { Button } from "@/components/ui/button";

interface AssessmentResult {
  score: number;
  maxPossibleScore: number;
  percentage: string;
  status: string;
  recommendations: string[];
}

export default function Results() {
  const [location, setLocation] = useLocation();
  const [results, setResults] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    // Retrieve results from sessionStorage
    const storedResults = sessionStorage.getItem('assessmentResults');
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
      } catch (error) {
        console.error("Failed to parse results:", error);
      }
    } else {
      // If no results found, redirect to home page
      setLocation('/');
    }
  }, [setLocation]);

  const handleReset = () => {
    // Clear sessionStorage and redirect to home page
    sessionStorage.removeItem('assessmentResults');
    setLocation('/');
  };

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800">Loading results...</h1>
          <Button 
            className="mt-4"
            onClick={() => setLocation('/')}
          >
            Return to Assessment
          </Button>
        </div>
      </div>
    );
  }

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
              <p className="text-gray-500 text-sm mt-1">Your Assessment Results</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <ResultCard 
          score={results.score}
          maxScore={results.maxPossibleScore}
          percentage={parseFloat(results.percentage)}
          status={results.status}
          recommendations={results.recommendations}
          onReset={handleReset}
        />

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            className="mt-4" 
            onClick={() => setLocation('/')}
          >
            <span className="material-icons mr-2 text-sm">arrow_back</span>
            Return to Assessment
          </Button>
        </div>
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
