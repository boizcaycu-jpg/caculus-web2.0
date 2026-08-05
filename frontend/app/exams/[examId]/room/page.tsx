'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import SplitTestRoom from '@/components/test-room/SplitTestRoom';
import { Exam, ExamModule, Question, QuestionGroup } from '@/types';
import { TokenPayload } from '@/lib/auth';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const examId = params.examId as string;
  const moduleIdParam = searchParams.get('module');

  const [exam, setExam] = useState<Exam | null>(null);
  const [selectedModule, setSelectedModule] = useState<ExamModule | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verify Session
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      });

    // 2. Load Exam & Module Details with timestamp cache-buster
    fetch(`/api/student/exams?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const foundExam = (data.exams || []).find((e: Exam) => e.id === examId);
        if (foundExam) {
          setExam(foundExam);
          const targetModule = foundExam.modules.find((m: ExamModule) => m.id === moduleIdParam) || foundExam.modules[0];
          setSelectedModule(targetModule);

          // 3. Fetch Real Saved Questions & Groups for this Module from Database
          fetch(`/api/student/exams?moduleId=${targetModule.id}&t=${Date.now()}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(modData => {
              if (modData.questions && modData.questions.length > 0) {
                setQuestions(modData.questions);
                setQuestionGroups(modData.questionGroups || []);
              } else {
                // Lightweight single TEST placeholder question
                const initialFallback: Question[] = [
                  {
                    id: `q-test-${targetModule.id}`,
                    moduleId: targetModule.id,
                    number: 1,
                    type: 'single_choice',
                    text: '[TEST]',
                    options: [
                      { id: 'opt-a', text: 'TEST A' },
                      { id: 'opt-b', text: 'TEST B' },
                      { id: 'opt-c', text: 'TEST C' },
                      { id: 'opt-d', text: 'TEST D' }
                    ],
                    correctOptionId: 'opt-a',
                    explanation: '',
                    explanationImageUrl: ''
                  }
                ];
                setQuestions(initialFallback);
                setQuestionGroups([]);
              }
              setLoading(false);
            })
            .catch(err => {
              console.error('Error fetching module questions:', err);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      });
  }, [examId, moduleIdParam, router]);

  if (loading || !selectedModule) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d90429]"></div>
        <p className="text-sm font-semibold tracking-wider">ĐANG TẢI DỮ LIỆU CÂU HỎI CHUẨN HOÁ TỪ MÁY CHỦ CACULUS...</p>
      </div>
    );
  }

  // Pass key={selectedModule.id} so React completely re-mounts fresh state on module transition
  return (
    <SplitTestRoom
      key={selectedModule.id}
      examId={examId}
      module={selectedModule}
      questions={questions}
      questionGroups={questionGroups}
      studentName={user?.name || user?.realName || 'Nguyễn Cường'}
      studentId={user?.studentId || 'CACULUS_VIP_001'}
    />
  );
}
