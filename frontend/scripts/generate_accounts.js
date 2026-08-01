const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');
const CSV_FILE = path.join(__dirname, '..', 'public', 'caculus_500_accounts.csv');

function generateRandomPassword(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

async function run() {
  console.log('Generating 500 VIP student accounts...');

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

  const csvLines = ['Email,Password,Student_ID'];

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

    csvLines.push(`${email},${plainPass},${studentId}`);
  }

  // Preserve existing exams and submissions if db.json exists
  let existingExams = [];
  let existingQuestions = [];
  let existingQuestionGroups = [];
  let existingSubmissions = [];
  let existingAntiCheatLogs = [];

  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      existingExams = parsed.exams || [];
      existingQuestions = parsed.questions || [];
      existingQuestionGroups = parsed.questionGroups || [];
      existingSubmissions = parsed.submissions || [];
      existingAntiCheatLogs = parsed.antiCheatLogs || [];
    } catch (e) {}
  }

  const dbSchema = {
    users,
    exams: existingExams,
    questions: existingQuestions,
    questionGroups: existingQuestionGroups,
    submissions: existingSubmissions,
    antiCheatLogs: existingAntiCheatLogs,
  };

  // Write db.json
  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(dbSchema, null, 2), 'utf-8');

  // Write public/caculus_500_accounts.csv
  const publicDir = path.dirname(CSV_FILE);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(CSV_FILE, csvLines.join('\n'), 'utf-8');

  console.log(`✅ Generated 500 VIP Accounts successfully!`);
  console.log(`📁 Database saved to: ${DB_FILE}`);
  console.log(`📄 CSV exported to: ${CSV_FILE}`);
}

run().catch(console.error);
