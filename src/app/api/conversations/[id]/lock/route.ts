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

    // Admin can override any existing lock
    const isAdmin = lockedBy === 'admin';

    // Check if already locked by someone else
    if (conversation.lock && conversation.lock.lockedBy !== lockedBy) {
      // If admin, override the existing lock
      if (isAdmin) {
        // Delete existing lock and create new one for admin
        await db.conversationLock.deleteMany({ where: { conversationId: id } });
        const lock = await db.conversationLock.create({
          data: { conversationId: id, lockedBy },
        });
        await db.auditLog.create({
          data: {
            action: 'lock',
            targetType: conversation.mode === 'business' ? 'business_chat' : conversation.mode === 'direct' ? 'direct_chat' : 'conversation',
            targetId: id,
            targetName: conversation.title,
            oldValue: conversation.lock.lockedBy,
            newValue: lockedBy,
            performedBy: lockedBy,
          },
        });
        return NextResponse.json({ lock }, { status: 201 });
      }
      return NextResponse.json(
        { error: 'Conversation is already locked by another user', lockedBy: conversation.lock.lockedBy },
        { status: 409 }
      );
    }

    // If already locked by the same user, just return existing lock
    if (conversation.lock) {
      return NextResponse.json({ lock: conversation.lock });
    }

    // Create lock
    const lock = await db.conversationLock.create({
      data: {
        conversationId: id,
        lockedBy,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'lock',
        targetType: conversation.mode === 'business' ? 'business_chat' : conversation.mode === 'direct' ? 'direct_chat' : 'conversation',
        targetId: id,
        targetName: conversation.title,
        newValue: lockedBy,
        performedBy: lockedBy,
      },
    });

    return NextResponse.json({ lock }, { status: 201 });
  } catch (error) {
    console.error('Failed to lock conversation:', error);
    return NextResponse.json({ error: 'Failed to lock conversation' }, { status: 500 });
  }
}
