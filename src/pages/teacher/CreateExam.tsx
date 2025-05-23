
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useApp } from '@/context/app/AppContext';
import { useAuth } from '@/context/AuthContext';

export interface QuestionForm {
  text: string;
  options: string[];
  correctOptionIndex: number;
  topic?: string;
}

const CreateExam: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createExam, getExamsByTeacher, updateExam } = useApp();
  const { authState } = useAuth();
  
  const [examTitle, setExamTitle] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState<number>(60); // Default to 60 minutes
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionForm>({
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    topic: '',
  });
  const [currentTab, setCurrentTab] = useState<number>(1);

  const defaultQuestion: QuestionForm = {
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    topic: '',
  };

  // Handle option change
  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({...currentQuestion, options: updatedOptions});
  };

  // Handle correct answer change
  const handleCorrectAnswerChange = (index: number) => {
    setCurrentQuestion({...currentQuestion, correctOptionIndex: index});
  };

  // Handle adding question
  const handleAddQuestion = () => {
    if (!currentQuestion.text.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    if (currentQuestion.options.some(option => !option.trim())) {
      toast({
        title: "Error", 
        description: "All options must have content",
        variant: "destructive",
      });
      return;
    }

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({ ...defaultQuestion });
    setCurrentTab(questions.length + 1);
  };

  // Handle deleting question
  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
    
    // Adjust current tab if needed
    if (currentTab > questions.length) {
      setCurrentTab(questions.length);
    }
  };

  // Handle creating exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examTitle.trim()) {
      toast({
        title: "Error",
        description: "Exam title is required",
        variant: "destructive",
      });
      return;
    }

    if (!accessCode.trim()) {
      toast({
        title: "Error",
        description: "Access code is required", 
        variant: "destructive",
      });
      return;
    }
    
    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "At least one question is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create a map of question topics by their index
      const questionTopics: Record<string, string> = {};
      questions.forEach((q, index) => {
        if (q.topic) {
          questionTopics[index.toString()] = q.topic;
        }
      });
      
      // Create exam with the questions, topics and time limit
      const examId = await createExam(
        { 
          title: examTitle, 
          accessCode,
          timeLimit: timeLimit > 0 ? timeLimit : undefined 
        },
        questions
      );
      
      // If any topics were defined, update the exam with them
      if (Object.keys(questionTopics).length > 0 && examId) {
        await updateExam(examId, { questionTopics });
      }
      
      toast({
        title: "Success", 
        description: "Exam created successfully"
      });
      
      // Navigate back to dashboard
      navigate('/teacher', { replace: true });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam", 
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Exam</CardTitle>
          <CardDescription>Fill out the form below to create a new exam.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateExam} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-title">Exam Title</Label>
                <Input
                  id="exam-title"
                  placeholder="Enter exam title"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-code">Access Code</Label>
                <Input
                  id="access-code"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time-limit">Time Limit (minutes)</Label>
              <Input
                id="time-limit"
                type="number"
                placeholder="Enter time limit in minutes"
                value={timeLimit}
                min={1}
                onChange={(e) => setTimeLimit(Math.max(1, parseInt(e.target.value) || 0))}
              />
              <p className="text-sm text-muted-foreground">Set to 0 for no time limit</p>
            </div>
            
            <Tabs value={`question-${currentTab}`} onValueChange={(value) => setCurrentTab(parseInt(value.split('-')[1]))}>
              <TabsList className="mb-4">
                {questions.map((_, index) => (
                  <TabsTrigger key={index} value={`question-${index + 1}`}>Question {index + 1}</TabsTrigger>
                ))}
                <TabsTrigger value={`question-${questions.length + 1}`}>+ Add Question</TabsTrigger>
              </TabsList>
              
              {questions.map((question, index) => (
                <TabsContent key={index} value={`question-${index + 1}`}>
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle>Question {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{question.text}</p>
                      <Button variant="destructive" onClick={() => handleDeleteQuestion(index)}>Delete Question</Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
              
              <TabsContent value={`question-${questions.length + 1}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Question</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="question-topic">Topic (not visible to students)</Label>
                        <Input
                          id="question-topic"
                          placeholder="Enter topic or category for this question"
                          value={currentQuestion.topic || ''}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, topic: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="question-text">Question Text</Label>
                        <Textarea
                          id="question-text"
                          placeholder="Enter your question here"
                          value={currentQuestion.text}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="space-y-2">
                            <Label htmlFor={`option-${index + 1}`}>Option {index + 1}</Label>
                            <Input
                              id={`option-${index + 1}`}
                              placeholder={`Enter option ${index + 1}`}
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              required
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <div className="flex items-center space-x-4">
                          {currentQuestion.options.map((_, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                type="radio"
                                id={`correct-answer-${index + 1}`}
                                name="correct-answer"
                                checked={currentQuestion.correctOptionIndex === index}
                                onChange={() => handleCorrectAnswerChange(index)}
                              />
                              <Label htmlFor={`correct-answer-${index + 1}`}>Option {index + 1}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="button" onClick={handleAddQuestion}>Add Question</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" onClick={handleCreateExam}>Create Exam</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateExam;
