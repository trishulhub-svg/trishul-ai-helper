import { db } from '@/lib/db';
import { getZAI, buildBusinessAgentPrompt, buildMessages } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          mode: 'business',
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: { messages: [] },
      });
    }

    // Save user message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Build business-specific system prompt
    const systemPrompt = buildBusinessAgentPrompt();

    // Build conversation history
    const history = conversation?.messages?.map(m => ({
      role: m.role,
      content: m.content,
    })) || [];

    const messages = buildMessages(systemPrompt, history, message);

    // Call LLM
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    // Save assistant message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
      },
    });

    // Update conversation title if it's the first message
    if (conversation.messages.length === 0) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { title: message.slice(0, 50) + (message.length > 50 ? '...' : '') },
      });
    }

    return NextResponse.json({
      response: aiResponse,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error('Business Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
