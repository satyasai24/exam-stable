
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { Download, ChevronRight, BarChart2 } from 'lucide-react';

const ViewSubmissions: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { toast } = useToast();
  const { getExamById, getSubmissionsByExam, appState } = useApp();
  
  const exam = getExamById(examId || '');
  
  if (!exam) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Exam not found</h1>
        <Link to="/teacher">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  const submissions = getSubmissionsByExam(examId || '');
  
  // Helper function to generate CSV content for a student submission
  const generateCSVContent = (submission: any, student: any) => {
    // Calculate time taken if available
    let timeTakenSeconds = "N/A";
    if (submission.startedAt && submission.submittedAt) {
      const startTime = new Date(submission.startedAt).getTime();
      const endTime = new Date(submission.submittedAt).getTime();
      timeTakenSeconds = ((endTime - startTime) / 1000).toFixed(1);
    }
    
    // Create CSV content
    let csvContent = "Student Information\n";
    csvContent += `Name,${student.name}\n`;
    csvContent += `Email,${student.email}\n`;
    csvContent += `Phone,${student.phone}\n`;
    csvContent += `Submission Time,${submission.submittedAt}\n`;
    csvContent += `Total Time Taken (seconds),${timeTakenSeconds}\n`;
    csvContent += `Flagged,${submission.flagged ? "Yes" : "No"}\n\n`;
    
    // Add questions and answers - one question per row
    csvContent += "Question Number,Question Text,Question Topic,Selected Option,Correct Option,Is Correct,Time Taken (seconds)\n";
    
    exam.questions.forEach((question, qIndex) => {
      // Find the student's answer for this question
      const answer = submission.answers.find((a: any) => a.questionId === question.id);
      const selectedOptionIndex = answer ? answer.selectedOptionIndex : -1;
      const selectedOption = selectedOptionIndex >= 0 ? question.options[selectedOptionIndex] : "Not answered";
      const correctOption = question.options[question.correctOptionIndex];
      const isCorrect = selectedOptionIndex === question.correctOptionIndex;
      
      // Get topic from question directly or from exam's questionTopics
      const topic = question.topic || 
                  (exam.questionTopics && exam.questionTopics[question.id]) ||
                  (exam.questionTopics && exam.questionTopics[qIndex.toString()]) || 
                  "N/A";
      
      // Calculate time spent on this question (if answer has timeSpent property, otherwise N/A)
      const timeSpent = answer && answer.timeSpent ? answer.timeSpent.toFixed(1) : "N/A";
      
      csvContent += `${qIndex + 1},"${question.text.replace(/"/g, '""')}","${topic}","${selectedOption.replace(/"/g, '""')}","${correctOption.replace(/"/g, '""')}",${isCorrect ? "Yes" : "No"},${timeSpent}\n`;
    });
    
    return csvContent;
  };
  
  const handleExportCSV = (submissionId?: string) => {
    // Get all student data
    const students = appState.users.filter(user => user.role === 'student');
    
    // Filter submissions if a specific submission ID is provided
    const submissionsToExport = submissionId 
      ? submissions.filter(sub => sub.id === submissionId) 
      : submissions;
    
    if (submissionsToExport.length === 0) {
      toast({
        title: "Error",
        description: "No submissions to export"
      });
      return;
    }
    
    // Process each submission separately
    submissionsToExport.forEach(submission => {
      // Find the student
      const student = students.find(s => s.id === submission.studentId);
      if (!student) return;
      
      const csvContent = generateCSVContent(submission, student);
      
      // Create a download link for this specific submission
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `exam_${exam.title}_submission_${student.name}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Exported",
        description: `Submission data for ${student.name} has been exported successfully.`
      });
    });
  };
  
  const handleAnalyze = (studentId: string) => {
    // Find the student and their submission
    const student = appState.users.find(s => s.id === studentId);
    const submission = submissions.find(s => s.studentId === studentId);
    
    if (!student || !submission) {
      toast({
        title: "Error",
        description: "Could not find student or submission data"
      });
      return;
    }
    
    // Generate CSV content
    const csvContent = generateCSVContent(submission, student);
    
    // Encode the CSV content for safe URL transmission
    const encodedCsvData = encodeURIComponent(csvContent);
    
    // Generate the URL with student ID and encoded CSV data
    const analyzeUrl = `https://9000-firebase-studio-1747477777936.cluster-xpmcxs2fjnhg6xvn446ubtgpio.cloudworkstations.dev/?monospaceUid=168552&studentId=${studentId}&csvData=${encodedCsvData}`;
    
    // Redirect to the analyze URL
    window.open(analyzeUrl, '_blank');
    
    toast({
      title: "Analysis Started",
      description: "Redirecting to analysis dashboard with student data..."
    });
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{exam.title} - Submissions</h1>
          <p className="text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} received
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExportCSV()} variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Export All CSV
          </Button>
          <Link to="/teacher">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
      
      {submissions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>
              View all submissions for this exam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Export</TableHead>
                  <TableHead className="text-center">Analyze</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map(submission => {
                  // Find the student
                  const student = appState.users.find(user => user.id === submission.studentId);
                  
                  // Calculate score
                  const totalQuestions = exam.questions.length;
                  const correctAnswers = submission.answers.filter(answer => {
                    const question = exam.questions.find(q => q.id === answer.questionId);
                    return question && question.correctOptionIndex === answer.selectedOptionIndex;
                  }).length;
                  
                  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
                  
                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{student?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-center">{correctAnswers}/{totalQuestions} ({scorePercentage}%)</TableCell>
                      <TableCell className="text-center">
                        {submission.flagged && (
                          <Badge variant="destructive">Flagged</Badge>
                        )}
                        {!submission.flagged && (
                          <Badge variant="outline">Clean</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleExportCSV(submission.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAnalyze(submission.studentId)}
                          className="h-8 w-8 p-0"
                          title="Analyze submission"
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/teacher/exam/${examId}/submission/${submission.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No submissions received yet</p>
              <Link to="/teacher">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewSubmissions;
