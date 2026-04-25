import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, performedBy } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if conversation exists
    const conversation = await db.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const oldTitle = conversation.title;

    // Update the conversation title
    const updated = await db.conversation.update({
      where: { id },
      data: { title: title.trim() },
    });

    // Create audit log
    const targetType = conversation.mode === 'business' ? 'business_chat' : conversation.mode === 'direct' ? 'direct_chat' : 'conversation';

    await db.auditLog.create({
      data: {
        action: 'rename',
        targetType,
        targetId: id,
        targetName: title.trim(),
        oldValue: oldTitle,
        newValue: title.trim(),
        performedBy: performedBy || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      conversation: updated,
    });
  } catch (error) {
    console.error('Failed to rename conversation:', error);
    return NextResponse.json({ error: 'Failed to rename conversation' }, { status: 500 });
  }
}
