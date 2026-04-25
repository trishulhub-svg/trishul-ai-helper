import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeConversations = searchParams.get('includeConversations') === 'true';

    const projectLocks = await db.projectLock.findMany({
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

    const projectResult = projectLocks.map((lock) => ({
      type: 'project' as const,
      projectId: lock.projectId,
      projectName: lock.project.name,
      lockedBy: lock.lockedBy,
      lockedAt: lock.lockedAt.toISOString(),
    }));

    let conversationResult: Array<{
      type: 'conversation';
      conversationId: string;
      conversationTitle: string;
      conversationMode: string;
      lockedBy: string;
      lockedAt: string;
    }> = [];

    if (includeConversations) {
      const convLocks = await db.conversationLock.findMany({
        include: {
          conversation: {
            select: {
              title: true,
              mode: true,
            },
          },
        },
        orderBy: {
          lockedAt: 'desc',
        },
      });

      conversationResult = convLocks.map((lock) => ({
        type: 'conversation' as const,
        conversationId: lock.conversationId,
        conversationTitle: lock.conversation.title,
        conversationMode: lock.conversation.mode,
        lockedBy: lock.lockedBy,
        lockedAt: lock.lockedAt.toISOString(),
      }));
    }

    return NextResponse.json([...projectResult, ...conversationResult]);
  } catch (error) {
    console.error('Failed to fetch active locks:', error);
    return NextResponse.json({ error: 'Failed to fetch active locks' }, { status: 500 });
  }
}
