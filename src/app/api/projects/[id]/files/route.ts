import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const files = await db.codeFile.findMany({
      where: { projectId: id },
      orderBy: { filePath: 'asc' },
    });
    return NextResponse.json(files);
  } catch (error) {
    console.error('Failed to fetch files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { fileName, filePath, language, content } = body;

    if (!fileName || !filePath || content === undefined) {
      return NextResponse.json({ error: 'fileName, filePath, and content are required' }, { status: 400 });
    }

    // Check if file with same path already exists
    const existing = await db.codeFile.findUnique({
      where: { projectId_filePath: { projectId: id, filePath } },
    });

    if (existing) {
      // Update existing file
      const updated = await db.codeFile.update({
        where: { id: existing.id },
        data: {
          fileName,
          language: language || existing.language,
          content,
          version: { increment: 1 },
        },
      });
      return NextResponse.json(updated);
    }

    const file = await db.codeFile.create({
      data: {
        projectId: id,
        fileName: fileName.trim(),
        filePath: filePath.trim(),
        language: language?.trim() || 'typescript',
        content,
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error('Failed to create file:', error);
    return NextResponse.json({ error: 'Failed to create file' }, { status: 500 });
  }
}
