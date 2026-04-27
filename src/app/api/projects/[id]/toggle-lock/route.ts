import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Find the project first
    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Toggle the isLocked field
    const updatedProject = await db.project.update({
      where: { id },
      data: { isLocked: !project.isLocked },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Failed to toggle project lock:', error);
    return NextResponse.json({ error: 'Failed to toggle project lock' }, { status: 500 });
  }
}
