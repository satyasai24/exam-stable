
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from '@/context/app/AppContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ViewSubmissionDetail: React.FC = () => {
  const { examId, submissionId } = useParams<{ examId: string; submissionId: string }>();
  const navigate = useNavigate();
  const { getExamById, appState } = useApp();
  const { toast } = useToast();

  // Get exam details
  const exam = getExamById(examId || '');
  
  if (!exam) {
    toast({
      title: "Error",
      description: "Exam not found",
      variant: "destructive",
    });
    navigate('/teacher');
    return null;
  }
  
  // Get submission details
  const submission = appState.submissions.find(s => s.id === submissionId);
  
  if (!submission) {
    toast({
      title: "Error",
      description: "Submission not found",
      variant: "destructive",
    });
    navigate(`/teacher/exam/${examId}/submissions`);
    return null;
  }
  
  // Get student details
  const student = appState.users.find(u => u.id === submission.studentId);

  const handleBack = () => {
    navigate(`/teacher/exam/${examId}/submissions`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Submission Details</h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
        <Button variant="outline" onClick={handleBack}>Back to Submissions</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Name</h3>
              <p>{student?.name || 'Unknown'}</p>
            </div>
            <div>
              <h3 className="font-medium">Email</h3>
              <p>{student?.email || 'Unknown'}</p>
            </div>
            <div>
              <h3 className="font-medium">Phone</h3>
              <p>{student?.phone || 'Unknown'}</p>
            </div>
            <div>
              <h3 className="font-medium">Submission Time</h3>
              <p>{format(new Date(submission.submittedAt), 'yyyy-MM-dd HH:mm:ss')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {submission.flagged && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Flagged Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">This submission was flagged for the following reasons:</p>
              <ul className="list-disc pl-5">
                {submission.flagReasons.map((reason, index) => (
                  <li key={index}>
                    {reason.reason === 'tab_switch' ? 'Tab Switch' : 'Fullscreen Exit'} at {
                      format(new Date(reason.timestamp), 'HH:mm:ss')
                    }
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Answers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Correct Answer</TableHead>
                <TableHead>Student's Answer</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submission.answers.map((answer, index) => {
                const question = exam.questions.find(q => q.id === answer.questionId);
                if (!question) return null;
                
                const isCorrect = question.correctOptionIndex === answer.selectedOptionIndex;
                
                return (
                  <TableRow key={answer.questionId}>
                    <TableCell className="align-top">
                      <div className="font-medium">Question {index + 1}</div>
                      <div className="text-sm text-gray-600">{question.text}</div>
                    </TableCell>
                    <TableCell>{question.options[question.correctOptionIndex]}</TableCell>
                    <TableCell>{answer.selectedOptionIndex >= 0 ? question.options[answer.selectedOptionIndex] : 'No answer'}</TableCell>
                    <TableCell>
                      {isCorrect ? (
                        <span className="text-green-600">Correct</span>
                      ) : (
                        <span className="text-red-600">Incorrect</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewSubmissionDetail;
