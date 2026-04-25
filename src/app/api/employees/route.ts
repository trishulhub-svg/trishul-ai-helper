import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// GET /api/employees — List all employees (without passwords)
export async function GET() {
  try {
    const employees = await db.employee.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/employees — Create a new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, name, password, createdBy } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Auto-generate employeeId if not provided
    let finalEmployeeId = employeeId?.trim();

    if (!finalEmployeeId) {
      // Find the last employee to determine the next number
      const lastEmployee = await db.employee.findFirst({
        where: {
          employeeId: { startsWith: 'EMP' },
        },
        orderBy: { employeeId: 'desc' },
      });

      let nextNumber = 1;
      if (lastEmployee) {
        const match = lastEmployee.employeeId.match(/^EMP(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      finalEmployeeId = `EMP${String(nextNumber).padStart(3, '0')}`;
    }

    // Check if employeeId already exists
    const existing = await db.employee.findUnique({
      where: { employeeId: finalEmployeeId },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Employee ID "${finalEmployeeId}" already exists` },
        { status: 409 }
      );
    }

    // Hash the password (use a default if not provided)
    const plainPassword = password || 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const employee = await db.employee.create({
      data: {
        employeeId: finalEmployeeId,
        name: name.trim(),
        password: hashedPassword,
        createdBy: createdBy || 'admin',
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Failed to create employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
