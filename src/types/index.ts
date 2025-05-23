
export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string; // Only used during creation, not stored in app state
}

export interface Exam {
  id: string;
  title: string;
  accessCode: string;
  createdAt: string;
  createdBy: string; // Teacher ID
  isTaken: boolean;
  questions: Question[];
  questionTopics?: Record<string, string>; // Add question topics mapping
  timeLimit?: number; // Time limit in minutes
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  topic?: string; // Optional topic for the question
  imageUrl?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: Answer[];
  flagged: boolean;
  flagReasons: FlagReason[];
  submittedAt: string;
  startedAt?: string; // Add optional startedAt field
}

export interface Answer {
  questionId: string;
  selectedOptionIndex: number;
  timeSpent?: number; // Time spent on this question in seconds
}

export interface FlagReason {
  reason: 'tab_switch' | 'fullscreen_exit';
  timestamp: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface AppState {
  users: User[];
  exams: Exam[];
  submissions: ExamSubmission[];
}
