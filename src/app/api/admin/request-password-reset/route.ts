import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Module-level Map for storing OTPs (in-memory, resets on server restart)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find admin by email
    const admin = await db.admin.findFirst({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'No admin account found with this email' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP with 10-minute expiry
    otpStore.set(admin.id, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'reset_password',
        targetType: 'employee', // Using employee as closest type for admin account
        targetId: admin.id,
        targetName: admin.email,
        newValue: 'OTP generated for password reset',
        performedBy: 'system',
      },
    });

    // Return OTP in response (since we can't actually send email in this environment)
    return NextResponse.json({
      success: true,
      message: 'Password reset OTP generated',
      otp, // Included so UI can display it
      adminId: admin.id,
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    return NextResponse.json({ error: 'Failed to request password reset' }, { status: 500 });
  }
}

// Export the otpStore for use in the verify endpoint
export { otpStore };
