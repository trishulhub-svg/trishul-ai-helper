import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'upload');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.name) || '.bin';
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${baseName}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Determine file type
    const isImage = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(ext);
    const type = isImage ? 'image' : 'document';
    const mimeType = file.type || 'application/octet-stream';

    // Return the file URL (served via /api/files/...)
    const url = `/api/files/${uniqueName}`;

    return NextResponse.json({
      type,
      url,
      name: file.name,
      mimeType,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
