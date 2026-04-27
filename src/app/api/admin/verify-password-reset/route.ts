import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { otpStore } from '@/app/api/admin/request-password-reset/route';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { otp, newPassword, adminId } = body;

    if (!otp || !newPassword) {
      return NextResponse.json(
        { error: 'OTP and new password are required' },
        { status: 400 }
      );
    }

    if (!adminId) {
      return NextResponse.json({ error: 'adminId is required' }, { status: 400 });
    }

    // Look up the stored OTP
    const stored = otpStore.get(adminId);

    if (!stored) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    // Check if OTP is expired
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(adminId);
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    // Find admin
    const admin = await db.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    await db.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    // Clean up the OTP
    otpStore.delete(adminId);

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'reset_password',
        targetType: 'employee',
        targetId: admin.id,
        targetName: admin.email,
        newValue: 'Password reset via OTP',
        performedBy: admin.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Verify password reset error:', error);
    return NextResponse.json({ error: 'Failed to verify password reset' }, { status: 500 });
  }
}
