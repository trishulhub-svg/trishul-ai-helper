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

    // Check if project is locked
    const existingLock = await db.projectLock.findUnique({ where: { projectId: id } });

    if (!existingLock) {
      return NextResponse.json({ error: 'Project is not locked' }, { status: 404 });
    }

    // Verify the person unlocking is the same person who locked it
    if (existingLock.lockedBy !== lockedBy.trim()) {
      return NextResponse.json(
        { error: `Project is locked by ${existingLock.lockedBy}. Only they can unlock it.` },
        { status: 403 }
      );
    }

    // Delete the lock
    await db.projectLock.delete({ where: { projectId: id } });

    return NextResponse.json({ unlocked: true });
  } catch (error) {
    console.error('Failed to unlock project:', error);
    return NextResponse.json({ error: 'Failed to unlock project' }, { status: 500 });
  }
}
