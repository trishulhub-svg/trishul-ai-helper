import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
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
          },
        },
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
          },
        },
      },
    });

    // Parse answers JSON for each assignment
    const parsedAssignments = assignments.map((assignment) => {
      let parsedAnswers: unknown = {};
      try {
        parsedAnswers = JSON.parse(assignment.answers);
      } catch {
        parsedAnswers = {};
      }

      return {
        ...assignment,
        answersParsed: parsedAnswers,
      };
    });

    return NextResponse.json(parsedAssignments);
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
