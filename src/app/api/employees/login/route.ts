import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// POST /api/employees/login — Employee login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, password } = body;

    if (!employeeId || !password) {
      return NextResponse.json(
        { error: 'Employee ID and password are required' },
        { status: 400 }
      );
    }

    // Find employee by employeeId
    const employee = await db.employee.findUnique({
      where: { employeeId: employeeId.trim() },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid employee ID or password' },
        { status: 401 }
      );
    }

    // Compare password with bcrypt
    const isValid = await bcrypt.compare(password, employee.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid employee ID or password' },
        { status: 401 }
      );
    }

    // Return employee data without password
    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
      },
    });
  } catch (error) {
    console.error('Employee login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
