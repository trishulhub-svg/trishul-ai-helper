import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the admin account
    const admin = await db.admin.findFirst();

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin account not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      );
    }

    const oldEmail = admin.email;

    // Update admin email
    const updated = await db.admin.update({
      where: { id: admin.id },
      data: { email },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'rename',
        targetType: 'employee',
        targetId: admin.id,
        targetName: email,
        oldValue: oldEmail,
        newValue: email,
        performedBy: 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      email: updated.email,
    });
  } catch (error) {
    console.error('Update email error:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}
