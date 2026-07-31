import { User, Exam, Question, Submission, AntiCheatLog } from '../types';

const passwordHash = '$2a$10$w6M7q3p/k9Zz9t.g3/6VyeGz3/U9eD2eF3.L/M9X8/1Y1Y1Y1Y1Y1';

// Seed Admin & Core Test Students
const baseUsers: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@caculus.edu.vn',
    passwordHash,
    name: 'Quản trị viên hệ thống',
    studentId: 'ADMIN-001',
    role: 'admin',
    isVip: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-student-1',
    email: 'student@caculus.edu.vn',
    passwordHash,
    name: 'Nguyễn Cường',
    studentId: 'CACULUS_496692',
    role: 'student',
    isVip: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-student-2',
    email: 'tranvanb@caculus.edu.vn',
    passwordHash,
    name: 'Trần Văn B',
    studentId: 'CACULUS_496693',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-student-3',
    email: 'lethic@caculus.edu.vn',
    passwordHash,
    name: 'Lê Thị C',
    studentId: 'CACULUS_496694',
    role: 'student',
    createdAt: new Date().toISOString(),
  }
];

// Task 4: 30 Mock Student Profiles with Vietnamese Names & Scores (40% to 98%)
const mockStudentData = [
  { name: 'Nguyễn Minh Triết', idNum: '108291', score: 98, exams: 5 },
  { name: 'Trần Hoàng Nam', idNum: '293812', score: 96, exams: 4 },
  { name: 'Lê Phương Thảo', idNum: '819230', score: 95, exams: 6 },
  { name: 'Đặng Quốc Bảo', idNum: '304918', score: 93, exams: 4 },
  { name: 'Vũ Hoàng Yến', idNum: '918234', score: 92, exams: 5 },
  { name: 'Phạm Đức Anh', idNum: '129384', score: 90, exams: 3 },
  { name: 'Bùi Thị Mai', idNum: '827364', score: 89, exams: 4 },
  { name: 'Đỗ Quang Huy', idNum: '394827', score: 88, exams: 5 },
  { name: 'Hoàng Ngọc Ánh', idNum: '583920', score: 86, exams: 3 },
  { name: 'Nguyễn Thành Long', idNum: '948201', score: 85, exams: 4 },
  { name: 'Lương Gia Huy', idNum: '284719', score: 84, exams: 2 },
  { name: 'Trịnh Như Quỳnh', idNum: '472910', score: 82, exams: 3 },
  { name: 'Phan Nhật Minh', idNum: '739201', score: 80, exams: 4 },
  { name: 'Đào Khánh Linh', idNum: '193847', score: 79, exams: 2 },
  { name: 'Đinh Tấn Phát', idNum: '582019', score: 77, exams: 3 },
  { name: 'Phùng Hải Yến', idNum: '392018', score: 75, exams: 2 },
  { name: 'Tạ Minh Khôi', idNum: '849201', score: 74, exams: 3 },
  { name: 'Dương Thu Trang', idNum: '103928', score: 72, exams: 2 },
  { name: 'Ngô Bảo Lâm', idNum: '592018', score: 70, exams: 4 },
  { name: 'Cao Hoài Nam', idNum: '293049', score: 68, exams: 2 },
  { name: 'Nguyễn Khánh Vy', idNum: '839201', score: 65, exams: 1 },
  { name: 'Đặng Tuấn Kiệt', idNum: '492018', score: 63, exams: 2 },
  { name: 'Trần Đức Thắng', idNum: '192038', score: 60, exams: 1 },
  { name: 'Vũ Mỹ Duyên', idNum: '583920', score: 58, exams: 2 },
  { name: 'Lê Gia Bảo', idNum: '930192', score: 55, exams: 1 },
  { name: 'Phạm Quỳnh Anh', idNum: '482019', score: 52, exams: 2 },
  { name: 'Bùi Duy Khánh', idNum: '193049', score: 50, exams: 1 },
  { name: 'Đỗ Phương Nam', idNum: '593029', score: 48, exams: 1 },
  { name: 'Hoàng Bảo Ngọc', idNum: '839102', score: 45, exams: 1 },
  { name: 'Nguyễn Hải Đăng', idNum: '293840', score: 40, exams: 1 },
];

const mockStudents: User[] = mockStudentData.map((item, idx) => ({
  id: `user-student-mock-${idx + 1}`,
  email: `student_mock${idx + 1}@caculus.edu.vn`,
  passwordHash,
  name: item.name,
  studentId: `CACULUS_${item.idNum}`,
  role: 'student',
  createdAt: new Date().toISOString(),
}));

export const INITIAL_USERS: User[] = [...baseUsers, ...mockStudents];

