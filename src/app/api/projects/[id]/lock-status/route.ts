import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if project exists
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const lock = await db.projectLock.findUnique({ where: { projectId: id } });

    if (!lock) {
      return NextResponse.json({
        locked: false,
        lockedBy: null,
        lockedAt: null,
      });
    }

    return NextResponse.json({
      locked: true,
      lockedBy: lock.lockedBy,
      lockedAt: lock.lockedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to check lock status:', error);
    return NextResponse.json({ error: 'Failed to check lock status' }, { status: 500 });
  }
}
