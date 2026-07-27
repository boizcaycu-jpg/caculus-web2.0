'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import SplitTestRoom from '@/components/test-room/SplitTestRoom';
import { Exam, ExamModule, Question } from '@/types';
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

    // 2. Load Exam & Questions
    fetch('/api/student/exams')
      .then(res => res.json())
      .then(data => {
        const foundExam = (data.exams || []).find((e: Exam) => e.id === examId);
        if (foundExam) {
          setExam(foundExam);
          const targetModule = foundExam.modules.find((m: ExamModule) => m.id === moduleIdParam) || foundExam.modules[0];
          setSelectedModule(targetModule);

          // Fetch questions for target module (or fallback mock)
          const mockQList: Question[] = [
            {
              id: 'q-read-16',
              moduleId: targetModule.id,
              number: 16,
              text: 'Theo đoạn văn, phát biểu nào sau đây đúng về ứng dụng ban đầu của thủy canh?',
              passage: `[Đoạn văn Đọc hiểu]
Trong những năm 1930, William Frederick Gericke tại Đại học California ở Berkeley bắt đầu thúc đẩy việc trồng cây nông nghiệp trong dung dịch dinh dưỡng thay vì đất. Ông đặt tên cho phương pháp này là "Hydroponics" (Thủy canh). Gericke đã thu hút sự chú ý của công chúng khi trồng được những cây cà chua khổng lồ trong bãi sau nhà mình bằng các bể chứa nước dinh dưỡng.

Tuy nhiên, giới báo chí Mỹ thời đó đã thêu dệt và làm quá lên về tính khả thi thương mại cũng như quy mô áp dụng thực tế. Mặc dù phương pháp thủy canh của Gericke tỏ ra vượt trội trong môi trường thí nghiệm kiểm soát, việc triển khai đại trà đòi hỏi chi phí hạ tầng ban đầu rất lớn. Nhiều kẻ vụ lợi đã lợi dụng các tiêu đề giật gân của báo chí để bán các bộ kits thủy canh kém chất lượng nhằm trục lợi từ người tiêu dùng thiếu kinh nghiệm.`,
              options: [
                { id: 'opt-a', text: 'Các loại cây trong bảng phương pháp thủy canh của Gericke' },
                { id: 'opt-b', text: 'Việc áp dụng thủy canh của Gericke' },
                { id: 'opt-c', text: 'Những cây cà chua của Gericke' },
                { id: 'opt-d', text: 'Các bể chứa nước lớn' }
              ],
              correctOptionId: 'opt-c'
            },
            {
              id: 'q-read-17',
              moduleId: targetModule.id,
              number: 17,
              text: 'Kết luận chính của tác giả trong đoạn cuối (dòng 46-52) là gì?',
              passage: `(Dòng 46-52): Tóm lại, mặc dù phương pháp thủy canh thực sự là một đột phá khoa học quan trọng, bài học từ làn sóng cường điệu đầu thế kỷ 20 cho thấy tầm quan trọng của việc đánh giá trung thực giữa thành công phòng thí nghiệm và tính khả thi kinh tế thị trường.`,
              options: [
                { id: 'opt-a', text: 'Báo chí Mỹ đã thiếu chính xác khi viết về thủy canh.' },
                { id: 'opt-b', text: 'Các ưu điểm của phương pháp thủy canh đã được chứng minh.' },
                { id: 'opt-c', text: 'Cây cà chua được trồng bằng phương pháp thủy canh đáng được ca ngợi.' },
                { id: 'opt-d', text: 'Những kẻ vô đạo đức lợi dụng ưu điểm của thủy canh để trục lợi.' }
              ],
              correctOptionId: 'opt-a'
            },
            {
              id: 'q-read-18',
              moduleId: targetModule.id,
              number: 18,
              text: 'Ý nào sau đây KHÔNG được nhắc đến trong đoạn 6 (dòng 38-45)?',
              passage: `(Dòng 38-45): Phương pháp này có thể được áp dụng trong môi trường vô trùng, giảm thiểu đáng kể sâu bệnh và lượng nước tiêu thụ so với canh tác truyền thống.`,
              options: [
                { id: 'opt-a', text: 'Có thể sử dụng phương pháp thủy canh trong môi trường trơ.' },
                { id: 'opt-b', text: 'Thủy canh tiết kiệm nước hơn so với đất.' },
                { id: 'opt-c', text: 'Sâu bệnh được loại bỏ hoàn toàn mà không cần hóa chất.' },
                { id: 'opt-d', text: 'Năng suất nông sản tăng gấp 10 lần.' }
              ],
              correctOptionId: 'opt-d'
            },
            // Generate full set of 20 test room grid items
            ...Array.from({ length: 17 }).map((_, i) => ({
              id: `q-gen-${i + 19}`,
              moduleId: targetModule.id,
              number: i + 19,
              text: `[Câu hỏi tư duy TSA ${i + 19}] Cho đồ thị biến thiên năng lượng của phản ứng hóa học. Phát biểu nào sau đây đúng khi thay đổi chất xúc tác?`,
              options: [
                { id: `opt-${i}-a`, text: 'Năng lượng hoạt hóa giảm làm tăng tốc độ phản ứng' },
                { id: `opt-${i}-b`, text: 'Biến thiên enthalpy ΔH của phản ứng giảm' },
                { id: `opt-${i}-c`, text: 'Hằng số cân bằng K_c thay đổi theo nhiệt độ' },
                { id: `opt-${i}-d`, text: 'Nồng độ chất tham gia tăng gấp đôi' }
              ],
              correctOptionId: `opt-${i}-a`
            }))
          ];

          setQuestions(mockQList);
        }
        setLoading(false);
      });
  }, [examId, moduleIdParam, router]);

  if (loading || !selectedModule) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson"></div>
        <p className="text-sm font-semibold tracking-wider">ĐANG KHỞI TẠO PHÒNG THI MÁY CHỦ CACULUS...</p>
      </div>
    );
  }

  return (
    <SplitTestRoom
      examId={examId}
      module={selectedModule}
      questions={questions}
      studentName={user?.name || 'Nguyễn Cường'}
      studentId={user?.studentId || 'CACULUS_496692'}
    />
  );
}
