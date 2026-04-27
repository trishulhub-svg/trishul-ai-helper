import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { lockedBy } = body;

    if (!lockedBy || typeof lockedBy !== 'string' || !lockedBy.trim()) {
      return NextResponse.json({ error: 'lockedBy is required' }, { status: 400 });
    }

    // Check if project exists
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project is already locked
    const existingLock = await db.projectLock.findUnique({ where: { projectId: id } });

    if (existingLock) {
      if (existingLock.lockedBy === lockedBy.trim()) {
        // Already locked by the same person - return success
        return NextResponse.json({
          locked: true,
          lockedBy: existingLock.lockedBy,
          lockedAt: existingLock.lockedAt.toISOString(),
        });
      }
      // Locked by someone else
      return NextResponse.json(
        { error: `Project is currently being used by ${existingLock.lockedBy}` },
        { status: 409 }
      );
    }

    // Not locked - create a lock
    const lock = await db.projectLock.create({
      data: {
        projectId: id,
        lockedBy: lockedBy.trim(),
      },
    });

    return NextResponse.json({
      locked: true,
      lockedBy: lock.lockedBy,
      lockedAt: lock.lockedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to lock project:', error);
    return NextResponse.json({ error: 'Failed to lock project' }, { status: 500 });
  }
}
