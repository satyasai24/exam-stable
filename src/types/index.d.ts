
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher' | 'student';
  password?: string;
}

export interface Exam {
  id: string;
  title: string;
  accessCode: string;
  createdAt: string;
  createdBy: string;
  isTaken: boolean;
  questions: Question[];
  timeLimit?: number;
  questionTopics?: Record<string, string>;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  topic?: string;
}

export interface Answer {
  questionId: string;
  selectedOptionIndex: number;
  timeSpent?: number; // Time spent on this question in seconds
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: Answer[];
  submittedAt: string;
  flagged: boolean;
  flagReasons: FlagReason[];
  startedAt: string;
}

export interface FlagReason {
  reason: 'tab_switch' | 'fullscreen_exit';
  timestamp: string;
}

export interface AppState {
  users: User[];
  exams: Exam[];
  submissions: ExamSubmission[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}
