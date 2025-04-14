import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Question } from "@/lib/form-data";

interface QuestionItemProps {
  question: Question;
  questionNumber: number;
  value: string;
  isInvalid: boolean;
  isLast: boolean;
  onChange: (value: string) => void;
}

export default function QuestionItem({
  question,
  questionNumber,
  value,
  isInvalid,
  isLast,
  onChange
}: QuestionItemProps) {
  return (
    <div className={`${!isLast ? 'mb-6 pb-6 border-b border-gray-200' : 'mb-0'}`}>
      <div className="flex items-start">
        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-sm font-medium mr-3 mt-0.5">
          {questionNumber}
        </span>
        <div className="flex-1">
          <label className="block text-gray-700 font-medium mb-2">
            {question.text}
          </label>
          
          {/* Example text - only show if available */}
          {question.example && (
            <div className="mb-3 bg-gray-50 rounded-md p-3 border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">Example: </span>
                {question.example}
              </p>
            </div>
          )}
          
          <Select
            value={value}
            onValueChange={onChange}
          >
            <SelectTrigger 
              className={`w-full bg-gray-50 border ${
                isInvalid 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              } text-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors`}
            >
              <SelectValue placeholder="Select an answer" />
            </SelectTrigger>
            <SelectContent>
              {question.options.map(option => (
                <SelectItem 
                  key={option.value} 
                  value={option.value.toString()}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
