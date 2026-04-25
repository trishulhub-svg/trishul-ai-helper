import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const admin = await db.admin.findFirst();

    return NextResponse.json({
      exists: !!admin,
      email: admin?.email ?? null,
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { error: 'Failed to check admin account' },
      { status: 500 }
    );
  }
}
