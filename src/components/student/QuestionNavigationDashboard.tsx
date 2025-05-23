
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Answer } from '@/types';

interface QuestionNavigationDashboardProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: Answer[];
  reviewedQuestions: string[];
  onQuestionSelect: (index: number) => void;
}

const QuestionNavigationDashboard: React.FC<QuestionNavigationDashboardProps> = ({
  currentQuestionIndex,
  totalQuestions,
  answers,
  reviewedQuestions,
  onQuestionSelect,
}) => {
  const getQuestionStatus = (index: number) => {
    const questionId = answers[index]?.questionId;
    
    if (index === currentQuestionIndex) {
      return 'current';
    }
    if (questionId && reviewedQuestions.includes(questionId)) {
      return 'reviewed';
    }
    if (answers[index] && answers[index].selectedOptionIndex >= 0) {
      return 'answered';
    }
    return 'unanswered';
  };

  const getButtonStyles = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-primary text-primary-foreground';
      case 'answered':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'reviewed':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'unanswered':
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  return (
    <div className="question-navigation p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-3">Questions</h3>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const status = getQuestionStatus(i);
          return (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className={cn(
                "w-10 h-10 p-0 font-medium",
                getButtonStyles(status)
              )}
              onClick={() => onQuestionSelect(i)}
            >
              {i + 1}
            </Button>
          );
        })}
      </div>
      
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded-sm"></div>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-500 rounded-sm"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded-sm"></div>
          <span>Marked for review</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded-sm"></div>
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigationDashboard;
