import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
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

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const moduleId = (formData.get('moduleId') as string) || 'mod-default';
    const category = (formData.get('category') as string) || 'math';

    let rawText = '';

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();
      rawText = buffer.toString('utf-8');
      if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
        rawText = rawText.replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, ' ');
      }
    } else {
      rawText = (formData.get('text') as string) || '';
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Không có nội dung tập tin để phân tích' }, { status: 400 });
    }

    if (apiKey) {
      try {
        const prompt = `You are an expert AI exam parser for the Vietnamese TSA (Thinking Skills Assessment) examination.
Analyze the following exam document text for section "${category}". Extract all questions and passages/contexts into valid JSON format.

CRITICAL INSTRUCTIONS:
1. For all mathematical formulas, chemical equations, and symbols, use LaTeX notation wrapped in single dollar signs ($E=mc^2$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\Delta H$, $N_2 + 3H_2 \\rightleftharpoons 2NH_3$).
2. Group reading passages or scientific experiment descriptions into "questionGroups".
3. Return ONLY a valid JSON object with NO markdown codeblock wrapper, using this exact schema:
{
  "questionGroups": [
    { "id": "group-1", "title": "Bối cảnh 1", "passage": "Nội dung đoạn văn...", "questionIds": ["q-1", "q-2"] }
  ],
  "questions": [
    {
      "id": "q-1",
      "groupId": "group-1",
      "number": 1,
      "type": "single_choice",
      "text": "Nội dung câu hỏi...",
      "options": [
        { "id": "opt-a", "text": "Phương án A" },
        { "id": "opt-b", "text": "Phương án B" },
        { "id": "opt-c", "text": "Phương án C" },
        { "id": "opt-d", "text": "Phương án D" }
      ],
      "correctOptionId": "opt-a",
      "explanation": "Lời giải chi tiết bằng KaTeX LaTeX..."
    }
  ]
}

DOCUMENT TEXT TO PARSE:
${rawText.slice(0, 12000)}`;

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let jsonText = response.text || '';
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

        const parsedObj = JSON.parse(jsonText);
        if (parsedObj.questions && Array.isArray(parsedObj.questions)) {
          const formattedQuestions = parsedObj.questions.map((q: any, idx: number) => ({
            ...q,
            id: q.id || `q-ai-${idx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            moduleId,
            number: q.number || idx + 1,
            imageSize: 'medium',
          }));

          const formattedGroups = (parsedObj.questionGroups || []).map((g: any, gIdx: number) => ({
            ...g,
            id: g.id || `group-ai-${gIdx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            moduleId,
            imageSize: 'medium',
          }));

          return NextResponse.json({
            success: true,
            aiPowered: true,
            message: `✨ Gemini 1.5 Flash đã bóc tách thành công ${formattedQuestions.length} câu hỏi và ${formattedGroups.length} nhóm bối cảnh!`,
            questionGroups: formattedGroups,
            questions: formattedQuestions,
          });
        }
      } catch (geminiError: any) {
        console.error('Gemini API Exception in parse-pdf:', geminiError);
      }
    } else {
      console.error('Gemini API Error in parse-pdf: GEMINI_API_KEY is not defined in process.env');
    }

    // FALLBACK STRUCTURAL PARSER
    const fallbackQuestions: Question[] = [];
    const qBlocks = rawText.split(/(?=(?:Câu|Question|\b)\s*\d+[\.:\s])/gi);
    let qNum = 1;

    for (const block of qBlocks) {
      if (!block.trim() || block.includes('BẢNG ĐÁP ÁN')) continue;
      const qTextMatch = block.match(/(?:Câu|Question|\b)\s*(\d+)[\.:\s]+([\s\S]+?)(?=\n[A-D][\.:\s]|$)/i);
      if (!qTextMatch) continue;

      const numParsed = parseInt(qTextMatch[1]) || qNum;
      const optA = block.match(/A[\.:\s]+([^\n]+)/i)?.[1]?.trim() || 'Phương án A';
      const optB = block.match(/B[\.:\s]+([^\n]+)/i)?.[1]?.trim() || 'Phương án B';
      const optC = block.match(/C[\.:\s]+([^\n]+)/i)?.[1]?.trim() || 'Phương án C';
      const optD = block.match(/D[\.:\s]+([^\n]+)/i)?.[1]?.trim() || 'Phương án D';

      fallbackQuestions.push({
        id: `q-fallback-${numParsed}-${qNum}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        moduleId,
        number: numParsed,
        type: 'single_choice',
        text: qTextMatch[2].trim(),
        options: [
          { id: 'opt-a', text: optA },
          { id: 'opt-b', text: optB },
          { id: 'opt-c', text: optC },
          { id: 'opt-d', text: optD },
        ],
        correctOptionId: 'opt-a',
        explanation: 'Lời giải bóc tách cơ bản.',
        imageSize: 'medium',
      });
      qNum++;
    }

    return NextResponse.json({
      success: true,
      aiPowered: false,
      message: `Đã bóc tách thành công ${fallbackQuestions.length} câu hỏi theo bộ lọc cấu trúc!`,
      questionGroups: [],
      questions: fallbackQuestions,
    });
  } catch (error: any) {
    console.error('PDF Parse API Exception:', error);
    return NextResponse.json({ error: 'Lỗi bóc tách tập tin đề thi' }, { status: 500 });
  }
}
