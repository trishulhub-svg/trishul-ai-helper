import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { performedBy } = body;

    // Check if conversation exists
    const conversation = await db.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Toggle isHidden
    const newHiddenValue = !conversation.isHidden;
    const updated = await db.conversation.update({
      where: { id },
      data: { isHidden: newHiddenValue },
    });

    // Create audit log
    const action = newHiddenValue ? 'hide' : 'unhide';
    const targetType = conversation.mode === 'business' ? 'business_chat' : conversation.mode === 'direct' ? 'direct_chat' : 'conversation';

    await db.auditLog.create({
      data: {
        action,
        targetType,
        targetId: id,
        targetName: conversation.title,
        oldValue: String(!newHiddenValue),
        newValue: String(newHiddenValue),
        performedBy: performedBy || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      isHidden: updated.isHidden,
    });
  } catch (error) {
    console.error('Failed to toggle conversation visibility:', error);
    return NextResponse.json({ error: 'Failed to toggle conversation visibility' }, { status: 500 });
  }
}
