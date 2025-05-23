
import { v4 as uuidv4 } from 'uuid';
import { Exam, Question, AppState } from '../../types';
import { supabase } from '@/integrations/supabase/client';

export const createExam = (
  appState: AppState,
  setAppState: React.Dispatch<React.SetStateAction<AppState>>
) => async (
  examData: Omit<Exam, 'id' | 'createdAt' | 'createdBy' | 'isTaken' | 'questions'>,
  questionsData: Omit<Question, 'id' | 'examId'>[]
) => {
  try {
    // Check if access code already exists
    const { data: existingExam, error: checkError } = await supabase
      .from('exams')
      .select('id')
      .eq('access_code', examData.accessCode)
      .single();

    if (existingExam) {
      throw new Error('Access code already exists');
    }

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is what we want
      console.error('Error checking existing access code:', checkError);
      throw new Error('Error checking access code');
    }

    // Get authenticated user from localStorage
    let userId = '';
    try {
      const authStateJSON = window.localStorage.getItem('auth');
      if (authStateJSON) {
        const authState = JSON.parse(authStateJSON);
        userId = authState.user?.id || '';
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }

    // Prepare questions with new IDs
    const questions = questionsData.map(q => ({
      ...q,
      id: uuidv4()
    }));

    // Insert the new exam into Supabase
    const { data: newExam, error: insertError } = await supabase
      .from('exams')
      .insert({
        title: examData.title,
        access_code: examData.accessCode,
        created_by: userId,
        is_taken: false,
        time_limit: examData.timeLimit,
        questions: questions
      })
      .select('*')
      .single();

    if (insertError || !newExam) {
      console.error('Error creating exam:', insertError);
      throw new Error('Failed to create exam');
    }

    // Format the received data to match our app state structure
    const formattedExam: Exam = {
      id: newExam.id,
      title: newExam.title,
      accessCode: newExam.access_code,
      createdAt: newExam.created_at,
      createdBy: newExam.created_by || '',
      isTaken: newExam.is_taken || false,
      timeLimit: newExam.time_limit,
      questions: (newExam.questions as unknown) as Question[]
    };

    // Update app state
    const updatedState = {
      ...appState,
      exams: [...appState.exams, formattedExam]
    };

    setAppState(updatedState);
    console.log('Created new exam in Supabase:', formattedExam);
    
    return formattedExam.id;
  } catch (error) {
    console.error('Error in createExam:', error);
    throw error;
  }
};

export const updateExam = (
  appState: AppState,
  setAppState: React.Dispatch<React.SetStateAction<AppState>>
) => async (examId: string, updates: Partial<Exam>) => {
  try {
    // Find the existing exam in the app state
    const existingExam = appState.exams.find(exam => exam.id === examId);
    if (!existingExam) {
      console.error('Exam not found for update:', examId);
      return;
    }

    // Prepare data for Supabase update
    const supabaseUpdates: any = {};
    if (updates.title) supabaseUpdates.title = updates.title;
    if (updates.accessCode) supabaseUpdates.access_code = updates.accessCode;
    if (updates.isTaken !== undefined) supabaseUpdates.is_taken = updates.isTaken;
    if (updates.timeLimit) supabaseUpdates.time_limit = updates.timeLimit;
    if (updates.questions) supabaseUpdates.questions = updates.questions;

    // Update exam in Supabase
    const { error } = await supabase
      .from('exams')
      .update(supabaseUpdates)
      .eq('id', examId);

    if (error) {
      console.error('Error updating exam in Supabase:', error);
      throw new Error('Failed to update exam');
    }

    // Update app state
    const updatedExam = { ...existingExam, ...updates };
    const updatedExams = appState.exams.map(exam => 
      exam.id === examId ? updatedExam : exam
    );

    setAppState({
      ...appState,
      exams: updatedExams
    });

    console.log('Updated exam in Supabase:', updatedExam);
  } catch (error) {
    console.error('Error in updateExam:', error);
    throw error;
  }
};

