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

    // Check if admin already exists
    const existingAdmin = await db.admin.findFirst();

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin account already exists. Setup is not allowed.' },
        { status: 403 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin account
    const admin = await db.admin.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Return admin info without password
    return NextResponse.json(
      {
        id: admin.id,
        email: admin.email,
        createdAt: admin.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
