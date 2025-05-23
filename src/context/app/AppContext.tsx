
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, User, Exam, Question, ExamSubmission, Answer, FlagReason, UserRole } from '../../types';
import { AppContextProps } from './types';
import { createUser, getUsersByRole } from './userActions';
import { 
  createExam, 
  updateExam, 
  toggleExamStatus, 
  getExamsByTeacher, 
  getExamById,
  validateAccessCode
} from './examActions';
import {
  submitExam,
  getSubmissionsByExam,
  getSubmissionsByStudent
} from './submissionActions';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

// Default app state
const DEFAULT_APP_STATE: AppState = {
  users: [],
  exams: [],
  submissions: []
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize app state from Supabase
  useEffect(() => {
    const initializeAppState = async () => {
      try {
        console.log('Initializing app state from Supabase...');
        
        // Load users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, phone, role');
        
        if (usersError) {
          console.error('Error loading users:', usersError);
        }
        
        // Load exams
        const { data: exams, error: examsError } = await supabase
          .from('exams')
          .select('*');
        
        if (examsError) {
          console.error('Error loading exams:', examsError);
        }
        
        // Load submissions
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('*');
        
        if (submissionsError) {
          console.error('Error loading submissions:', submissionsError);
        }
        
        // Format the data to match our app state structure
        const formattedState: AppState = {
          users: users?.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role as UserRole
          })) || [],
          exams: exams?.map(exam => ({
            id: exam.id,
            title: exam.title,
            accessCode: exam.access_code,
            createdAt: exam.created_at,
            createdBy: exam.created_by || '',
            isTaken: exam.is_taken || false,
            timeLimit: exam.time_limit,
            questions: (exam.questions as unknown) as Question[]
          })) || [],
          submissions: submissions?.map(sub => ({
            id: sub.id,
            examId: sub.exam_id,
            studentId: sub.student_id,
            answers: (sub.answers as unknown) as Answer[],
            flagged: sub.flagged || false,
            flagReasons: (sub.flag_reasons as unknown) as FlagReason[],
            submittedAt: sub.submitted_at,
            startedAt: sub.started_at
          })) || []
        };
        
        setAppState(formattedState);
        console.log('App state initialized:', formattedState);
      } catch (error) {
        console.error('Error initializing app state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAppState();
  }, []);

  // Log app state for debugging
  useEffect(() => {
    console.log('Current App State:', appState);
  }, [appState]);

  // Synchronous versions of async functions to match the interface
  const getUsersByRoleSync = (role: string) => {
    return appState.users.filter(user => user.role === role);
  };

  const getExamsByTeacherSync = (teacherId: string) => {
    return appState.exams.filter(exam => exam.createdBy === teacherId);
  };

  const getExamByIdSync = (examId: string) => {
    return appState.exams.find(exam => exam.id === examId);
  };

  const getSubmissionsByExamSync = (examId: string) => {
    return appState.submissions.filter(sub => sub.examId === examId);
  };

  const getSubmissionsByStudentSync = (studentId: string) => {
    return appState.submissions.filter(sub => sub.studentId === studentId);
  };

  const validateAccessCodeSync = (accessCode: string) => {
    return appState.exams.find(exam => exam.accessCode === accessCode);
  };

  // Make sure to wait until initialized before rendering children
  if (isLoading) {
    return <div>Loading app...</div>;
  }

  const contextValue: AppContextProps = {
    appState,
    createUser: createUser(appState, setAppState),
    createExam: createExam(appState, setAppState),
    updateExam: updateExam(appState, setAppState),
    toggleExamStatus: toggleExamStatus(appState, setAppState),
    submitExam: submitExam(appState, setAppState),
    getUsersByRole: getUsersByRoleSync,
    getExamsByTeacher: getExamsByTeacherSync,
    getExamById: getExamByIdSync,
    getSubmissionsByExam: getSubmissionsByExamSync,
    getSubmissionsByStudent: getSubmissionsByStudentSync,
    validateAccessCode: validateAccessCodeSync
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
