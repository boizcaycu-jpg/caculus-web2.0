import { User, Exam, Question, Submission, AntiCheatLog } from '../types';

const passwordHash = '$2a$10$w6M7q3p/k9Zz9t.g3/6VyeGz3/U9eD2eF3.L/M9X8/1Y1Y1Y1Y1Y1';

// Seed Admin & Core Test Students
const baseUsers: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@caculus.edu.vn',
    passwordHash,
    name: 'Quản trị viên 1',
    studentId: 'ADMIN-001',
    role: 'admin',
    isVip: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-admin-2',
    email: 'admin2@caculus.edu.vn',
    passwordHash,
    name: 'Quản trị viên 2',
    studentId: 'ADMIN-002',
    role: 'admin',
    isVip: true,
    createdAt: new Date().toISOString(),
  },
];

// Seed 500 VIP Student Accounts (Lightweight)
export const INITIAL_USERS: User[] = [
  ...baseUsers,
  ...Array.from({ length: 500 }).map((_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return {
      id: `user-hs-${num}`,
      email: `hs${num}@caculus.edu.vn`,
      passwordHash: '$2b$10$YY5sZXdKGo.2Zpw2.RxAKuFCSc87rt2px6Cf3URIhEiyxSb7TsVW.',
      passwordPlain: 'student123',
      name: null,
      realName: null,
      studentId: `CACULUS_VIP_${num}`,
      role: 'student' as const,
      isVip: true,
      createdAt: new Date().toISOString(),
    };
  })
];

// 3 DEMO TEST EXAMS
export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-demo-01',
    title: 'Đề TSA Caculus DEMO 01',
    description: 'Đề thi thử nghiệm miễn phí mở tự do',
    isFree: true,
    isDemoExam: true,
    isPublished: true,
    category: 'THỰC CHIẾN',
    status: 'ĐÃ UPDATE',
    createdAt: '2026-08-01T00:00:00.000Z',
    modules: [
      {
        id: 'mod-demo-1-math',
        examId: 'exam-demo-01',
        title: '1. Tư duy Toán học',
        category: 'math',
        durationMinutes: 60,
        openTime: '2026-01-01',
        closeTime: '2027-12-31',
        totalQuestions: 40,
      },
      {
        id: 'mod-demo-1-reading',
        examId: 'exam-demo-01',
        title: '2. Tư duy Đọc hiểu',
        category: 'reading',
        durationMinutes: 30,
        openTime: '2026-01-01',
        closeTime: '2027-12-31',
        totalQuestions: 20,
      },
      {
        id: 'mod-demo-1-science',
        examId: 'exam-demo-01',
        title: '3. Tư duy Khoa học & Giải quyết vấn đề',
        category: 'science',
        durationMinutes: 60,
        openTime: '2026-01-01',
        closeTime: '2027-12-31',
        totalQuestions: 40,
      }
    ]
  },
  {
    id: 'exam-demo-02',
    title: 'Đề TSA Caculus DEMO 02',
    description: 'Đề thi thử nghiệm mô phỏng cấu trúc TSA 2026',
    isFree: true,
    isDemoExam: true,
    isPublished: true,
    category: 'THỰC CHIẾN',
    status: 'ĐÃ UPDATE',
    createdAt: '2026-08-01T00:00:00.000Z',
    modules: [
      {
        id: 'mod-demo-2-math',
        examId: 'exam-demo-02',
        title: '1. Tư duy Toán học',
        category: 'math',
        durationMinutes: 60,
        openTime: '2026-01-01',
        closeTime: '2027-12-31',
        totalQuestions: 40,
      },
      {
        id: 'mod-demo-2-reading',
        examId: 'exam-demo-02',
        title: '2. Tư duy Đọc hiểu',
        category: 'reading',
        durationMinutes: 30,
        openTime: '2026-01-01',
        closeTime: '2027-12-31',
        totalQuestions: 20,
      },
      {
        id: 'mod-demo-2-science',
        examId: 'exam-demo-02',
        title: '3. Tư duy Khoa học & Giải quyết vấn đề',
        category: 'science',
        durationMinutes: 60,
        openTime: '2026-01-01',
        closeTime: '2027-12-31',
        totalQuestions: 40,
      }
    ]
  }
];

// Single lightweight TEST placeholder question for unedited modules
export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-test-1',
    moduleId: 'mod-demo-1-math',
    number: 1,
    type: 'single_choice',
    text: '[TEST]',
    options: [
      { id: 'opt-a', text: 'TEST A' },
      { id: 'opt-b', text: 'TEST B' },
      { id: 'opt-c', text: 'TEST C' },
      { id: 'opt-d', text: 'TEST D' },
    ],
    correctOptionId: 'opt-a',
    explanation: '',
    explanationImageUrl: '',
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [];
export const INITIAL_ANTICHEAT_LOGS: AntiCheatLog[] = [];