export const toggleExamStatus = (
  appState: AppState,
  setAppState: React.Dispatch<React.SetStateAction<AppState>>
) => async (examId: string) => {
  try {
    // Find the existing exam in the app state
    const examIndex = appState.exams.findIndex(exam => exam.id === examId);
    if (examIndex === -1) {
      console.error('Exam not found for status toggle:', examId);
      return;
    }

    const currentStatus = appState.exams[examIndex].isTaken;
    const newStatus = !currentStatus;

    // Update exam status in Supabase
    const { error } = await supabase
      .from('exams')
      .update({ is_taken: newStatus })
      .eq('id', examId);

    if (error) {
      console.error('Error toggling exam status in Supabase:', error);
      throw new Error('Failed to toggle exam status');
    }

    // Update app state
    const updatedExams = [...appState.exams];
    updatedExams[examIndex] = {
      ...updatedExams[examIndex],
      isTaken: newStatus
    };

    setAppState({
      ...appState,
      exams: updatedExams
    });

    console.log(`Toggled exam ${examId} status to ${newStatus} in Supabase`);
  } catch (error) {
    console.error('Error in toggleExamStatus:', error);
    throw error;
  }
};

export const getExamsByTeacher = (appState: AppState) => async (teacherId: string) => {
  try {
    console.log('Getting exams for teacher:', teacherId);

    const { data: exams, error } = await supabase
      .from('exams')
      .select('*')
      .eq('created_by', teacherId);

    if (error) {
      console.error('Error fetching teacher exams:', error);
      return [];
    }

    if (!exams || exams.length === 0) {
      console.log('No exams found for teacher:', teacherId);
      return [];
    }

    // Format the received data to match our app state structure
    const formattedExams: Exam[] = exams.map(exam => ({
      id: exam.id,
      title: exam.title,
      accessCode: exam.access_code,
      createdAt: exam.created_at,
      createdBy: exam.created_by || '',
      isTaken: exam.is_taken || false,
      timeLimit: exam.time_limit,
      questions: (exam.questions as unknown) as Question[]
    }));

    console.log('Found teacher exams:', formattedExams.length);
    return formattedExams;
  } catch (error) {
    console.error('Error in getExamsByTeacher:', error);
    return [];
  }
};

export const getExamById = (appState: AppState) => async (examId: string) => {
  try {
    const { data: exam, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (error || !exam) {
      console.error('Error fetching exam by ID:', error);
      return undefined;
    }

    // Format the received data to match our app state structure
    const formattedExam: Exam = {
      id: exam.id,
      title: exam.title,
      accessCode: exam.access_code,
      createdAt: exam.created_at,
      createdBy: exam.created_by || '',
      isTaken: exam.is_taken || false,
      timeLimit: exam.time_limit,
      questions: (exam.questions as unknown) as Question[]
    };

    return formattedExam;
  } catch (error) {
    console.error('Error in getExamById:', error);
    return undefined;
  }
};

export const validateAccessCode = (appState: AppState) => async (accessCode: string) => {
  try {
    console.log('Validating access code:', accessCode);

    const { data: exam, error } = await supabase
      .from('exams')
      .select('*')
      .eq('access_code', accessCode)
      .single();

    if (error) {
      console.error('Error validating access code:', error);
      return undefined;
    }

    if (!exam) {
      console.log('No exam found for access code:', accessCode);
      return undefined;
    }

    // Format the received data to match our app state structure
    const formattedExam: Exam = {
      id: exam.id,
      title: exam.title,
      accessCode: exam.access_code,
      createdAt: exam.created_at,
      createdBy: exam.created_by || '',
      isTaken: exam.is_taken || false,
      timeLimit: exam.time_limit,
      questions: (exam.questions as unknown) as Question[]
    };

    console.log('Found exam for access code:', formattedExam);
    return formattedExam;
  } catch (error) {
    console.error('Error in validateAccessCode:', error);
    return undefined;
  }
};
