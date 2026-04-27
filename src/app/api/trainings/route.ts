import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const trainings = await db.training.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { assignments: true } },
      },
    });

    return NextResponse.json(trainings);
  } catch (error) {
    console.error('Failed to fetch trainings:', error);
    return NextResponse.json({ error: 'Failed to fetch trainings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, difficulty, videoUrl, description, questions, createdBy } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Training title is required' }, { status: 400 });
    }

    if (!category || !category.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Validate questions format if provided
    let questionsJson = '[]';
    if (questions) {
      if (typeof questions === 'string') {
        try {
          JSON.parse(questions);
          questionsJson = questions;
        } catch {
          return NextResponse.json({ error: 'Invalid questions JSON format' }, { status: 400 });
        }
      } else if (Array.isArray(questions)) {
        questionsJson = JSON.stringify(questions);
      }
    }

    const training = await db.training.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        difficulty: difficulty || 'beginner',
        videoUrl: videoUrl || '',
        description: description || '',
        questions: questionsJson,
        createdBy: createdBy || 'admin',
      },
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error('Failed to create training:', error);
    return NextResponse.json({ error: 'Failed to create training' }, { status: 500 });
  }
}
