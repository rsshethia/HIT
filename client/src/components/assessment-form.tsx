import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Section } from "@/lib/form-data";
import QuestionItem from "@/components/question-item";

interface AssessmentFormProps {
  sections: Section[];
  onFormSubmit: (formData: FormData) => void;
  onSectionComplete: (sectionId: string, isComplete: boolean) => void;
}

export default function AssessmentForm({
  sections,
  onFormSubmit,
  onSectionComplete
}: AssessmentFormProps) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [invalidQuestions, setInvalidQuestions] = useState<Set<string>>(new Set());

  // Check each section's completion status whenever answers change
  useEffect(() => {
    sections.forEach(section => {
      const isComplete = section.questions.every(q => !!answers[q.id]);
      onSectionComplete(section.id, isComplete);
    });
  }, [answers, sections, onSectionComplete]);

  const handleSelectChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Remove from invalid set if it was there
    if (invalidQuestions.has(questionId)) {
      const updated = new Set(invalidQuestions);
      updated.delete(questionId);
      setInvalidQuestions(updated);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if all questions are answered
    const allQuestions = sections.flatMap(section => 
      section.questions.map(q => q.id)
    );
    
    const unanswered = allQuestions.filter(q => !answers[q]);
    
    if (unanswered.length > 0) {
      setInvalidQuestions(new Set(unanswered));
      
      toast({
        title: "Incomplete Assessment",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      });
      
      // Scroll to the first unanswered question
      const firstUnansweredSection = sections.find(section => 
        section.questions.some(q => unanswered.includes(q.id))
      );
      
      if (firstUnansweredSection) {
        const element = document.getElementById(firstUnansweredSection.id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
      
      return;
    }
    
    // Create form data and submit
    const formData = new FormData();
    Object.entries(answers).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    onFormSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map(section => (
        <Card 
          key={section.id} 
          id={section.id}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center mb-6">
            <span className="material-icons mr-2 text-primary">{section.icon}</span>
            <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
          </div>
          
          {section.questions.map((question, index) => (
            <QuestionItem
              key={question.id}
              question={question}
              questionNumber={index + 1}
              value={answers[question.id] || ""}
              isInvalid={invalidQuestions.has(question.id)}
              isLast={index === section.questions.length - 1}
              onChange={(value) => handleSelectChange(question.id, value)}
            />
          ))}
        </Card>
      ))}
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          size="lg"
          className="inline-flex items-center px-6 py-3 text-base font-medium shadow-sm"
        >
          <span className="material-icons mr-2">assessment</span>
          Calculate Results
        </Button>
      </div>
    </form>
  );
}
