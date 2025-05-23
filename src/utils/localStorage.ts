
import { AppState, AuthState, User, Exam, ExamSubmission } from '../types';

// Default admin user
const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  name: 'Administrator',
  email: 'admin@secureexam.com',
  phone: '0000000000',
  role: 'admin',
  password: '$2a$10$YC6JdAB6YHbZLGGZ.lPJue1Kz2GwkMssDJ3oBXEWXrchFKhDE9qFW', // Hashed "162024"
};

// Initial app state
const DEFAULT_APP_STATE: AppState = {
  users: [DEFAULT_ADMIN],
  exams: [],
  submissions: [],
};

// Auth state
const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

// Helper to get auth from localStorage
export const getAuthFromLocalStorage = (): AuthState => {
  try {
    const authJSON = localStorage.getItem('auth');
    return authJSON ? JSON.parse(authJSON) : DEFAULT_AUTH_STATE;
  } catch (error) {
    console.error('Error loading auth state:', error);
    return DEFAULT_AUTH_STATE;
  }
};

// Helper to set auth in localStorage
export const setAuthInLocalStorage = (authState: AuthState): void => {
  try {
    localStorage.setItem('auth', JSON.stringify(authState));
  } catch (error) {
    console.error('Error saving auth state:', error);
  }
};

// Helper to get app state from localStorage
export const getAppStateFromLocalStorage = (): AppState => {
  try {
    const appStateJSON = localStorage.getItem('appState');
    console.log('Raw localStorage appState:', appStateJSON);
    
    if (!appStateJSON) {
      console.log('No appState found in localStorage, using default state');
      return DEFAULT_APP_STATE;
    }
    
    const parsedState = JSON.parse(appStateJSON);
    console.log('Parsed appState from localStorage:', parsedState);
    // Make sure we have all required properties, even if localStorage has a limited version
    return {
      users: parsedState.users || [],
      exams: parsedState.exams || [],
      submissions: parsedState.submissions || []
    };
  } catch (error) {
    console.error('Error loading app state:', error);
    return DEFAULT_APP_STATE;
  }
};

// Helper to set app state in localStorage
export const setAppStateInLocalStorage = (appState: AppState): void => {
  try {
    console.log('Saving app state to localStorage:', appState);
    console.log('Total exams being saved:', appState.exams.length);
    localStorage.setItem('appState', JSON.stringify(appState));
  } catch (error) {
    console.error('Error saving app state:', error);
    // If localStorage is full, try to save with stringification optimization
    try {
      const compactAppState = {
        users: appState.users,
        exams: appState.exams,
        submissions: appState.submissions
      };
      localStorage.setItem('appState', JSON.stringify(compactAppState));
      console.log('Saved app state with optimization');
    } catch (secondError) {
      console.error('Failed to save app state even with optimization:', secondError);
    }
  }
};

// Helper to add a user to localStorage
export const addUserToLocalStorage = (user: User): void => {
  try {
    const appState = getAppStateFromLocalStorage();
    appState.users.push(user);
    setAppStateInLocalStorage(appState);
  } catch (error) {
    console.error('Error adding user:', error);
  }
};

// Helper to add an exam to localStorage
export const addExamToLocalStorage = (exam: Exam): void => {
  try {
    const appState = getAppStateFromLocalStorage();
    appState.exams.push(exam);
    console.log('Adding exam to localStorage. Updated state:', appState);
    console.log('Total exam count after adding:', appState.exams.length);
    setAppStateInLocalStorage(appState);
  } catch (error) {
    console.error('Error adding exam:', error);
  }
};

// Helper to update an exam in localStorage
export const updateExamInLocalStorage = (updatedExam: Exam): void => {
  try {
    const appState = getAppStateFromLocalStorage();
    const index = appState.exams.findIndex(exam => exam.id === updatedExam.id);
    if (index !== -1) {
      appState.exams[index] = updatedExam;
      setAppStateInLocalStorage(appState);
    } else {
      console.error('Exam not found for update:', updatedExam.id);
    }
  } catch (error) {
    console.error('Error updating exam:', error);
  }
};

// Helper to add a submission to localStorage
export const addSubmissionToLocalStorage = (submission: ExamSubmission): void => {
  try {
    const appState = getAppStateFromLocalStorage();
    appState.submissions.push(submission);
    
    // Update exam status to taken
    const examIndex = appState.exams.findIndex(exam => exam.id === submission.examId);
    if (examIndex !== -1) {
      appState.exams[examIndex].isTaken = true;
    }
    
    setAppStateInLocalStorage(appState);
  } catch (error) {
    console.error('Error adding submission:', error);
  }
};

// Helper to toggle exam taken status
export const toggleExamTakenStatus = (examId: string): void => {
  try {
    const appState = getAppStateFromLocalStorage();
    const examIndex = appState.exams.findIndex(exam => exam.id === examId);
    if (examIndex !== -1) {
      appState.exams[examIndex].isTaken = !appState.exams[examIndex].isTaken;
      console.log(`Toggling exam ${examId} status to ${appState.exams[examIndex].isTaken}`);
      setAppStateInLocalStorage(appState);
    } else {
      console.error('Exam not found for toggle:', examId);
    }
  } catch (error) {
    console.error('Error toggling exam status:', error);
  }
};

// Initialize local storage with default values if empty
export const initializeLocalStorage = (): void => {
  const appState = getAppStateFromLocalStorage();
  setAppStateInLocalStorage(appState);
};
