
import { AppState, User, Exam, Question, ExamSubmission } from '../../types';

export interface AppContextProps {
  appState: AppState;
  createUser: (user: Omit<User, 'id'>) => Promise<User>;
  createExam: (exam: Omit<Exam, 'id' | 'createdAt' | 'createdBy' | 'isTaken' | 'questions'>, questions: Omit<Question, 'id' | 'examId'>[]) => Promise<string>;
  updateExam: (examId: string, updates: Partial<Exam>) => Promise<void>;
  toggleExamStatus: (examId: string) => Promise<void>;
  submitExam: (submission: Omit<ExamSubmission, 'id' | 'submittedAt'>) => Promise<ExamSubmission>;
  getUsersByRole: (role: string) => User[];
  getExamsByTeacher: (teacherId: string) => Exam[];
  getExamById: (examId: string) => Exam | undefined;
  getSubmissionsByExam: (examId: string) => ExamSubmission[];
  getSubmissionsByStudent: (studentId: string) => ExamSubmission[];
  validateAccessCode: (accessCode: string) => Exam | undefined;
}
