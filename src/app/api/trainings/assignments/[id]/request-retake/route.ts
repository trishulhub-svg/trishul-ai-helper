import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify the assignment exists
    const assignment = await db.trainingAssignment.findUnique({
      where: { id },
      include: { training: true, employee: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if already requested
    if (assignment.retakeRequested) {
      return NextResponse.json(
        { error: 'Retake has already been requested for this assignment' },
        { status: 400 }
      );
    }

    // Set retakeRequested to true
    const updated = await db.trainingAssignment.update({
      where: { id },
      data: { retakeRequested: true },
      include: {
        training: { select: { id: true, title: true, category: true } },
        employee: { select: { id: true, employeeId: true, name: true } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'access',
        targetType: 'training',
        targetId: assignment.trainingId,
        targetName: assignment.training.title,
        newValue: `Retake requested by ${assignment.employee.name}`,
        performedBy: assignment.employee.name,
      },
    });

    return NextResponse.json({
      success: true,
      assignment: updated,
    });
  } catch (error) {
    console.error('Failed to request retake:', error);
    return NextResponse.json({ error: 'Failed to request retake' }, { status: 500 });
  }
}
