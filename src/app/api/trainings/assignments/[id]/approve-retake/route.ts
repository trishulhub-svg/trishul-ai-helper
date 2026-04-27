import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { performedBy } = body;

    // Verify the assignment exists
    const assignment = await db.trainingAssignment.findUnique({
      where: { id },
      include: { training: true, employee: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if retake was requested
    if (!assignment.retakeRequested) {
      return NextResponse.json(
        { error: 'No retake request found for this assignment' },
        { status: 400 }
      );
    }

    // Check if already approved
    if (assignment.retakeApproved) {
      return NextResponse.json(
        { error: 'Retake has already been approved for this assignment' },
        { status: 400 }
      );
    }

    // Approve retake: set retakeApproved=true, increment maxAttempts, reset status to "due"
    const updated = await db.trainingAssignment.update({
      where: { id },
      data: {
        retakeApproved: true,
        maxAttempts: assignment.maxAttempts + 1,
        status: 'due',
        startedAt: null,
        completedAt: null,
      },
      include: {
        training: { select: { id: true, title: true, category: true } },
        employee: { select: { id: true, employeeId: true, name: true } },
      },
    });

    // Create audit log
    const actor = performedBy || 'admin';
    await db.auditLog.create({
      data: {
        action: 'assign_training',
        targetType: 'training',
        targetId: assignment.trainingId,
        targetName: assignment.training.title,
        oldValue: `Retake requested by ${assignment.employee.name}`,
        newValue: `Retake approved by ${actor}, maxAttempts: ${assignment.maxAttempts + 1}`,
        performedBy: actor,
      },
    });

    return NextResponse.json({
      success: true,
      assignment: updated,
    });
  } catch (error) {
    console.error('Failed to approve retake:', error);
    return NextResponse.json({ error: 'Failed to approve retake' }, { status: 500 });
  }
}
