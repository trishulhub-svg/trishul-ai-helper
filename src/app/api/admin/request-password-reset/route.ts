import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Module-level Map for storing OTPs (in-memory, resets on server restart)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Email transporter - configured from database SMTP settings
async function getEmailTransporter() {
  const admin = await db.admin.findFirst();
  if (!admin || !admin.smtpHost || !admin.smtpUser || !admin.smtpPass) {
    return null; // SMTP not configured in database
  }

  return nodemailer.createTransport({
    host: admin.smtpHost,
    port: admin.smtpPort ? parseInt(admin.smtpPort) : 587,
    secure: admin.smtpPort === '465',
    auth: { user: admin.smtpUser, pass: admin.smtpPass },
  });
}

async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const transporter = await getEmailTransporter();

  if (!transporter) {
    console.log('SMTP not configured in database. OTP for', email, ':', otp);
    return false; // Email not sent
  }

  const admin = await db.admin.findFirst();
  const fromEmail = admin?.smtpFrom || admin?.smtpUser || 'noreply@trishul.ai';

  try {
    await transporter.sendMail({
      from: `"Trishul AI Helper" <${fromEmail}>`,
      to: email,
      subject: 'Password Reset OTP - Trishul AI Helper',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 20px;">Trishul AI Helper</h1>
            <p style="color: #a0a0b0; margin: 0; font-size: 13px;">Password Reset</p>
          </div>
          <div style="background: #ffffff; border-radius: 0 0 12px 12px; padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="color: #333; font-size: 14px; margin: 0 0 16px 0;">You requested a password reset for your admin account.</p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; text-align: center; margin: 0 0 16px 0;">
              <p style="color: #666; font-size: 12px; margin: 0 0 8px 0;">Your OTP code is:</p>
              <p style="color: #1a1a2e; font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 0;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin: 0 0 8px 0;">This code expires in 10 minutes.</p>
            <p style="color: #999; font-size: 11px; margin: 0;">If you didn't request this reset, please ignore this email.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

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

    // Try to send OTP via email
    const emailSent = await sendOtpEmail(admin.email, otp);

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'reset_password',
        targetType: 'employee',
        targetId: admin.id,
        targetName: admin.email,
        newValue: emailSent ? 'OTP sent via email' : 'OTP generated (SMTP not configured)',
        performedBy: 'system',
      },
    });

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'OTP sent to your email address'
        : 'OTP generated. Please configure SMTP settings in Admin Settings to receive OTP via email.',
      otp: emailSent ? undefined : otp, // Only show OTP on screen if email wasn't sent
      adminId: admin.id,
      emailSent,
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    return NextResponse.json({ error: 'Failed to request password reset' }, { status: 500 });
  }
}

// Export the otpStore for use in the verify endpoint
export { otpStore };
