import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params;

    // Build the file path from the route segments
    const filePath = path.join(process.cwd(), 'upload', ...pathParts);

    // Security: ensure the resolved path is within the upload directory
    const uploadDir = path.join(process.cwd(), 'upload');
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(uploadDir))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if file exists
    const fileStat = await stat(resolved).catch(() => null);
    if (!fileStat || !fileStat.isFile()) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read the file
    const buffer = await readFile(resolved);

    // Determine content type
    const ext = path.extname(resolved).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Set caching headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Content-Length', buffer.length.toString());

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
