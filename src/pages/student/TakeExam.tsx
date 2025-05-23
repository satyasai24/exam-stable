import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Answer, FlagReason } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Flag } from 'lucide-react';
import QuestionNavigationDashboard from '@/components/student/QuestionNavigationDashboard';

const TakeExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getExamById, submitExam, getSubmissionsByStudent } = useApp();
  const { authState } = useAuth();
  
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [flagReasons, setFlagReasons] = useState<FlagReason[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startedAt] = useState<string>(new Date().toISOString());
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [reviewedQuestions, setReviewedQuestions] = useState<string[]>([]);
  
  // Track time spent on each question
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});

  // Get exam details
  const exam = getExamById(examId || '');
  
  if (!exam) {
    toast({
      title: "Error",
      description: "Exam not found",
      variant: "destructive",
    });
    navigate('/student');
    return null;
  }

  // Set up timer if exam has a time limit
  useEffect(() => {
    if (exam?.timeLimit) {
      // Convert minutes to milliseconds
      const timeLimitMs = exam.timeLimit * 60 * 1000;
      const endTime = new Date(new Date(startedAt).getTime() + timeLimitMs).getTime();
      
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const timeLeft = endTime - now;
        
        if (timeLeft <= 0) {
          clearInterval(timer);
          setRemainingTime(0);
          toast({
            title: "Time's up!",
            description: "Your exam is being submitted automatically.",
            variant: "destructive",
          });
          handleSubmitExam();
        } else {
          setRemainingTime(timeLeft);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [exam?.timeLimit, startedAt]);

  // Track time spent on the current question
  useEffect(() => {
    // Set start time for the new question
    setQuestionStartTime(new Date());
    
    return () => {
      // Record time spent when changing questions
      if (exam?.questions[currentQuestion]) {
        const questionId = exam.questions[currentQuestion].id;
        const now = new Date();
        const timeSpent = (now.getTime() - questionStartTime.getTime()) / 1000; // in seconds
        
        setQuestionTimes(prev => ({
          ...prev,
          [questionId]: (prev[questionId] || 0) + timeSpent
        }));
      }
    };
  }, [currentQuestion, exam?.questions]);

  // Format remaining time for display
  const formatRemainingTime = () => {
    if (remainingTime === null) return '';
    
    const minutes = Math.floor(remainingTime / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const timeProgress = () => {
    if (!exam?.timeLimit || remainingTime === null) return 100;
    
    const totalTimeMs = exam.timeLimit * 60 * 1000;
    const elapsedTimeMs = totalTimeMs - remainingTime;
    return Math.min(100, (elapsedTimeMs / totalTimeMs) * 100);
  };

  // Check if student has already taken this exam
  useEffect(() => {
    const studentId = authState.user?.id || '';
    const studentSubmissions = getSubmissionsByStudent(studentId);
    const hasAlreadyTaken = studentSubmissions.some(
      submission => submission.examId === examId
    );

    if (hasAlreadyTaken) {
      toast({
        title: "Error",
        description: "You have already taken this exam",
        variant: "destructive",
      });
      navigate('/student');
    }
  }, [examId, authState.user?.id]);

  // Pre-populate answers array with empty selections
  useEffect(() => {
    setAnswers(
      exam.questions.map(question => ({
        questionId: question.id,
        selectedOptionIndex: -1, // -1 indicates no selection
        timeSpent: 0 // Initialize time spent
      }))
    );
  }, [exam.questions]);

  // Toggle review status for a question
  const toggleReviewStatus = () => {
    const questionId = exam.questions[currentQuestion].id;
    
    if (reviewedQuestions.includes(questionId)) {
      setReviewedQuestions(prev => prev.filter(id => id !== questionId));
      toast({
        title: "Review removed",
        description: `Question ${currentQuestion + 1} is no longer marked for review.`
      });
    } else {
      setReviewedQuestions(prev => [...prev, questionId]);
      toast({
        title: "Marked for review",
        description: `Question ${currentQuestion + 1} is marked for review.`
      });
    }
  };

  // Submit the exam
  const handleSubmitExam = useCallback(() => {
    // Record time for the current question before submitting
    if (exam?.questions[currentQuestion]) {
      const questionId = exam.questions[currentQuestion].id;
      const now = new Date();
      const timeSpent = (now.getTime() - questionStartTime.getTime()) / 1000; // in seconds
      
      setQuestionTimes(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + timeSpent
      }));
    }
    
    // Check if all questions are answered
    const unansweredQuestions = answers.filter(answer => answer.selectedOptionIndex === -1);
    
    if (unansweredQuestions.length > 0 && !isSubmitting && remainingTime !== 0) {
      const confirmation = window.confirm(
        `You have ${unansweredQuestions.length} unanswered questions. Are you sure you want to submit?`
      );
      
      if (!confirmation) {
        return;
      }
    }
    
    setIsSubmitting(true);
    
    // Update answers with time spent on each question
    const answersWithTime = answers.map(answer => ({
      ...answer,
      timeSpent: questionTimes[answer.questionId] || 0
    }));
    
    // Submit the exam
    submitExam({
      examId: exam.id,
      studentId: authState.user?.id || '',
      answers: answersWithTime,
      flagged: flagReasons.length > 0,
      flagReasons,
      startedAt // Include the time when the exam was started
    });
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    
    // Navigate to thank you page
    navigate('/student/thank-you');
  }, [answers, exam.id, authState.user?.id, flagReasons, remainingTime, isSubmitting, questionTimes, currentQuestion, questionStartTime]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (remainingTime === 0 && !isSubmitting) {
      handleSubmitExam();
    }
  }, [remainingTime, isSubmitting, handleSubmitExam]);

  // Set up fullscreen monitoring
  useEffect(() => {
    // Request full screen on component mount
    const enterFullScreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullScreen(true);
        }
      } catch (error) {
        console.error('Failed to enter fullscreen mode:', error);
        addFlagReason('fullscreen_exit');
      }
    };

    enterFullScreen();

    // Monitor fullscreen changes
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullScreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen) {
        addFlagReason('fullscreen_exit');
        toast({
          title: "Warning",
          description: "Exiting fullscreen mode is not allowed. Your exam is being submitted.",
          variant: "destructive",
        });
        
        // Automatically submit the exam when fullscreen is exited
        handleSubmitExam();
      }
    };

    // Monitor tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        addFlagReason('tab_switch');
        toast({
          title: "Warning",
          description: "Switching tabs is not allowed during the exam",
          variant: "destructive",
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Exit fullscreen when component unmounts
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
      }
    };
  }, []);

  // Add a flag reason
  const addFlagReason = (reason: 'tab_switch' | 'fullscreen_exit') => {
    setFlagReasons(prev => [
      ...prev,
      {
        reason,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Handle answer selection
  const handleAnswerChange = (optionIndex: number) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = {
      ...updatedAnswers[currentQuestion],
      selectedOptionIndex: optionIndex
    };
    setAnswers(updatedAnswers);
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Handle question selection from dashboard
  const handleQuestionSelect = (index: number) => {
    setCurrentQuestion(index);
  };

  // Current question data
  const question = exam.questions[currentQuestion];
  const isCurrentQuestionReviewed = question ? reviewedQuestions.includes(question.id) : false;

  return (
    <div className="exam-container">
      <div className="max-w-7xl mx-auto mt-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exam in Progress</h1>
            <p className="text-muted-foreground">
              Question {currentQuestion + 1} of {exam.questions.length}
            </p>
          </div>
          <Button 
            onClick={handleSubmitExam} 
            variant="outline"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Exam"}
          </Button>
        </div>
        
        {exam.timeLimit && remainingTime !== null && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Time Remaining</span>
              <span className="text-sm font-bold">{formatRemainingTime()}</span>
            </div>
            <Progress value={timeProgress()} className="h-2" />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left side - Question content */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Question {currentQuestion + 1}</CardTitle>
                <Button
                  variant={isCurrentQuestionReviewed ? "secondary" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={toggleReviewStatus}
                >
                  <Flag className="h-4 w-4" />
                  {isCurrentQuestionReviewed ? "Remove review" : "Mark for review"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="font-medium">{question.text}</div>
                
                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => (
                    <div 
                      key={optionIndex} 
                      className={`flex items-center p-4 rounded-md cursor-pointer transition-all ${
                        answers[currentQuestion]?.selectedOptionIndex === optionIndex 
                          ? 'border-2 border-primary bg-primary/10 shadow-sm' 
                          : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleAnswerChange(optionIndex)}
                    >
                      <span className="flex-grow">{option}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                
                {currentQuestion < exam.questions.length - 1 ? (
                  <Button onClick={handleNextQuestion}>Next</Button>
                ) : (
                  <Button onClick={handleSubmitExam} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Exam"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
          
          {/* Right side - Navigation dashboard */}
          <div className="md:col-span-1">
            <QuestionNavigationDashboard 
              currentQuestionIndex={currentQuestion}
              totalQuestions={exam.questions.length}
              answers={answers}
              reviewedQuestions={reviewedQuestions}
              onQuestionSelect={handleQuestionSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;