// Active Exams
const activeExams: Exam[] = [
  {
    id: 'exam-2k9-1',
    title: 'Đề TSA Caculus DEMO 01',
    description: 'Bộ đề thi chuẩn cấu trúc Đánh giá Tư duy (TSA) Bách Khoa 2026',
    isFree: true,
    status: 'active',
    modules: [
      {
        id: 'mod-math-1',
        examId: 'exam-2k9-1',
        title: '1. Tư duy Toán học',
        category: 'math',
        durationMinutes: 60,
        openTime: '00:00 02/05/2026',
        closeTime: '02:59 07/05/2027',
        totalQuestions: 40,
      },
      {
        id: 'mod-reading-1',
        examId: 'exam-2k9-1',
        title: '2. Tư duy Đọc hiểu',
        category: 'reading',
        durationMinutes: 30,
        openTime: '11:01 24/03/2026',
        closeTime: '11:01 31/05/2026',
        totalQuestions: 20,
      },
      {
        id: 'mod-science-1',
        examId: 'exam-2k9-1',
        title: '3. Tư duy Khoa học & Giải quyết vấn đề',
        category: 'science',
        durationMinutes: 60,
        openTime: '14:01 23/03/2026',
        closeTime: '14:01 07/05/2027',
        totalQuestions: 20,
      }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exam-2k9-2',
    title: 'Đề TSA Caculus DEMO 02',
    description: 'Thử thách nâng cao các dạng bài logic và phân tích dữ liệu thực tế',
    isFree: false,
    price: 150000,
    status: 'active',
    modules: [
      {
        id: 'mod-math-2',
        examId: 'exam-2k9-2',
        title: '1. Tư duy Toán học',
        category: 'math',
        durationMinutes: 60,
        openTime: '08:00 01/06/2026',
        closeTime: '23:59 30/12/2027',
        totalQuestions: 40,
      },
      {
        id: 'mod-reading-2',
        examId: 'exam-2k9-2',
        title: '2. Tư duy Đọc hiểu',
        category: 'reading',
        durationMinutes: 30,
        openTime: '08:00 01/06/2026',
        closeTime: '23:59 30/12/2027',
        totalQuestions: 20,
      },
      {
        id: 'mod-science-2',
        examId: 'exam-2k9-2',
        title: '3. Tư duy Khoa học & Giải quyết vấn đề',
        category: 'science',
        durationMinutes: 60,
        openTime: '08:00 01/06/2026',
        closeTime: '23:59 30/12/2027',
        totalQuestions: 20,
      }
    ],
    createdAt: new Date().toISOString(),
  }
];

// Task 5: 36 Placeholder Exams ("Đề thực chiến TSA VIP 001" -> "Đề thực chiến TSA VIP 036")
const vipExams: Exam[] = Array.from({ length: 36 }).map((_, idx) => {
  const numStr = String(idx + 1).padStart(3, '0');
  return {
    id: `exam-vip-${numStr}`,
    title: `Đề thực chiến TSA VIP ${numStr}`,
    description: `Bộ đề thi thử nghiệm cấu trúc Đánh giá Tư duy chuẩn Bách Khoa 2026 (Chuyên đề VIP ${numStr})`,
    isFree: false,
    price: 150000,
    status: 'disabled',
    modules: [
      {
        id: `mod-math-vip-${numStr}`,
        examId: `exam-vip-${numStr}`,
        title: '1. Tư duy Toán học',
        category: 'math',
        durationMinutes: 60,
        openTime: 'Chưa mở',
        closeTime: 'Chưa mở',
        totalQuestions: 40,
      },
      {
        id: `mod-reading-vip-${numStr}`,
        examId: `exam-vip-${numStr}`,
        title: '2. Tư duy Đọc hiểu',
        category: 'reading',
        durationMinutes: 30,
        openTime: 'Chưa mở',
        closeTime: 'Chưa mở',
        totalQuestions: 20,
      },
      {
        id: `mod-science-vip-${numStr}`,
        examId: `exam-vip-${numStr}`,
        title: '3. Tư duy Khoa học & Giải quyết vấn đề',
        category: 'science',
        durationMinutes: 60,
        openTime: 'Chưa mở',
        closeTime: 'Chưa mở',
        totalQuestions: 20,
      }
    ],
    createdAt: new Date().toISOString(),
  };
});

export const INITIAL_EXAMS: Exam[] = [...activeExams, ...vipExams];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-read-16',
    moduleId: 'mod-reading-1',
    number: 16,
    text: 'Theo đoạn văn, phát biểu nào sau đây đúng về ứng dụng ban đầu của thủy canh?',
    passage: `[Đoạn văn Đọc hiểu] 
Trong những năm 1930, William Frederick Gericke tại Đại học California ở Berkeley bắt đầu thúc đẩy việc trồng cây nông nghiệp trong dung dịch dinh dưỡng thay vì đất. Ông đặt tên cho phương pháp này là "Hydroponics" (Thủy canh). Gericke đã thu hút sự chú ý của công chúng khi trồng được những cây cà chua khổng lồ trong bãi sau nhà mình bằng các bể chứa nước dinh dưỡng.

Tuy nhiên, giới báo chí Mỹ thời đó đã thêu dệt và làm quá lên về tính khả thi thương mại cũng như quy mô áp dụng thực tế. Mặc dù phương pháp thủy canh của Gericke tỏ ra vượt trội trong môi trường thí nghiệm kiểm soát, việc triển khai đại trà đòi hỏi chi phí hạ tầng ban đầu rất lớn. Nhiều kẻ vụ lợi đã lợi dụng các tiêu đề giật gân của báo chí để bán các bộ kits thủy canh kém chất lượng nhằm trục lợi từ người tiêu dùng thiếu kinh nghiệm.

(Dòng 38-45): Phương pháp này có thể được áp dụng trong môi trường vô trùng, giảm thiểu đáng kể sâu bệnh và lượng nước tiêu thụ so với canh tác truyền thống.
(Dòng 46-52): Tóm lại, mặc dù phương pháp thủy canh thực sự là một đột phá khoa học quan trọng, bài học từ làn sóng cường điệu đầu thế kỷ 20 cho thấy tầm quan trọng của việc đánh giá trung thực giữa thành công phòng thí nghiệm và tính khả thi kinh tế thị trường.`,
    options: [
      { id: 'opt-a', text: 'Các loại cây trong bảng phương pháp thủy canh của Gericke' },
      { id: 'opt-b', text: 'Việc áp dụng thủy canh của Gericke' },
      { id: 'opt-c', text: 'Những cây cà chua của Gericke' },
      { id: 'opt-d', text: 'Các bể chứa nước lớn' }
    ],
    correctOptionId: 'opt-c',
    explanation: 'Dựa vào đoạn văn, Gericke đã thành công trồng những cây cà chua khổng lồ trong bãi sau nhà mình để chứng minh thủy canh.'
  },
  {
    id: 'q-read-17',
    moduleId: 'mod-reading-1',
    number: 17,
    text: 'Kết luận chính của tác giả trong đoạn cuối (dòng 46-52) là gì?',
    passage: `(Dòng 46-52): Tóm lại, mặc dù phương pháp thủy canh thực sự là một đột phá khoa học quan trọng, bài học từ làn sóng cường điệu đầu thế kỷ 20 cho thấy tầm quan trọng của việc đánh giá trung thực giữa thành công phòng thí nghiệm và tính khả thi kinh tế thị trường.`,
    options: [
      { id: 'opt-a', text: 'Báo chí Mỹ đã thiếu chính xác khi viết về thủy canh.' },
      { id: 'opt-b', text: 'Các ưu điểm của phương pháp thủy canh đã được chứng minh.' },
      { id: 'opt-c', text: 'Cây cà chua được trồng bằng phương pháp thủy canh đáng được ca ngợi.' },
      { id: 'opt-d', text: 'Những kẻ vô đạo đức lợi dụng ưu điểm của thủy canh để trục lợi.' }
    ],
    correctOptionId: 'opt-a',
    explanation: 'Tác giả nhấn mạnh sự chênh lệch giữa sự thêu dệt truyền thông và thực tế kinh tế thương mại.'
  },
  {
    id: 'q-read-18',
    moduleId: 'mod-reading-1',
    number: 18,
    text: 'Ý nào sau đây KHÔNG được nhắc đến trong đoạn 6 (dòng 38-45)?',
    passage: `(Dòng 38-45): Phương pháp này có thể được áp dụng trong môi trường vô trùng, giảm thiểu đáng kể sâu bệnh và lượng nước tiêu thụ so với canh tác truyền thống.`,
    options: [
      { id: 'opt-a', text: 'Có thể sử dụng phương pháp thủy canh trong môi trường trơ.' },
      { id: 'opt-b', text: 'Thủy canh tiết kiệm nước hơn so với đất.' },
      { id: 'opt-c', text: 'Sâu bệnh được loại bỏ hoàn toàn mà không cần hóa chất.' },
      { id: 'opt-d', text: 'Năng suất nông sản tăng gấp 10 lần.' }
    ],
    correctOptionId: 'opt-d',
    explanation: 'Đoạn văn không đưa ra con số khẳng định năng suất tăng gấp 10 lần.'
  },
  {
    id: 'q-math-1',
    moduleId: 'mod-math-1',
    number: 1,
    text: 'Một công ty sản xuất đồ điện tử tính toán chi phí cố định hằng ngày là 12,000,000 VNĐ và chi phí sản xuất mỗi sản phẩm là 450,000 VNĐ. Nếu giá bán mỗi sản phẩm là 650,000 VNĐ, công ty cần bán ít nhất bao nhiêu sản phẩm mỗi ngày để bắt đầu có lãi?',
    options: [
      { id: 'opt-m1-a', text: '50 sản phẩm' },
      { id: 'opt-m1-b', text: '60 sản phẩm' },
      { id: 'opt-m1-c', text: '61 sản phẩm' },
      { id: 'opt-m1-d', text: '75 sản phẩm' }
    ],
    correctOptionId: 'opt-m1-c',
    explanation: 'Lợi nhuận mỗi sản phẩm = 650,000 - 450,000 = 200,000 VNĐ. Điểm hòa vốn = 12,000,000 / 200,000 = 60 sản phẩm. Để bắt đầu có lãi cần ít nhất 61 sản phẩm.'
  },
  {
    id: 'q-sci-1',
    moduleId: 'mod-science-1',
    number: 1,
    text: 'Trong phản ứng tổng hợp Ammonia (NH3) theo phương pháp Haber-Bosch: N2(k) + 3H2(k) ⇌ 2NH3(k), ΔH < 0. Để tăng hiệu suất thu hồi NH3 trong công nghiệp, biện pháp nào sau đây là hiệu quả nhất?',
    options: [
      { id: 'opt-s1-a', text: 'Tăng nhiệt độ và giảm áp suất hệ thống' },
      { id: 'opt-s1-b', text: 'Giảm nhiệt độ và tăng áp suất hệ thống' },
      { id: 'opt-s1-c', text: 'Tăng nhiệt độ và sử dụng thêm chất xúc tác Fe' },
      { id: 'opt-s1-d', text: 'Giảm áp suất và ngưng tụ liên tục NH3' }
    ],
    correctOptionId: 'opt-s1-b',
    explanation: 'Phản ứng tỏa nhiệt (ΔH < 0) nên giảm nhiệt độ dịch chuyển cân bằng sang phải. Phản ứng làm giảm số mol khí nên tăng áp suất dịch chuyển sang phải.'
  }
];

