import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      where: { mode: 'business' },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to fetch business chats:', error);
    return NextResponse.json({ error: 'Failed to fetch business chats' }, { status: 500 });
  }
}
