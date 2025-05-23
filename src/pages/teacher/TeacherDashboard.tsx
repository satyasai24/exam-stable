
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/app/AppContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Exam } from '@/types';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuth();
  const { getExamsByTeacher, toggleExamStatus, getSubmissionsByExam } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [exams, setExams] = useState<Exam[]>([]);
  
  const teacherId = authState.user?.id || '';
  
  // Use useCallback to memoize the function to prevent recreating it on each render
  const loadExams = useCallback(() => {
    if (teacherId) {
      console.log('Loading teacher exams, teacher ID:', teacherId);
      const teacherExams = getExamsByTeacher(teacherId);
      setExams(teacherExams);
      setLoading(false);
    }
  }, [teacherId, getExamsByTeacher]);
  
  // Load exams only when necessary dependencies change
  useEffect(() => {
    loadExams();
  }, [loadExams, location.pathname]); // Only depend on loadExams and location.pathname
  
  const handleCreateExam = () => {
    navigate('/teacher/create-exam');
  };
  
  const handleViewQuestions = (examId: string) => {
    navigate(`/teacher/exam/${examId}/questions`);
  };
  
  const handleViewSubmissions = (examId: string) => {
    navigate(`/teacher/exam/${examId}/submissions`);
  };
  
  const handleToggleStatus = (examId: string) => {
    toggleExamStatus(examId);
    toast({
      title: "Exam Status Updated",
      description: "The exam status has been updated successfully."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <Button onClick={handleCreateExam}>Create New Exam</Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading exams...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.length > 0 ? (
            exams.map((exam) => {
              const submissions = getSubmissionsByExam(exam.id).length;
              
              return (
                <Card key={exam.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle>{exam.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Access Code:</span>
                        <span className="font-mono">{exam.accessCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Created:</span>
                        <span>{format(new Date(exam.createdAt), 'yyyy-MM-dd')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Questions:</span>
                        <span>{exam.questions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Submissions:</span>
                        <span>{submissions}</span>
                      </div>
                      {exam.timeLimit && (
                        <div className="flex justify-between">
                          <span className="font-medium">Time Limit:</span>
                          <span>{exam.timeLimit} minutes</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Status:</span>
                        <div className="flex items-center gap-2">
                          <span>{exam.isTaken ? 'Active' : 'Inactive'}</span>
                          <Switch 
                            checked={exam.isTaken}
                            onCheckedChange={() => handleToggleStatus(exam.id)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewQuestions(exam.id)}
                    >
                      View Questions
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewSubmissions(exam.id)}
                    >
                      View Submissions
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center p-12 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-lg mb-2">No exams created yet</h3>
              <p className="text-gray-500 mb-4">Create your first exam to get started</p>
              <Button onClick={handleCreateExam}>Create New Exam</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
