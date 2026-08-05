import fs from 'fs';
import path from 'path';
import { User, Exam, Question, QuestionGroup, Submission, AntiCheatLog } from '../types';
import { INITIAL_USERS, INITIAL_EXAMS, INITIAL_QUESTIONS, INITIAL_SUBMISSIONS, INITIAL_ANTICHEAT_LOGS } from './mockData';
import { readPersistentDb, writePersistentDb } from './cloud-db';

interface DatabaseSchema {
  users: User[];
  exams: Exam[];
  questions: Question[];
  questionGroups: QuestionGroup[];
  submissions: Submission[];
  antiCheatLogs: AntiCheatLog[];
}

const defaultFallbackState: DatabaseSchema = {
  users: INITIAL_USERS,
  exams: INITIAL_EXAMS,
  questions: INITIAL_QUESTIONS,
  questionGroups: [],
  submissions: INITIAL_SUBMISSIONS,
  antiCheatLogs: INITIAL_ANTICHEAT_LOGS,
};

function ensureDbFile(): DatabaseSchema {
  try {
    const raw = readPersistentDb(defaultFallbackState);
    return {
      users: raw.users || INITIAL_USERS,
      exams: raw.exams || INITIAL_EXAMS,
      questions: raw.questions || INITIAL_QUESTIONS,
      questionGroups: raw.questionGroups || [],
      submissions: raw.submissions || INITIAL_SUBMISSIONS,
      antiCheatLogs: raw.antiCheatLogs || INITIAL_ANTICHEAT_LOGS,
    };
  } catch (error) {
    console.error('Error reading DB file, returning fallback state:', error);
    return defaultFallbackState;
  }
}

function saveDb(data: DatabaseSchema): void {
  try {
    writePersistentDb(data);
  } catch (error) {
    console.error('Error writing DB file:', error);
  }
}

// User operations
export function getUsers(): User[] {
  const db = ensureDbFile();
  return db.users;
}

export function getUserByEmail(emailOrUsername: string): User | undefined {
  const db = ensureDbFile();
  const cleanStr = emailOrUsername.trim().toLowerCase();
  
  return db.users.find(u => {
    const userEmail = u.email.toLowerCase();
    const userStudentId = (u.studentId || '').toLowerCase();
    const userId = u.id.toLowerCase();

    return (
      userEmail === cleanStr ||
      userEmail === `${cleanStr}@caculus.edu.vn` ||
      userStudentId === cleanStr ||
      userId === cleanStr ||
      userId === `user-${cleanStr}` ||
      userId === `user-hs-${cleanStr}`
    );
  });
}

export function getUserById(id: string): User | undefined {
  const db = ensureDbFile();
  return db.users.find(u => u.id === id);
}

export function createUser(user: User): User {
  const db = ensureDbFile();
  db.users.push(user);
  saveDb(db);
  return user;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const db = ensureDbFile();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...updates };
  saveDb(db);
  return db.users[idx];
}

export function deleteUser(id: string): boolean {
  const db = ensureDbFile();
  const initialLength = db.users.length;
  db.users = db.users.filter(u => u.id !== id);
  if (db.users.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// Exam operations
export function getExams(): Exam[] {
  const db = ensureDbFile();
  return db.exams;
}

export function getExamById(id: string): Exam | undefined {
  const db = ensureDbFile();
  return db.exams.find(e => e.id === id);
}

export function createExam(exam: Exam): Exam {
  const db = ensureDbFile();
  db.exams.push(exam);
  saveDb(db);
  return exam;
}

export function updateExam(id: string, updates: Partial<Exam>): Exam | null {
  const db = ensureDbFile();
  const idx = db.exams.findIndex(e => e.id === id);
  if (idx === -1) return null;
  db.exams[idx] = { ...db.exams[idx], ...updates };
  saveDb(db);
  return db.exams[idx];
}

export function deleteExam(id: string): boolean {
  const db = ensureDbFile();
  const initialLength = db.exams.length;
  db.exams = db.exams.filter(e => e.id !== id);
  if (db.exams.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// Question operations
export function getQuestionsByModule(moduleId: string): Question[] {
  const db = ensureDbFile();
  const filtered = db.questions.filter(q => q.moduleId === moduleId).sort((a, b) => a.number - b.number);
  return filtered;
}

export function createQuestion(question: Question): Question {
  const db = ensureDbFile();
  db.questions.push(question);
  saveDb(db);
  return question;
}

export function saveQuestionsForModule(moduleId: string, newQuestions: Question[]): void {
  const db = ensureDbFile();
  db.questions = db.questions.filter(q => q.moduleId !== moduleId);
  db.questions.push(...newQuestions);
  saveDb(db);
}

export function getQuestionGroupsByModule(moduleId: string): QuestionGroup[] {
  const db = ensureDbFile();
  return (db.questionGroups || []).filter(g => g.moduleId === moduleId);
}

export function saveQuestionGroupsForModule(moduleId: string, newGroups: QuestionGroup[]): void {
  const db = ensureDbFile();
  const currentGroups = db.questionGroups || [];
  db.questionGroups = currentGroups.filter(g => g.moduleId !== moduleId).concat(newGroups);
  saveDb(db);
}

// Submissions
export function getSubmissions(userId?: string): Submission[] {
  const db = ensureDbFile();
  if (userId) {
    return db.submissions.filter(s => s.userId === userId);
  }
  return db.submissions;
}

export function createSubmission(submission: Submission): Submission {
  const db = ensureDbFile();
  db.submissions.push(submission);
  saveDb(db);
  return submission;
}

// Anti-cheat logs
export function getAntiCheatLogs(): AntiCheatLog[] {
  const db = ensureDbFile();
  return db.antiCheatLogs;
}

export function logAntiCheatViolation(log: AntiCheatLog): AntiCheatLog {
  const db = ensureDbFile();
  db.antiCheatLogs.unshift(log);
  saveDb(db);
  return log;
}
