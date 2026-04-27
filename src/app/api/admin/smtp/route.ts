import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const admin = await db.admin.findFirst();
    if (!admin) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 });
    }
    return NextResponse.json({
      smtpHost: admin.smtpHost || '',
      smtpPort: admin.smtpPort || '587',
      smtpUser: admin.smtpUser || '',
      smtpFrom: admin.smtpFrom || '',
      smtpConfigured: !!(admin.smtpHost && admin.smtpUser && admin.smtpPass),
      // Never return the password
    });
  } catch (error) {
    console.error('Failed to get SMTP settings:', error);
    return NextResponse.json({ error: 'Failed to get SMTP settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, currentPassword } = body;

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    const admin = await db.admin.findFirst();
    if (!admin) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Update SMTP settings
    const updateData: Record<string, string> = {
      smtpHost: smtpHost || '',
      smtpPort: smtpPort || '587',
      smtpUser: smtpUser || '',
      smtpFrom: smtpFrom || '',
    };
    // Only update password if a new one is provided
    if (smtpPass) {
      updateData.smtpPass = smtpPass;
    }
    // If smtpUser is empty, clear the password too
    if (!smtpUser) {
      updateData.smtpPass = '';
    }

    await db.admin.update({
      where: { id: admin.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: 'SMTP settings updated' });
  } catch (error) {
    console.error('Failed to update SMTP settings:', error);
    return NextResponse.json({ error: 'Failed to update SMTP settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Test SMTP connection
    const { smtpHost, smtpPort, smtpUser, smtpPass } = body;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'SMTP host, user, and password are required for testing' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || '587'),
      secure: parseInt(smtpPort || '587') === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.verify();
    return NextResponse.json({ success: true, message: 'SMTP connection verified successfully' });
  } catch (error: unknown) {
    console.error('SMTP test failed:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: `SMTP connection failed: ${msg}`,
    }, { status: 400 });
  }
}
