import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Module-level Map for storing OTPs (in-memory, resets on server restart)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Cached transporter with pool support — reused across requests
let cachedTransporter: nodemailer.Transporter | null = null;
let cachedSmtpKey = ''; // Track which SMTP config was used

// Build a cache key from SMTP settings to detect config changes
function getSmtpKey(host: string, port: string, user: string): string {
  return `${host}:${port}:${user}`;
}

// Get or create a pooled email transporter
async function getEmailTransporter() {
  const admin = await db.admin.findFirst();
  if (!admin || !admin.smtpHost || !admin.smtpUser || !admin.smtpPass) {
    return null; // SMTP not configured
  }

  const key = getSmtpKey(admin.smtpHost, admin.smtpPort || '587', admin.smtpUser);

  // Reuse cached transporter if config hasn't changed
  if (cachedTransporter && cachedSmtpKey === key) {
    return cachedTransporter;
  }

  // Close old transporter if config changed
  if (cachedTransporter) {
    try { cachedTransporter.close(); } catch {}
  }

  const port = admin.smtpPort ? parseInt(admin.smtpPort) : 587;
  const newTransporter = nodemailer.createTransport({
    host: admin.smtpHost,
    port,
    secure: port === 465,
    auth: { user: admin.smtpUser, pass: admin.smtpPass },
    pool: true,            // Reuse connections
    maxConnections: 3,     // Max simultaneous connections
    maxMessages: 100,      // Max messages per connection
    connectionTimeout: 10000, // 10s connection timeout
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  cachedTransporter = newTransporter;
  cachedSmtpKey = key;
  return newTransporter;
}

async function sendOtpEmail(transporter: nodemailer.Transporter, fromEmail: string, email: string, otp: string): Promise<boolean> {
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

    // Try to get transporter and send email
    const transporter = await getEmailTransporter();
    const fromEmail = admin?.smtpFrom || admin?.smtpUser || 'noreply@trishul.ai';

    if (transporter) {
      // Send email — await it for faster feedback (pooled connection makes this fast)
      const emailSent = await sendOtpEmail(transporter, fromEmail, admin.email, otp);

      if (emailSent) {
        return NextResponse.json({
          success: true,
          message: 'OTP sent to your email address. Please check your inbox.',
          otp: undefined,
          adminId: admin.id,
          emailSent: true,
        });
      } else {
        // Email failed to send — show OTP on screen as fallback
        return NextResponse.json({
          success: true,
          message: 'Email delivery failed. OTP shown on screen as fallback.',
          otp: otp,
          adminId: admin.id,
          emailSent: false,
        });
      }
    } else {
      // SMTP not configured — show OTP on screen
      return NextResponse.json({
        success: true,
        message: 'SMTP not configured. OTP shown on screen.',
        otp: otp,
        adminId: admin.id,
        emailSent: false,
      });
    }
  } catch (error) {
    console.error('Request password reset error:', error);
    return NextResponse.json({ error: 'Failed to request password reset' }, { status: 500 });
  }
}

// Export the otpStore for use in the verify endpoint
export { otpStore };
