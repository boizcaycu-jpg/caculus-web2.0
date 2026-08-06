import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rootDir = path.resolve(process.cwd(), '..');

    // Run git add, commit, and push in background
    const command = `cd /d "${rootDir}" && git add . && git commit -m "build: Update full TSA exam suite database" && git push origin main`;

    return new Promise<NextResponse>((resolve) => {
      exec(command, { cwd: rootDir }, (error, stdout, stderr) => {
        if (error) {
          console.warn('Git push warning:', stderr || error.message);
          // If no changes to commit, still treat as success
          if (stderr?.includes('nothing to commit') || stdout?.includes('nothing to commit')) {
            return resolve(NextResponse.json({ success: true, message: 'Dữ liệu đã ở trạng thái mới nhất trên GitHub!' }));
          }
        }
        resolve(NextResponse.json({ success: true, message: 'Đã đẩy bộ đề thi mới nhất lên Web Online (Vercel)!' }));
      });
    });
  } catch (error) {
    console.error('Error deploying exam suite:', error);
    return NextResponse.json({ error: 'Không thể tự động đẩy code' }, { status: 500 });
  }
}
