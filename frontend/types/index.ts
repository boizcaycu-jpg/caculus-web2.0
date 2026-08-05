export type Role = 'admin' | 'student';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  passwordPlain?: string;
  name: string | null;
  realName?: string | null;
  studentId: string; // e.g. CACULUS_VIP_001
  role: Role;
  isVip?: boolean;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean; // For 2-column True/False multiple choice option evaluation
}

export interface QuestionGroup {
  id: string;
  moduleId: string;
  title?: string;
  passage?: string; // Reading text or scientific experiment description
  imageUrl?: string; // Embedded diagram or Base64 / upload path
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  questionIds: string[]; // Child question IDs belonging to this group
}

export interface Question {
  id: string;
  moduleId: string;
  groupId?: string; // Reference to parent QuestionGroup context
  number: number;
  type?: 'single_choice' | 'multiple_choice' | 'fill_blank';
  text: string;
  passage?: string; // Optional standalone reading passage or scientific data context
  imageUrl?: string; // Base64 data URL, upload path, or external URL for question prompt image
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  options: QuestionOption[];
  correctOptionId?: string; // For single choice
  correctOptionIds?: string[]; // For multiple choice
  fillBlankAnswers?: string[]; // Acceptable correct values for fill in the blank
  explanation?: string; // Text / KaTeX explanation
  explanationImageUrl?: string; // Image upload URL for explanation / step-by-step solution
  correctionNote?: string; // Errata note / Ghi chú đính chính cho đề thi (nếu có)
}

export interface ExamModule {
  id: string;
  examId: string;
  title: string; // e.g., "1. Tư duy Toán học", "2. Tư duy Đọc hiểu", "3. Tư duy Khoa học & Giải quyết vấn đề"
  category: 'math' | 'reading' | 'science';
  durationMinutes: number;
  openTime: string; // e.g., "00:00 02/05/2026"
  closeTime: string; // e.g., "02:59 07/05/2027"
  totalQuestions: number;
  questionGroups?: QuestionGroup[];
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  isFree: boolean;
  isDemoExam?: boolean;
  price?: number;
  category?: 'LUYỆN TẬP' | 'THỰC CHIẾN' | string;
  subCategory?: 'math' | 'reading' | 'science' | string;
  status?: 'CHƯA UPDATE' | 'ĐÃ UPDATE' | 'ĐÃ THI' | 'active' | 'disabled' | 'coming_soon' | string;
  isPublished?: boolean; // True if published, false if locked
  publishDate?: string;
  modules: ExamModule[];
  createdAt: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  fillBlankValue?: string;
  timeSpentSeconds: number;
}

export interface Submission {
  id: string;
  examId: string;
  moduleId: string;
  userId: string;
  userName: string;
  studentId: string;
  score: number; // Percentage or points
  totalQuestions: number;
  correctCount: number;
  answers: UserAnswer[];
  submittedAt: string;
  antiCheatViolationCount: number;
}

export interface AntiCheatLog {
  id: string;
  userId: string;
  userName: string;
  studentId: string;
  examId: string;
  moduleId: string;
  eventType: 'tab_switch' | 'window_blur' | 'fullscreen_exit';
  event?: string;
  warningCount?: number;
  timestamp: string;
  details?: string;
}
