import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// POST /api/employees/reset-password — Admin reset employee password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, newPassword } = body;

    if (!employeeId || !newPassword) {
      return NextResponse.json(
        { error: 'Employee ID and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find employee by employeeId
    const employee = await db.employee.findUnique({
      where: { employeeId: employeeId.trim() },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update employee password
    await db.employee.update({
      where: { id: employee.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for employee "${employee.name}" (${employee.employeeId})`,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
