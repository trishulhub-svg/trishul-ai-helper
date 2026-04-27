import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { lockedBy } = body;

    if (!lockedBy) {
      return NextResponse.json({ error: 'lockedBy is required' }, { status: 400 });
    }

    // Check if conversation exists
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { lock: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if locked
    if (!conversation.lock) {
      return NextResponse.json({ error: 'Conversation is not locked' }, { status: 400 });
    }

    // Check if the user is the locker
    if (conversation.lock.lockedBy !== lockedBy) {
      return NextResponse.json(
        { error: 'Only the user who locked the conversation can unlock it' },
        { status: 403 }
      );
    }

    // Delete the lock
    await db.conversationLock.delete({
      where: { conversationId: id },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'unlock',
        targetType: conversation.mode === 'business' ? 'business_chat' : conversation.mode === 'direct' ? 'direct_chat' : 'conversation',
        targetId: id,
        targetName: conversation.title,
        oldValue: lockedBy,
        performedBy: lockedBy,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unlock conversation:', error);
    return NextResponse.json({ error: 'Failed to unlock conversation' }, { status: 500 });
  }
}
