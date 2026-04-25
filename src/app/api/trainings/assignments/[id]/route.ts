import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, answers, score } = body;

    // Verify the assignment exists
    const existingAssignment = await db.trainingAssignment.findUnique({
      where: { id },
      include: { training: true },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Handle status changes
    if (status !== undefined) {
      const validStatuses = ['due', 'in_progress', 'finished'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: due, in_progress, or finished' },
          { status: 400 }
        );
      }
      updateData.status = status;

      // If starting the training, set startedAt
      if (status === 'in_progress' && !existingAssignment.startedAt) {
        updateData.startedAt = new Date();
      }

      // If finishing the training, set completedAt
      if (status === 'finished') {
        updateData.completedAt = new Date();
      }
    }

    // Handle answers
    if (answers !== undefined) {
      if (typeof answers === 'object' && answers !== null) {
        updateData.answers = JSON.stringify(answers);
      } else if (typeof answers === 'string') {
        try {
          JSON.parse(answers);
          updateData.answers = answers;
        } catch {
          return NextResponse.json(
            { error: 'Invalid answers JSON format' },
            { status: 400 }
          );
        }
      }
    }

    // Handle score — auto-calculate if finishing and answers provided
    if (status === 'finished') {
      // Get the answers to evaluate
      let answersToEvaluate: Record<string, string> = {};
      if (answers !== undefined && typeof answers === 'object' && answers !== null) {
        answersToEvaluate = answers as Record<string, string>;
      } else if (existingAssignment.answers) {
        try {
          answersToEvaluate = JSON.parse(existingAssignment.answers);
        } catch {
          answersToEvaluate = {};
        }
      }

      // If we have answers, calculate the score from correct answers
      if (Object.keys(answersToEvaluate).length > 0) {
        try {
          const questions = JSON.parse(existingAssignment.training.questions);
          if (Array.isArray(questions) && questions.length > 0) {
            let correctCount = 0;
            questions.forEach((q: { correctAnswer?: string }, index: number) => {
              const userAnswer = answersToEvaluate[String(index)];
              if (userAnswer && q.correctAnswer && userAnswer === q.correctAnswer) {
                correctCount++;
              }
            });
            const calculatedScore = Math.round((correctCount / questions.length) * 100);
            updateData.score = calculatedScore;
          }
        } catch {
          // If we can't parse questions, use provided score or 0
          if (score !== undefined) {
            updateData.score = score;
          }
        }
      } else if (score !== undefined) {
        updateData.score = score;
      } else {
        updateData.score = 0;
      }
    } else if (score !== undefined) {
      // Allow manual score setting when not finishing
      updateData.score = score;
    }

    const updatedAssignment = await db.trainingAssignment.update({
      where: { id },
      data: updateData,
      include: {
        training: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
          },
        },
      },
    });

    // Parse answers for the response
    let parsedAnswers: unknown = {};
    try {
      parsedAnswers = JSON.parse(updatedAssignment.answers);
    } catch {
      parsedAnswers = {};
    }

    return NextResponse.json({
      ...updatedAssignment,
      answersParsed: parsedAnswers,
    });
  } catch (error) {
    console.error('Failed to update assignment:', error);
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}
