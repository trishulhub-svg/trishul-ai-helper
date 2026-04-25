import { getZAI } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

interface RecommendedCategory {
  name: string;
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { context } = body;

    const systemPrompt = `You are a corporate training advisor. You recommend trending and impactful training categories for organizations.

Your output must be ONLY valid JSON — no markdown, no explanation, no code blocks. Just the raw JSON array.

Each category must follow this exact format:
{
  "name": "Category Name",
  "description": "A brief 1-2 sentence description of what this training covers and why it's valuable"
}

Rules:
- Recommend 5-6 categories
- Categories should be current, relevant, and practical
- Names should be concise (2-4 words)
- Descriptions should be informative but brief
- Return ONLY the JSON array, nothing else`;

    const userMessage = context
      ? `Based on the following company context, recommend 5-6 trending and relevant training categories:

Company context: ${context}

Return the JSON array of recommended categories now.`
      : `Recommend 5-6 trending and impactful training categories for a modern tech organization. Consider current industry trends, in-demand skills, and professional development needs.

Return the JSON array of recommended categories now.`;

    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse the JSON from the response
    let categories: RecommendedCategory[];
    try {
      categories = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        categories = JSON.parse(jsonMatch[1].trim());
      } else {
        const bracketMatch = responseText.match(/\[[\s\S]*\]/);
        if (bracketMatch) {
          categories = JSON.parse(bracketMatch[0]);
        } else {
          return NextResponse.json(
            { error: 'AI returned invalid format. Please try again.' },
            { status: 500 }
          );
        }
      }
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'AI generated invalid recommendations. Please try again.' },
        { status: 500 }
      );
    }

    // Validate each category
    const validatedCategories: RecommendedCategory[] = categories
      .slice(0, 6)
      .map((c: Record<string, unknown>) => ({
        name: String(c.name || 'Unknown Category'),
        description: String(c.description || 'No description available'),
      }));

    return NextResponse.json({ categories: validatedCategories });
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get training recommendations' },
      { status: 500 }
    );
  }
}
