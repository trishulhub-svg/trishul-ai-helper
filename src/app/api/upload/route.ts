import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 20MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename to prevent conflicts
    const ext = path.extname(file.name) || '';
    const uniqueName = `${randomUUID()}${ext}`;

    // Save to upload/chat directory
    const uploadDir = path.join(process.cwd(), 'upload', 'chat');
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    // Determine attachment type
    const mimeType = file.type || 'application/octet-stream';
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');
    const isDocument = mimeType.startsWith('application/pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text');

    const attachmentType = isImage ? 'image' : isVideo ? 'video' : isDocument ? 'file' : 'file';

    return NextResponse.json({
      url: `/api/files/chat/${uniqueName}`,
      name: file.name,
      mimeType,
      type: attachmentType,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
