const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

function generateRandomPassword(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

async function run() {
  console.log('Seeding pre-provisioned db.json...');

  // 1. Users: 2 Admins + 500 VIP Students
  const users = [
    {
      id: 'user-admin-1',
      email: 'admin@caculus.edu.vn',
      passwordHash: await bcrypt.hash('admin123', 10),
      passwordPlain: 'admin123',
      name: 'Quản trị viên 1',
      realName: 'Quản trị viên 1',
      studentId: 'ADMIN-001',
      role: 'admin',
      isVip: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-admin-2',
      email: 'admin2@caculus.edu.vn',
      passwordHash: await bcrypt.hash('admin123', 10),
      passwordPlain: 'admin123',
      name: 'Quản trị viên 2',
      realName: 'Quản trị viên 2',
      studentId: 'ADMIN-002',
      role: 'admin',
      isVip: true,
      createdAt: new Date().toISOString(),
    },
  ];

  for (let i = 1; i <= 500; i++) {
    const padded = String(i).padStart(3, '0');
    const email = `hs${padded}@caculus.edu.vn`;
    const plainPass = generateRandomPassword(6);
    const passHash = await bcrypt.hash(plainPass, 10);
    const studentId = `CACULUS_VIP_${padded}`;

    users.push({
      id: `user-hs-${padded}`,
      email,
      passwordHash: passHash,
      passwordPlain: plainPass,
      name: null,
      realName: null,
      studentId,
      role: 'student',
      isVip: true,
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Exams: 3 DEMO TEST + 21 LUYỆN TẬP + 20 THỰC CHIẾN VIP
  const exams = [];

  // DEMO TEST EXAMS (THỰC CHIẾN, Published)
  const demoTitles = [
    'Đề TSA Caculus DEMO 01',
    'Đề TSA Caculus DEMO 02',
    'Đề TSA Caculus DEMO 03',
  ];

  demoTitles.forEach((title, idx) => {
    exams.push({
      id: `exam-demo-0${idx + 1}`,
      title,
      description: `Bộ đề thi thử nghiệm cấu trúc Đánh giá Tư duy (TSA) Bách Khoa 2026 - DEMO 0${idx + 1}`,
      isFree: true,
      isDemoExam: true,
      isPublished: true,
      category: 'THỰC CHIẾN',
      status: 'ĐÃ UPDATE',
      price: 0,
      createdAt: new Date().toISOString(),
      modules: [
        {
          id: `mod-demo-${idx + 1}-math`,
          examId: `exam-demo-0${idx + 1}`,
          title: '1. Tư duy Toán học',
          category: 'math',
          durationMinutes: 60,
          totalQuestions: 40,
          openTime: '2026-01-01',
          closeTime: '2027-12-31',
        },
        {
          id: `mod-demo-${idx + 1}-reading`,
          examId: `exam-demo-0${idx + 1}`,
          title: '2. Tư duy Đọc hiểu',
          category: 'reading',
          durationMinutes: 30,
          totalQuestions: 20,
          openTime: '2026-01-01',
          closeTime: '2027-12-31',
        },
        {
          id: `mod-demo-${idx + 1}-science`,
          examId: `exam-demo-0${idx + 1}`,
          title: '3. Tư duy Khoa học & Giải quyết vấn đề',
          category: 'science',
          durationMinutes: 60,
          totalQuestions: 20,
          openTime: '2026-01-01',
          closeTime: '2027-12-31',
        },
      ],
    });
  });

  // LUYỆN TẬP EXAMS (Chuyên đề từng phần)
  const mathTopics = [
    'Chuyên đề 01: Hàm số & Đồ thị',
    'Chuyên đề 02: Mũ & Logarit',
    'Chuyên đề 03: Tích phân & Ứng dụng',
    'Chuyên đề 04: Số phức',
    'Chuyên đề 05: Khối đa diện & Thể tích',
    'Chuyên đề 06: Nón, Trụ & Cầu',
    'Chuyên đề 07: Phương pháp Tọa độ trong không gian (Oxyz)',
    'Chuyên đề 08: Lượng giác & Phương trình Lượng giác',
    'Chuyên đề 09: Dãy số, Cấp số cộng & Cấp số nhân',
    'Chuyên đề 10: Tổ hợp, Xác suất & Thống kê',
    'Chuyên đề 11: Hình học phẳng (Oxy)',
    'Chuyên đề 12: Phép dời hình & Đồng dạng',
    'Chuyên đề 13: Vectơ & Tọa độ',
    'Chuyên đề 14: Tư duy Logic & Phân tích số liệu Toán học',
  ];

  const readingTopics = [
    'Chuyên đề 01: Văn bản Báo chí & Chính luận',
    'Chuyên đề 02: Văn bản Khoa học & Công nghệ',
    'Chuyên đề 03: Văn bản Văn học & Nghệ thuật',
  ];

  const scienceTopics = [
    'Chuyên đề 01: Vật lý - Cơ học & Điện từ',
    'Chuyên đề 02: Hóa học - Phản ứng & Vật liệu',
    'Chuyên đề 03: Sinh học - Di truyền & Sinh thái',
    'Chuyên đề 04: Giải quyết vấn đề Khoa học Tổng hợp',
  ];

  mathTopics.forEach((topic, idx) => {
    exams.push({
      id: `practice-math-${idx + 1}`,
      title: topic,
      description: `Luyện tập chuyên đề chuyên sâu Tư duy Toán học TSA: ${topic}`,
      isFree: false,
      isDemoExam: false,
      isPublished: false, // Locked by default
      category: 'LUYỆN TẬP',
      subCategory: 'math',
      status: 'CHƯA UPDATE',
      price: 0,
      createdAt: new Date().toISOString(),
      modules: [
        {
          id: `mod-practice-math-${idx + 1}`,
          examId: `practice-math-${idx + 1}`,
          title: 'Tư duy Toán học',
          category: 'math',
          durationMinutes: 45,
          totalQuestions: 20,
          openTime: 'Chưa mở',
          closeTime: 'Chưa mở',
        },
      ],
    });
  });

  readingTopics.forEach((topic, idx) => {
    exams.push({
      id: `practice-reading-${idx + 1}`,
      title: topic,
      description: `Luyện tập chuyên đề chuyên sâu Tư duy Đọc hiểu TSA: ${topic}`,
      isFree: false,
      isDemoExam: false,
      isPublished: false,
      category: 'LUYỆN TẬP',
      subCategory: 'reading',
      status: 'CHƯA UPDATE',
      price: 0,
      createdAt: new Date().toISOString(),
      modules: [
        {
          id: `mod-practice-reading-${idx + 1}`,
          examId: `practice-reading-${idx + 1}`,
          title: 'Tư duy Đọc hiểu',
          category: 'reading',
          durationMinutes: 30,
          totalQuestions: 15,
          openTime: 'Chưa mở',
          closeTime: 'Chưa mở',
        },
      ],
    });
  });

  scienceTopics.forEach((topic, idx) => {
    exams.push({
      id: `practice-science-${idx + 1}`,
      title: topic,
      description: `Luyện tập chuyên đề chuyên sâu Tư duy Khoa học & GQVĐ TSA: ${topic}`,
      isFree: false,
      isDemoExam: false,
      isPublished: false,
      category: 'LUYỆN TẬP',
      subCategory: 'science',
      status: 'CHƯA UPDATE',
      price: 0,
      createdAt: new Date().toISOString(),
      modules: [
        {
          id: `mod-practice-science-${idx + 1}`,
          examId: `practice-science-${idx + 1}`,
          title: 'Tư duy Khoa học & GQVĐ',
          category: 'science',
          durationMinutes: 45,
          totalQuestions: 15,
          openTime: 'Chưa mở',
          closeTime: 'Chưa mở',
        },
      ],
    });
  });

  // THỰC CHIẾN EXAMS (20 VIP Full Exams)
  for (let i = 1; i <= 20; i++) {
    const padded = String(i).padStart(2, '0');
    exams.push({
      id: `exam-vip-${padded}`,
      title: `Đề TSA Caculus VIP ${padded}`,
      description: `Đề thi thực chiến 3 phần Đánh giá Tư duy chuẩn Bách Khoa 2026 - Bộ đề VIP ${padded}`,
      isFree: false,
      isDemoExam: false,
      isPublished: false, // Locked by default
      category: 'THỰC CHIẾN',
      status: 'CHƯA UPDATE',
      price: 150000,
      createdAt: new Date().toISOString(),
      modules: [
        {
          id: `mod-vip-${padded}-math`,
          examId: `exam-vip-${padded}`,
          title: '1. Tư duy Toán học',
          category: 'math',
          durationMinutes: 60,
          totalQuestions: 40,
          openTime: 'Chưa mở',
          closeTime: 'Chưa mở',
        },
        {
          id: `mod-vip-${padded}-reading`,
          examId: `exam-vip-${padded}`,
          title: '2. Tư duy Đọc hiểu',
          category: 'reading',
          durationMinutes: 30,
          totalQuestions: 20,
          openTime: 'Chưa mở',
          closeTime: 'Chưa mở',
        },
        {
          id: `mod-vip-${padded}-science`,
          examId: `exam-vip-${padded}`,
          title: '3. Tư duy Khoa học & Giải quyết vấn đề',
          category: 'science',
          durationMinutes: 60,
          totalQuestions: 20,
          openTime: 'Chưa mở',
          closeTime: 'Chưa mở',
        },
      ],
    });
  }

  const dbSchema = {
    users,
    exams,
    questions: [],
    questionGroups: [],
    submissions: [],
    antiCheatLogs: [],
  };

  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(dbSchema, null, 2), 'utf-8');

  console.log(`✅ Pre-seeded db.json successfully! Total exams: ${exams.length}`);
}

run().catch(console.error);
