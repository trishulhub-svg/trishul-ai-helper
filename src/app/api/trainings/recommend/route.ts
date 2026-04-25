import { getZAI } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

interface RecommendedCategory {
  name: string;
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { context, category } = body;

    const systemPrompt = `You are a corporate training advisor. You recommend specific, targeted training categories based on the given topic area.

Your output must be ONLY valid JSON — no markdown, no explanation, no code blocks. Just the raw JSON array.

Each category must follow this exact format:
{
  "name": "Category Name",
  "description": "A brief 1-2 sentence description of what this training covers and why it's valuable"
}

Rules:
- Recommend 5-6 categories
- Categories MUST be directly related to and sub-topics of the specified area
- Names should be concise (2-4 words)
- Descriptions should be informative but brief
- Do NOT suggest generic/unrelated topics like "Digital Transformation" or "Remote Leadership" when the category is a specific technical topic
- Focus on practical, actionable sub-topics within the given category
- Return ONLY the JSON array, nothing else`;

    let userMessage: string;

    if (category && category.trim()) {
      userMessage = `The admin wants to create training in the category: "${category.trim()}".

Suggest 5-6 SPECIFIC training sub-categories that are DIRECTLY related to "${category.trim()}". These should be topics that someone learning about ${category.trim()} would actually study.

For example, if the category is "Python", suggest things like "Python Basics & Syntax", "Python Data Structures", "Python OOP Concepts", "Python File Handling", "Python Error Handling", "Python Libraries & Frameworks" — NOT generic topics like "Digital Transformation" or "Cybersecurity".

If the category is a non-technical topic like "Public Health", suggest relevant sub-topics within public health.

${context ? `Additional company context: ${context}` : ''}

Return the JSON array of recommended categories now.`;
    } else if (context) {
      userMessage = `Based on the following company context, recommend 5-6 specific and relevant training categories:

Company context: ${context}

Return the JSON array of recommended categories now.`;
    } else {
      userMessage = `Recommend 5-6 trending and impactful training categories for a modern tech organization. Consider current industry trends, in-demand skills, and professional development needs.

Return the JSON array of recommended categories now.`;
    }

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
