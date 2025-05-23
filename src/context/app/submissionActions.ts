
import { v4 as uuidv4 } from 'uuid';
import { ExamSubmission, AppState, Answer, FlagReason } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export const submitExam = (
  appState: AppState,
  setAppState: React.Dispatch<React.SetStateAction<AppState>>
) => async (submissionData: Omit<ExamSubmission, 'id' | 'submittedAt'>) => {
  try {
    const currentTime = new Date().toISOString();
    
    // Insert submission to Supabase - Fixed property naming to match the table schema
    const { data: newSubmission, error } = await supabase
      .from('submissions')
      .insert({
        exam_id: submissionData.examId,
        student_id: submissionData.studentId,
        answers: submissionData.answers as unknown as Json,
        flagged: submissionData.flagged,
        flag_reasons: submissionData.flagReasons as unknown as Json,
        started_at: submissionData.startedAt
      })
      .select('*')
      .single();

    if (error || !newSubmission) {
      console.error('Error submitting exam:', error);
      throw new Error('Failed to submit exam');
    }

    // Format the submission data to match our app state
    const formattedSubmission: ExamSubmission = {
      id: newSubmission.id,
      examId: newSubmission.exam_id,
      studentId: newSubmission.student_id,
      answers: (newSubmission.answers as unknown) as Answer[],
      flagged: newSubmission.flagged || false,
      flagReasons: (newSubmission.flag_reasons as unknown) as FlagReason[],
      submittedAt: newSubmission.submitted_at,
      startedAt: newSubmission.started_at
    };

    // Update app state
    const updatedState = {
      ...appState,
      submissions: [...appState.submissions, formattedSubmission]
    };

    setAppState(updatedState);
    console.log('Submitted exam to Supabase:', formattedSubmission);

    return formattedSubmission;
  } catch (error) {
    console.error('Error in submitExam:', error);
    throw error;
  }
};

export const getSubmissionsByExam = (appState: AppState) => async (examId: string) => {
  try {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('exam_id', examId);

    if (error) {
      console.error('Error fetching submissions for exam:', error);
      return [];
    }

    if (!submissions || submissions.length === 0) {
      return [];
    }

    // Format the submission data to match our app state
    const formattedSubmissions: ExamSubmission[] = submissions.map(sub => ({
      id: sub.id,
      examId: sub.exam_id,
      studentId: sub.student_id,
      answers: (sub.answers as unknown) as Answer[],
      flagged: sub.flagged || false,
      flagReasons: (sub.flag_reasons as unknown) as FlagReason[],
      submittedAt: sub.submitted_at,
      startedAt: sub.started_at
    }));

    return formattedSubmissions;
  } catch (error) {
    console.error('Error in getSubmissionsByExam:', error);
    return [];
  }
};

export const getSubmissionsByStudent = (appState: AppState) => async (studentId: string) => {
  try {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching submissions for student:', error);
      return [];
    }

    if (!submissions || submissions.length === 0) {
      return [];
    }

    // Format the submission data to match our app state
    const formattedSubmissions: ExamSubmission[] = submissions.map(sub => ({
      id: sub.id,
      examId: sub.exam_id,
      studentId: sub.student_id,
      answers: (sub.answers as unknown) as Answer[],
      flagged: sub.flagged || false,
      flagReasons: (sub.flag_reasons as unknown) as FlagReason[],
      submittedAt: sub.submitted_at,
      startedAt: sub.started_at
    }));

    return formattedSubmissions;
  } catch (error) {
    console.error('Error in getSubmissionsByStudent:', error);
    return [];
  }
};
