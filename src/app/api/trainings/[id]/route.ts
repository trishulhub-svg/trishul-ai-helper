import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const training = await db.training.findUnique({
      where: { id },
      include: {
        _count: { select: { assignments: true } },
      },
    });

    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    // Parse questions from JSON string
    let parsedQuestions: unknown[] = [];
    try {
      parsedQuestions = JSON.parse(training.questions);
    } catch {
      parsedQuestions = [];
    }

    return NextResponse.json({
      ...training,
      questions: parsedQuestions,
      questionsRaw: training.questions,
    });
  } catch (error) {
    console.error('Failed to fetch training:', error);
    return NextResponse.json({ error: 'Failed to fetch training' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, category, difficulty, videoUrl, description, questions } = body;

    // Validate questions format if provided
    let questionsStr: string | undefined;
    if (questions !== undefined) {
      if (typeof questions === 'string') {
        try {
          JSON.parse(questions);
          questionsStr = questions;
        } catch {
          return NextResponse.json({ error: 'Invalid questions JSON format' }, { status: 400 });
        }
      } else if (Array.isArray(questions)) {
        questionsStr = JSON.stringify(questions);
      }
    }

    const training = await db.training.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(difficulty !== undefined && { difficulty }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(description !== undefined && { description }),
        ...(questionsStr !== undefined && { questions: questionsStr }),
      },
    });

    return NextResponse.json(training);
  } catch (error) {
    console.error('Failed to update training:', error);
    return NextResponse.json({ error: 'Failed to update training' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete training — assignments are cascade deleted via schema
    await db.training.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete training:', error);
    return NextResponse.json({ error: 'Failed to delete training' }, { status: 500 });
  }
}
