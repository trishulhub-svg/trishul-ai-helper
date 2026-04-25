import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const action = searchParams.get('action');

    const where: Record<string, string> = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (action) where.action = action;

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, targetType, targetId, targetName, oldValue, newValue, performedBy } = body;

    if (!action || !targetType || !targetId) {
      return NextResponse.json(
        { error: 'action, targetType, and targetId are required' },
        { status: 400 }
      );
    }

    const log = await db.auditLog.create({
      data: {
        action,
        targetType,
        targetId,
        targetName: targetName || '',
        oldValue: oldValue || '',
        newValue: newValue || '',
        performedBy: performedBy || 'admin',
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}
