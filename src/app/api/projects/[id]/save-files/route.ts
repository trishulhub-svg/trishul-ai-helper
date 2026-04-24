import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { files } = body;

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'files array is required' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const { fileName, filePath, language, content } = file;

      if (!fileName || !filePath || content === undefined) continue;

      const existing = await db.codeFile.findUnique({
        where: { projectId_filePath: { projectId: id, filePath } },
      });

      if (existing) {
        const updated = await db.codeFile.update({
          where: { id: existing.id },
          data: {
            content,
            language: language || existing.language,
            version: { increment: 1 },
          },
        });
        results.push(updated);
      } else {
        const created = await db.codeFile.create({
          data: {
            projectId: id,
            fileName,
            filePath,
            language: language || 'typescript',
            content,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({ saved: results.length, files: results });
  } catch (error) {
    console.error('Failed to save files:', error);
    return NextResponse.json({ error: 'Failed to save files' }, { status: 500 });
  }
}
