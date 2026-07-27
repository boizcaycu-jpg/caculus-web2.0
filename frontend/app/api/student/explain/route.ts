import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getQuestionsByModule } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');
    const moduleId = searchParams.get('moduleId') || 'mod-math-1';

    const questions = getQuestionsByModule(moduleId);
    const foundQ = questions.find(q => q.id === questionId);

    if (foundQ && foundQ.explanation) {
      return NextResponse.json({
        success: true,
        explanation: foundQ.explanation,
        text: foundQ.text,
        correctOptionId: foundQ.correctOptionId,
      });
    }

    // Dynamic AI explanation generation with Gemini 2.5 Flash if missing
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && foundQ) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const optionsStr = (foundQ.options || []).map((o: any, idx: number) => 
          `${String.fromCharCode(65 + idx)}. ${o.text}`
        ).join('\n');

        const prompt = `You are a tutor for the Vietnamese TSA exam. Provide a concise step-by-step solution using KaTeX LaTeX ($...$) for this question:\n${foundQ.text}\nOptions:\n${optionsStr}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        if (response.text) {
          return NextResponse.json({
            success: true,
            explanation: response.text,
            text: foundQ.text,
            correctOptionId: foundQ.correctOptionId,
          });
        }
      } catch (aiErr) {
        console.error('Student explanation Gemini 2.5 Flash error:', aiErr);
      }
    }

    return NextResponse.json({
      success: true,
      explanation: foundQ?.explanation || 'Lời giải chi tiết: Biến đổi biểu thức và sử dụng các quy tắc suy luận chuẩn hóa để chọn đáp án chính xác.',
      text: foundQ?.text,
      correctOptionId: foundQ?.correctOptionId,
    });
  } catch (error: any) {
    console.error('Student explain API Exception:', error);
    return NextResponse.json({ 
      error: `Lỗi gọi API Gemini 2.5 Flash: ${error?.message || String(error)}` 
    }, { status: 500 });
  }
}
