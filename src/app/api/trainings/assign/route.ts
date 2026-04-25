import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trainingId, employeeIds } = body;

    if (!trainingId || !trainingId.trim()) {
      return NextResponse.json({ error: 'Training ID is required' }, { status: 400 });
    }

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: 'At least one employee ID is required' }, { status: 400 });
    }

    // Verify the training exists
    const training = await db.training.findUnique({ where: { id: trainingId } });
    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    // Get existing assignments for this training to avoid duplicates
    const existingAssignments = await db.trainingAssignment.findMany({
      where: {
        trainingId,
        employeeId: { in: employeeIds },
      },
      select: { employeeId: true },
    });

    const existingEmployeeIds = new Set(existingAssignments.map((a) => a.employeeId));
    const newEmployeeIds = employeeIds.filter(
      (id: string) => !existingEmployeeIds.has(id)
    );

    // Verify all new employee IDs exist
    if (newEmployeeIds.length > 0) {
      const employees = await db.employee.findMany({
        where: { id: { in: newEmployeeIds } },
        select: { id: true },
      });
      const validEmployeeIds = new Set(employees.map((e) => e.id));
      const invalidIds = newEmployeeIds.filter((id: string) => !validEmployeeIds.has(id));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Employees not found: ${invalidIds.join(', ')}` },
          { status: 404 }
        );
      }
    }

    // Create assignments for new employees
    const createdAssignments = [];
    for (const employeeId of newEmployeeIds) {
      const assignment = await db.trainingAssignment.create({
        data: {
          trainingId,
          employeeId,
          status: 'due',
          answers: '{}',
        },
      });
      createdAssignments.push(assignment);
    }

    return NextResponse.json(
      {
        assigned: createdAssignments.length,
        skipped: existingEmployeeIds.size,
        assignments: createdAssignments,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to assign training:', error);
    return NextResponse.json({ error: 'Failed to assign training' }, { status: 500 });
  }
}
