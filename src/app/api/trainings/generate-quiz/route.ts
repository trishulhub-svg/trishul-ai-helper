import { getZAI } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

interface QuizQuestion {
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, difficulty } = body;

    if (!category || !category.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    const normalizedDifficulty = validDifficulties.includes(difficulty)
      ? difficulty
      : 'beginner';

    const systemPrompt = `You are a professional quiz generator for corporate training programs. You create high-quality, accurate multiple-choice questions that test real understanding of the topic.

Your output must be ONLY valid JSON — no markdown, no explanation, no code blocks. Just the raw JSON array.

Each question must follow this exact format:
{
  "question": "The question text ending with ?",
  "options": {
    "a": "First option",
    "b": "Second option",
    "c": "Third option",
    "d": "Fourth option"
  },
  "correctAnswer": "a"
}

Rules:
- Generate exactly 10 questions
- The correctAnswer must be one of: "a", "b", "c", or "d"
- All 4 options must be plausible but only one correct
- Questions should be clear, unambiguous, and test practical knowledge
- Difficulty level should match the specified level
- Return ONLY the JSON array, nothing else`;

    const difficultyDescription = normalizedDifficulty === 'beginner'
      ? 'beginner (recall/facts) - Focus on fundamental concepts, basic terminology, and factual recall from the video content'
      : normalizedDifficulty === 'intermediate'
        ? 'intermediate (application/analysis) - Focus on applied knowledge, practical scenarios, and analysis of concepts from the video'
        : 'advanced (evaluation/synthesis) - Focus on complex scenarios, edge cases, evaluation of approaches, and synthesis of ideas from the video';

    const userMessage = `Generate quiz questions BASED ON the content of the YouTube video about "${category.trim()}". The questions must be answerable from watching the video.

Requirements:
- Category: ${category.trim()}
- The questions should be at ${difficultyDescription} level
- ${normalizedDifficulty === 'beginner' ? 'Focus on fundamental concepts, definitions, and key facts presented in the video' : ''}
- ${normalizedDifficulty === 'intermediate' ? 'Focus on how concepts are applied, practical examples shown in the video, and analysis of the content' : ''}
- ${normalizedDifficulty === 'advanced' ? 'Focus on evaluating different approaches discussed, synthesizing ideas from the video, and complex scenario analysis' : ''}

Return the JSON array of 10 questions now.`;

    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse the JSON from the response — handle possible markdown wrapping
    let questions: QuizQuestion[];
    try {
      // Try direct parse first
      questions = JSON.parse(responseText);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding array brackets
        const bracketMatch = responseText.match(/\[[\s\S]*\]/);
        if (bracketMatch) {
          questions = JSON.parse(bracketMatch[0]);
        } else {
          return NextResponse.json(
            { error: 'AI returned invalid quiz format. Please try again.' },
            { status: 500 }
          );
        }
      }
    }

    // Validate the questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'AI generated invalid quiz data. Please try again.' },
        { status: 500 }
      );
    }

    // Ensure each question has the required structure
    const validatedQuestions: QuizQuestion[] = questions.map((q: Record<string, unknown>, index: number) => {
      if (!q.question || !q.options || !q.correctAnswer) {
        throw new Error(`Question ${index + 1} is missing required fields`);
      }
      const options = q.options as Record<string, string>;
      if (!options.a || !options.b || !options.c || !options.d) {
        throw new Error(`Question ${index + 1} is missing option fields (a, b, c, d)`);
      }
      if (!['a', 'b', 'c', 'd'].includes(q.correctAnswer as string)) {
        throw new Error(`Question ${index + 1} has invalid correctAnswer`);
      }
      return {
        question: String(q.question),
        options: {
          a: String(options.a),
          b: String(options.b),
          c: String(options.c),
          d: String(options.d),
        },
        correctAnswer: String(q.correctAnswer),
      };
    });

    return NextResponse.json({ questions: validatedQuestions });
  } catch (error) {
    console.error('Failed to generate quiz:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
