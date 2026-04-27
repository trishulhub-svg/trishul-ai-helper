import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const deleteRequests = await db.deleteRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(deleteRequests);
  } catch (error) {
    console.error('Failed to fetch delete requests:', error);
    return NextResponse.json({ error: 'Failed to fetch delete requests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, targetId, targetName, requestedBy, reason } = body;

    if (!type || !targetId || !targetName || !requestedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: type, targetId, targetName, requestedBy' },
        { status: 400 }
      );
    }

    const validTypes = ['project', 'conversation', 'directChat', 'businessChat', 'file'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const deleteRequest = await db.deleteRequest.create({
      data: {
        type,
        targetId,
        targetName,
        requestedBy,
        reason: reason || '',
      },
    });

    return NextResponse.json(deleteRequest, { status: 201 });
  } catch (error) {
    console.error('Failed to create delete request:', error);
    return NextResponse.json({ error: 'Failed to create delete request' }, { status: 500 });
  }
}
