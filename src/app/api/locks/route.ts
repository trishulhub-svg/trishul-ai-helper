import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const locks = await db.projectLock.findMany({
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        lockedAt: 'desc',
      },
    });

    const result = locks.map((lock) => ({
      projectId: lock.projectId,
      projectName: lock.project.name,
      lockedBy: lock.lockedBy,
      lockedAt: lock.lockedAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch active locks:', error);
    return NextResponse.json({ error: 'Failed to fetch active locks' }, { status: 500 });
  }
}
