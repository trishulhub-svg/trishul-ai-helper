import { db } from '@/lib/db';
import { getZAI, buildSystemPrompt, buildDirectChatPrompt, buildMessages } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, conversationId, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Determine mode: direct chat or project chat
    const isDirectChat = !projectId;

    // Get project context with all code files (only for project chat)
    let projectContext = null;
    if (projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { files: { orderBy: { filePath: 'asc' } } },
      });

      if (project) {
        projectContext = {
          projectName: project.name,
          projectDescription: project.description,
          techStack: project.techStack,
          files: project.files.map(f => ({
            fileName: f.fileName,
            filePath: f.filePath,
            language: f.language,
            content: f.content,
          })),
        };
      }
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
          projectId: projectId || null,
          mode: isDirectChat ? 'direct' : 'project',
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

    // Build system prompt based on mode
    const systemPrompt = isDirectChat
      ? buildDirectChatPrompt()
      : buildSystemPrompt(projectContext);

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

    // Parse code blocks from the response for potential auto-save
    const codeBlocks = extractCodeBlocks(aiResponse);

    return NextResponse.json({
      response: aiResponse,
      conversationId: conversation.id,
      codeBlocks,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

interface CodeBlock {
  language: string;
  code: string;
  filePath?: string;
}

function extractCodeBlocks(response: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```(\w+)?\s*\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(response)) !== null) {
    const language = match[1] || 'text';
    const code = match[2].trim();

    // Try to extract file path from code comment at top
    const filePathMatch = code.match(/\/\/\s*filepath:\s*(.+)/i) ||
                          code.match(/<!--\s*filepath:\s*(.+)\s*-->/i) ||
                          code.match(/#\s*filepath:\s*(.+)/i);

    blocks.push({
      language,
      code,
      filePath: filePathMatch?.[1]?.trim(),
    });
  }

  return blocks;
}
