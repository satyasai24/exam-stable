
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ExamSubmission } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Define an extended submission type for our UI needs
interface ExtendedSubmission extends ExamSubmission {
  examTitle?: string;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { validateAccessCode, appState } = useApp();
  const { authState } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentSubmissions, setStudentSubmissions] = useState<ExtendedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get student's ID
  const studentId = authState.user?.id || '';

  // Load student's submissions
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!studentId) {
        setStudentSubmissions([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*, exams:exam_id(*)')
          .eq('student_id', studentId);

        if (error) {
          console.error('Error loading submissions:', error);
          setStudentSubmissions([]);
        } else {
          const formattedSubmissions: ExtendedSubmission[] = data.map((sub: any) => ({
            id: sub.id,
            examId: sub.exam_id,
            studentId: sub.student_id,
            answers: (sub.answers as any),
            flagged: sub.flagged || false,
            flagReasons: (sub.flag_reasons as any) || [],
            submittedAt: sub.submitted_at,
            startedAt: sub.started_at,
            examTitle: sub.exams?.title || 'Unknown Exam'
          }));
          
          setStudentSubmissions(formattedSubmissions);
        }
      } catch (error) {
        console.error('Error loading submissions:', error);
        setStudentSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();
  }, [studentId]);

  const handleStartExam = async () => {
    if (!accessCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an access code",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Attempting to validate access code:', accessCode);
      
      const exam = await validateAccessCode(accessCode);
      console.log('Found exam:', exam);
      
      if (!exam) {
        toast({
          title: "Error",
          description: "Invalid access code. Please check and try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if exam is active
      if (!exam.isTaken) {
        toast({
          title: "Error",
          description: "This exam is not currently active. Please contact your teacher.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if student has already taken this exam
      const hasAlreadyTaken = studentSubmissions.some(
        submission => submission.examId === exam.id
      );

      if (hasAlreadyTaken) {
        toast({
          title: "Error",
          description: "You have already taken this exam",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      navigate(`/student/exam/${exam.id}`);
    } catch (error) {
      console.error('Error validating access code:', error);
      toast({
        title: "Error",
        description: "An error occurred while validating the access code.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Student Portal</h1>
      <p className="text-center text-muted-foreground">
        Welcome, {authState.user?.name}. Enter an exam access code to start.
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Start an Exam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessCode">Exam Access Code</Label>
            <Input 
              id="accessCode" 
              placeholder="Enter the access code provided by your teacher"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleStartExam} 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Checking...' : 'Start Exam'}
          </Button>
        </CardFooter>
      </Card>

      {studentSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Completed Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 divide-y">
              {studentSubmissions.map((submission) => (
                <li key={submission.id} className="pt-2">
                  <div className="font-medium">{submission.examTitle || "Unknown Exam"}</div>
                  <div className="text-sm text-muted-foreground">
                    Completed on: {new Date(submission.submittedAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentDashboard;
