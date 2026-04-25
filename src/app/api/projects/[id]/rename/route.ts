import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, performedBy } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const oldName = project.name;

    // Update the project name
    const updated = await db.project.update({
      where: { id },
      data: { name: name.trim() },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'rename',
        targetType: 'project',
        targetId: id,
        targetName: name.trim(),
        oldValue: oldName,
        newValue: name.trim(),
        performedBy: performedBy || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      project: updated,
    });
  } catch (error) {
    console.error('Failed to rename project:', error);
    return NextResponse.json({ error: 'Failed to rename project' }, { status: 500 });
  }
}
