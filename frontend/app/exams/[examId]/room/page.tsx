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
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      });

    // 2. Load Exam & Module Details
    fetch('/api/student/exams')
      .then(res => res.json())
      .then(data => {
        const foundExam = (data.exams || []).find((e: Exam) => e.id === examId);
        if (foundExam) {
          setExam(foundExam);
          const targetModule = foundExam.modules.find((m: ExamModule) => m.id === moduleIdParam) || foundExam.modules[0];
          setSelectedModule(targetModule);

          // 3. Fetch Real Saved Questions & Groups for this Module from Database
          fetch(`/api/student/exams?moduleId=${targetModule.id}`)
            .then(res => res.json())
            .then(modData => {
              if (modData.questions && modData.questions.length > 0) {
                setQuestions(modData.questions);
                setQuestionGroups(modData.questionGroups || []);
              } else {
                // Initial fallback if module hasn't been edited yet
                const initialFallback: Question[] = [
                  {
                    id: 'q-read-16',
                    moduleId: targetModule.id,
                    number: 16,
                    text: 'Theo đoạn văn, phát biểu nào sau đây đúng về ứng dụng ban đầu của thủy canh?',
                    passage: `[Đoạn văn Đọc hiểu] 
Trong những năm 1930, William Frederick Gericke tại Đại học California ở Berkeley bắt đầu thúc đẩy việc trồng cây nông nghiệp trong dung dịch dinh dưỡng thay vì đất. Gericke đã thu hút sự chú ý của công chúng khi trồng được những cây cà chua khổng lồ.`,
                    options: [
                      { id: 'opt-a', text: 'Các loại cây trong bảng phương pháp thủy canh của Gericke' },
                      { id: 'opt-b', text: 'Việc áp dụng thủy canh của Gericke' },
                      { id: 'opt-c', text: 'Những cây cà chua của Gericke' },
                      { id: 'opt-d', text: 'Các bể chứa nước lớn' }
                    ],
                    correctOptionId: 'opt-c'
                  },
                  ...Array.from({ length: 19 }).map((_, i) => ({
                    id: `q-gen-${i + 17}`,
                    moduleId: targetModule.id,
                    number: i + 17,
                    text: `[Câu hỏi tư duy chuẩn hóa TSA ${i + 17}] Cho biểu thức $f(x) = \\lim_{x \\to 2} \\frac{x^2-4}{x-2}$. Giá trị của $f(2)$ là bao nhiêu?`,
                    options: [
                      { id: `opt-${i}-a`, text: '$x = 4$' },
                      { id: `opt-${i}-b`, text: '$x = 2$' },
                      { id: `opt-${i}-c`, text: '$x = 0$' },
                      { id: `opt-${i}-d`, text: '$x = 8$' }
                    ],
                    correctOptionId: `opt-${i}-a`
                  }))
                ];
                setQuestions(initialFallback);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson"></div>
        <p className="text-sm font-semibold tracking-wider">ĐANG TẢI DỮ LIỆU CÂU HỎI THỰC THỜI TỪ MÁY CHỦ CACULUS...</p>
      </div>
    );
  }

  return (
    <SplitTestRoom
      examId={examId}
      module={selectedModule}
      questions={questions}
      questionGroups={questionGroups}
      studentName={user?.name || 'Nguyễn Cường'}
      studentId={user?.studentId || 'CACULUS_496692'}
    />
  );
}
