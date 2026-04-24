import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  try {
    const { fileId } = await params;
    const file = await db.codeFile.findUnique({ where: { id: fileId } });
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json(file);
  } catch (error) {
    console.error('Failed to fetch file:', error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  try {
    const { fileId } = await params;
    const body = await req.json();
    const { fileName, filePath, language, content } = body;

    const file = await db.codeFile.update({
      where: { id: fileId },
      data: {
        ...(fileName !== undefined && { fileName: fileName.trim() }),
        ...(filePath !== undefined && { filePath: filePath.trim() }),
        ...(language !== undefined && { language: language.trim() }),
        ...(content !== undefined && { content, version: { increment: 1 } }),
      },
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error('Failed to update file:', error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  try {
    const { fileId } = await params;
    await db.codeFile.delete({ where: { id: fileId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
