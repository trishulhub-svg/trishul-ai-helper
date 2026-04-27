import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;

    // Verify the employee exists
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { employeeId };
    if (status) where.status = status;

    const assignments = await db.trainingAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        training: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
            description: true,
            videoUrl: true,
            questions: true,
            createdBy: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { assignments: true } },
          },
        },
      },
    });

    // Parse JSON fields for each assignment
    const parsedAssignments = assignments.map((assignment) => {
      let parsedAnswers: unknown = {};
      try {
        parsedAnswers = JSON.parse(assignment.answers);
      } catch {
        parsedAnswers = {};
      }

      let parsedQuestions: unknown[] = [];
      try {
        parsedQuestions = JSON.parse(assignment.training.questions);
      } catch {
        parsedQuestions = [];
      }

      return {
        ...assignment,
        answersParsed: parsedAnswers,
        training: {
          ...assignment.training,
          questionsParsed: parsedQuestions,
        },
      };
    });

    // Compute summary stats
    const total = parsedAssignments.length;
    const due = parsedAssignments.filter((a) => a.status === 'due').length;
    const inProgress = parsedAssignments.filter((a) => a.status === 'in_progress').length;
    const finished = parsedAssignments.filter((a) => a.status === 'finished').length;
    const avgScore =
      finished > 0
        ? Math.round(
            parsedAssignments
              .filter((a) => a.score !== null)
              .reduce((sum, a) => sum + (a.score || 0), 0) / finished
          )
        : null;

    return NextResponse.json({
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
      },
      summary: { total, due, inProgress, finished, avgScore },
      assignments: parsedAssignments,
    });
  } catch (error) {
    console.error('Failed to fetch employee trainings:', error);
    return NextResponse.json({ error: 'Failed to fetch employee trainings' }, { status: 500 });
  }
}
