import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get('mode');

    let whereClause: any = {};
    if (mode) {
      whereClause.mode = mode;
    } else {
      // Default: return both direct and business chats (non-project)
      whereClause.mode = { in: ['direct', 'business'] };
    }

    const conversations = await db.conversation.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to fetch direct chats:', error);
    return NextResponse.json({ error: 'Failed to fetch direct chats' }, { status: 500 });
  }
}
