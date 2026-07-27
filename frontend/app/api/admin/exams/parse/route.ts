import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { Question, QuestionGroup } from '@/types';

function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('caculus_token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Không có quyền truy cập Admin' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const moduleId = (formData.get('moduleId') as string) || 'mod-default';
    const category = (formData.get('category') as string) || 'math';

    let rawText = '';

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        rawText = buffer.toString('utf-8');
      } else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
        // Fallback text extraction for PDF / DOCX content
        rawText = buffer.toString('utf-8');
        // If binary PDF/DOCX tags are present, extract plain readable string chunks
        rawText = rawText.replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, ' ');
      } else {
        rawText = buffer.toString('utf-8');
      }
    } else {
      rawText = (formData.get('text') as string) || '';
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Không có nội dung tập tin để phân tích' }, { status: 400 });
    }

    const questionGroups: QuestionGroup[] = [];
    const questions: Question[] = [];

    // Parse answer key map at bottom if present
    const answerKeyMap: Record<number, string> = {};
    const keyMatch = rawText.match(/(?:ĐÁP ÁN|BẢNG ĐÁP ÁN|ANSWER KEY)[:\s]+([\s\S]+)/i);
    if (keyMatch) {
      const pairRegex = /(\d+)[\.\s:\-\=]+([A-D0-9\.,\/]+)/gi;
      let m;
      while ((m = pairRegex.exec(keyMatch[1])) !== null) {
        answerKeyMap[parseInt(m[1])] = m[2].trim().toUpperCase();
      }
    }

    // Split text by "Đoạn văn" / "Nội dung bối cảnh" / "Passage" to form Question Groups
    const groupBlocks = rawText.split(/(?=\[(?:Đoạn văn|Ngữ cảnh|Context|Passage)\s*\d*\]|=== Passage ===)/gi);
    let globalNum = 1;

    for (let gIdx = 0; gIdx < groupBlocks.length; gIdx++) {
      const block = groupBlocks[gIdx];
      if (!block.trim() || block.includes('BẢNG ĐÁP ÁN')) continue;

      let groupPassage: string | undefined = undefined;
      let groupImgUrl: string | undefined = undefined;
      let groupTitle: string | undefined = undefined;
      let currentGroupId: string | undefined = undefined;

      // Extract group passage if tag exists
      const passageHeaderMatch = block.match(/\[(?:Đoạn văn|Ngữ cảnh|Context|Passage)\s*(\d*)\]([\s\S]+?)(?=\n(?:Câu|Question|\b)\s*\d+[\.:\s]|$)/i);
      if (passageHeaderMatch) {
        groupTitle = `Đoạn văn ngữ cảnh ${passageHeaderMatch[1] || gIdx + 1}`;
        groupPassage = passageHeaderMatch[2].trim();
        
        // Extract embedded base64 or markdown image
        const imgMatch = groupPassage.match(/!\[.*?\]\((data:image\/[a-zA-Z]+;base64,[^\)]+|https?:\/\/[^\)]+|\/uploads\/[^\)]+)\)/);
        if (imgMatch) {
          groupImgUrl = imgMatch[1];
        }

        currentGroupId = `group-${gIdx + 1}-${Date.now()}`;
      }

      // Split questions within block
      const qBlocks = block.split(/(?=(?:Câu|Question|\b)\s*\d+[\.:\s])/gi);
      const childQIds: string[] = [];

      for (const qBlock of qBlocks) {
        if (!qBlock.trim() || qBlock.includes('[Đoạn văn') || qBlock.includes('BẢNG ĐÁP ÁN')) continue;

        const qMatch = qBlock.match(/(?:Câu|Question|\b)\s*(\d+)[\.:\s]+([\s\S]+?)(?=\n[A-D][\.:\s]|$)/i);
        if (!qMatch) continue;

        const numParsed = parseInt(qMatch[1]) || globalNum;
        const qCleanText = qMatch[2].trim();

        // Check image markdown inside question
        let imgUrl: string | undefined = undefined;
        const qImgMatch = qBlock.match(/!\[.*?\]\((data:image\/[a-zA-Z]+;base64,[^\)]+|https?:\/\/[^\)]+|\/uploads\/[^\)]+)\)/);
        if (qImgMatch) {
          imgUrl = qImgMatch[1];
        }

        const optA = qBlock.match(/A[\.:\s]+([^\n]+)/i)?.[1]?.trim() || 'Phương án A';
        const optB = qBlock.match(/B[\.:\s]+([^\n]+)/i)?.[1]?.trim() || 'Phương án B';
        const optC = qBlock.match(/C[\.:\s]+([^\n]+)/i)?.[1]?.trim() || 'Phương án C';
        const optD = qBlock.match(/D[\.:\s]+([^\n]+)/i)?.[1]?.trim() || 'Phương án D';

        const rawAnsKey = answerKeyMap[numParsed] || '';
        let qType: 'single_choice' | 'multiple_choice' | 'fill_blank' = 'single_choice';
        let correctOptId = 'opt-a';
        let correctOptIds: string[] = ['opt-a'];
        let fillAnswers: string[] = [];

        if (rawAnsKey.includes(',') || rawAnsKey.includes(';')) {
          qType = 'multiple_choice';
          correctOptIds = rawAnsKey.split(/[,;]/).map(k => `opt-${k.trim().toLowerCase()}`);
        } else if (rawAnsKey && !['A', 'B', 'C', 'D'].includes(rawAnsKey)) {
          qType = 'fill_blank';
          fillAnswers = [rawAnsKey];
        } else if (['A', 'B', 'C', 'D'].includes(rawAnsKey)) {
          correctOptId = `opt-${rawAnsKey.toLowerCase()}`;
        }

        const qId = `q-parsed-${numParsed}-${globalNum}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        childQIds.push(qId);

        questions.push({
          id: qId,
          moduleId,
          groupId: currentGroupId,
          number: numParsed,
          type: qType,
          text: qCleanText,
          imageUrl: imgUrl,
          imageSize: 'medium',
          options: [
            { id: 'opt-a', text: optA },
            { id: 'opt-b', text: optB },
            { id: 'opt-c', text: optC },
            { id: 'opt-d', text: optD },
          ],
          correctOptionId: correctOptId,
          correctOptionIds: correctOptIds,
          fillBlankAnswers: fillAnswers,
          explanation: 'Lời giải chi tiết được tạo tự động.',
        });

        globalNum++;
      }

      if (currentGroupId && childQIds.length > 0) {
        questionGroups.push({
          id: currentGroupId,
          moduleId,
          title: groupTitle,
          passage: groupPassage,
          imageUrl: groupImgUrl,
          imageSize: 'medium',
          questionIds: childQIds,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã phân tích thành công ${questions.length} câu hỏi và ${questionGroups.length} nhóm bối cảnh!`,
      questionGroups,
      questions,
    });
  } catch (error) {
    console.error('Parser error:', error);
    return NextResponse.json({ error: 'Lỗi bóc tách tập tin' }, { status: 500 });
  }
}
