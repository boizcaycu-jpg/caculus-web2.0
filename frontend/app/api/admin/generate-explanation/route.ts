import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyToken } from '@/lib/auth';

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
  if (!apiKey) {
    console.error('Gemini API Error: GEMINI_API_KEY is not defined in process.env');
    return NextResponse.json({
      error: 'Chưa cấu hình GEMINI_API_KEY trong frontend/.env. Vui lòng kiểm tra biến môi trường!',
    }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { questionText, options, passage, category, correctOptionId } = body;

    if (!questionText) {
      return NextResponse.json({ error: 'Nội dung câu hỏi không được để trống' }, { status: 400 });
    }

    const optionsStr = (options || []).map((o: any, idx: number) => 
      `${String.fromCharCode(65 + idx)}. ${o.text}${o.id === correctOptionId ? ' (Đáp án đúng)' : ''}`
    ).join('\n');

    const prompt = `You are an expert tutor for the Vietnamese TSA (Thinking Skills Assessment - Đánh giá Tư duy Bách Khoa) examination.
Generate a detailed, step-by-step mathematical or logical solution for the following question.

REQUIREMENTS:
1. Format all formulas, equations, and mathematical variables using LaTeX wrapped in single dollar signs ($E=mc^2$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\lim_{x \\to 2}$, $\\Delta H$).
2. Provide a clear, logical, step-by-step explanation leading directly to the correct answer.
3. Write the explanation in professional Vietnamese.

${passage ? `BỐI CẢNH/ĐOẠN VĂN ĐỌC HIỂU:\n${passage}\n\n` : ''}
CÂU HỎI:
${questionText}

PHƯƠNG ÁN:
${optionsStr}`;

    // Initialize @google/genai SDK
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const explanation = response.text || '';

    return NextResponse.json({
      success: true,
      explanation,
    });
  } catch (error: any) {
    console.error('Gemini API Exception in generate-explanation:', error);
    return NextResponse.json({ 
      error: `Lỗi gọi API Gemini 2.5 Flash: ${error?.message || String(error)}` 
    }, { status: 500 });
  }
}
