import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ids, hide, performedBy } = body;

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'type and ids array are required' },
        { status: 400 }
      );
    }

    if (!['direct_chats', 'projects'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be "direct_chats" or "projects"' },
        { status: 400 }
      );
    }

    const actor = performedBy || 'admin';

    if (type === 'direct_chats') {
      // Bulk hide/unhide conversations (direct or business chats)
      const conversations = await db.conversation.findMany({
        where: { id: { in: ids } },
      });

      for (const conv of conversations) {
        await db.conversation.update({
          where: { id: conv.id },
          data: { isHidden: hide },
        });

        const targetType = conv.mode === 'business' ? 'business_chat' : 'direct_chat';
        await db.auditLog.create({
          data: {
            action: hide ? 'hide' : 'unhide',
            targetType,
            targetId: conv.id,
            targetName: conv.title,
            oldValue: String(!hide),
            newValue: String(hide),
            performedBy: actor,
          },
        });
      }
    } else if (type === 'projects') {
      // Bulk lock/unlock projects (using isLocked to hide from employees)
      const projects = await db.project.findMany({
        where: { id: { in: ids } },
      });

      for (const project of projects) {
        await db.project.update({
          where: { id: project.id },
          data: { isLocked: hide },
        });

        await db.auditLog.create({
          data: {
            action: hide ? 'hide' : 'unhide',
            targetType: 'project',
            targetId: project.id,
            targetName: project.name,
            oldValue: String(!hide),
            newValue: String(hide),
            performedBy: actor,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: ids.length,
      action: hide ? 'hidden' : 'unhidden',
    });
  } catch (error) {
    console.error('Failed to bulk hide/unhide:', error);
    return NextResponse.json({ error: 'Failed to bulk hide/unhide' }, { status: 500 });
  }
}
