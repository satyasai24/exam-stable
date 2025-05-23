
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/app/AppContext';
import { useToast } from '@/hooks/use-toast';

const ViewQuestions: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { getExamById } = useApp();
  const { toast } = useToast();

  // Get exam details
  const exam = getExamById(examId || '');

  if (!exam) {
    // Handle case when exam is not found
    toast({
      title: "Error",
      description: "Exam not found",
      variant: "destructive",
    });
    navigate('/teacher');
    return null;
  }

  const handleBack = () => {
    navigate('/teacher');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <p className="text-muted-foreground">Access Code: {exam.accessCode}</p>
        </div>
        <Button variant="outline" onClick={handleBack}>Back to Dashboard</Button>
      </div>
      
      <div className="grid gap-6">
        {exam.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle>Question {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="font-medium">{question.text}</div>
              
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <div 
                    key={optIndex} 
                    className={`p-3 border rounded-md ${
                      optIndex === question.correctOptionIndex 
                        ? 'border-green-500 bg-green-50' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="w-6">{String.fromCharCode(65 + optIndex)}.</span>
                      <span>{option}</span>
                      {optIndex === question.correctOptionIndex && (
                        <span className="ml-auto text-green-600 font-medium">Correct</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ViewQuestions;