// Submissions for primary students + 30 mock students
const baseSubmissions: Submission[] = [
  {
    id: 'sub-1',
    examId: 'exam-2k9-1',
    moduleId: 'mod-math-1',
    userId: 'user-student-1',
    userName: 'Nguyễn Cường',
    studentId: 'CACULUS_496692',
    score: 85,
    totalQuestions: 40,
    correctCount: 34,
    answers: [],
    submittedAt: '2026-07-24T14:30:00.000Z',
    antiCheatViolationCount: 0,
  },
  {
    id: 'sub-2',
    examId: 'exam-2k9-1',
    moduleId: 'mod-reading-1',
    userId: 'user-student-1',
    userName: 'Nguyễn Cường',
    studentId: 'CACULUS_496692',
    score: 90,
    totalQuestions: 20,
    correctCount: 18,
    answers: [],
    submittedAt: '2026-07-24T15:15:00.000Z',
    antiCheatViolationCount: 1,
  }
];

const mockSubmissions: Submission[] = mockStudentData.map((item, idx) => ({
  id: `sub-mock-${idx + 1}`,
  examId: 'exam-2k9-1',
  moduleId: 'mod-math-1',
  userId: `user-student-mock-${idx + 1}`,
  userName: item.name,
  studentId: `CACULUS_${item.idNum}`,
  score: item.score,
  totalQuestions: 40,
  correctCount: Math.round((item.score / 100) * 40),
  answers: [],
  submittedAt: new Date(Date.now() - (idx + 1) * 3600000 * 4).toISOString(),
  antiCheatViolationCount: 0,
}));

export const INITIAL_SUBMISSIONS: Submission[] = [...baseSubmissions, ...mockSubmissions];

export const INITIAL_ANTICHEAT_LOGS: AntiCheatLog[] = [
  {
    id: 'ac-1',
    userId: 'user-student-1',
    userName: 'Nguyễn Cường',
    studentId: 'CACULUS_496692',
    examId: 'exam-2k9-1',
    moduleId: 'mod-reading-1',
    eventType: 'tab_switch',
    timestamp: '2026-07-24T15:10:22.000Z',
    details: 'Thí sinh rời màn hình bài thi (Chuyển tab trình duyệt)'
  }
];
