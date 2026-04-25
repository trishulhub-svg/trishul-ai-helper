import { db } from '@/lib/db';
import { getZAI, buildBusinessAgentPrompt, buildMessages } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

interface Attachment {
  type: string; // 'image', 'video', 'file'
  url: string;  // '/api/files/chat/xxx.png'
  name: string;
  mimeType: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message, attachments } = body;

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message or attachment is required' }, { status: 400 });
    }

    const userMessage = message?.trim() || 'Please analyze the attached file(s).';
    const hasAttachments = attachments && attachments.length > 0;
    const hasImageAttachment = hasAttachments && attachments.some((a: Attachment) => a.type === 'image');
    const hasFileAttachment = hasAttachments && attachments.some((a: Attachment) => a.type !== 'image');

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
          title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
        },
        include: { messages: [] },
      });
    }

    // Save user message with attachments
    const attachmentsJson = hasAttachments ? JSON.stringify(attachments) : '[]';
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: userMessage,
        attachments: attachmentsJson,
      },
    });

    // Build business-specific system prompt
    const systemPrompt = buildBusinessAgentPrompt();

    // Build conversation history
    const history = conversation?.messages?.map(m => ({
      role: m.role,
      content: m.content,
    })) || [];

    let aiResponse: string;

    if (hasImageAttachment) {
      // Use VLM for image attachments
      aiResponse = await handleBusinessVisionChat(systemPrompt, history, userMessage, attachments);
    } else if (hasFileAttachment) {
      // For non-image files, read content and include in text message
      const fileContext = await buildFileContext(attachments);
      const enrichedMessage = `${userMessage}\n\n${fileContext}`;
      const messages = buildMessages(systemPrompt, history, enrichedMessage);
      const zai = await getZAI();
      const completion = await zai.chat.completions.create({
        messages,
        max_tokens: 8000,
        thinking: { type: 'disabled' },
      });
      aiResponse = completion.choices[0]?.message?.content || 'I was unable to process the file. Please try again.';
    } else {
      // Regular text chat
      const messages = buildMessages(systemPrompt, history, userMessage);
      const zai = await getZAI();
      const completion = await zai.chat.completions.create({
        messages,
        max_tokens: 8000,
        thinking: { type: 'disabled' },
      });
      aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';
    }

    // Save assistant message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
        attachments: '[]',
      },
    });

    // Update conversation title if it's the first message
    if (conversation.messages.length === 0) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '') },
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

async function handleBusinessVisionChat(
  systemPrompt: string,
  history: { role: string; content: string }[],
  userMessage: string,
  attachments: Attachment[]
): Promise<string> {
  const zai = await getZAI();

  // Read image files and convert to base64
  const imageContents: { type: string; image_url: { url: string } }[] = [];
  for (const img of attachments.filter(a => a.type === 'image')) {
    try {
      const filePath = path.join(process.cwd(), 'upload', img.url.replace('/api/files/', ''));
      const buffer = await readFile(filePath);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${img.mimeType};base64,${base64}`;
      imageContents.push({
        type: 'image_url',
        image_url: { url: dataUrl },
      });
    } catch (err) {
      console.error('Failed to read image for VLM:', err);
    }
  }

  // Build file context for non-image files
  let fileContextStr = '';
  const fileAttachments = attachments.filter(a => a.type !== 'image');
  if (fileAttachments.length > 0) {
    fileContextStr = await buildFileContext(fileAttachments);
  }

  const enrichedMessage = fileContextStr ? `${userMessage}\n\n${fileContextStr}` : userMessage;

  // Build the multimodal user content
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: enrichedMessage },
    ...imageContents,
  ];

  // Build messages array for VLM
  const messages = [
    { role: 'assistant' as const, content: systemPrompt },
    ...history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userContent },
  ];

  const trimmedMessages = messages.length > 22
    ? [messages[0], ...messages.slice(-21)]
    : messages;

  const response = await zai.chat.completions.createVision({
    messages: trimmedMessages as any,
    thinking: { type: 'disabled' },
  });

  return response.choices[0]?.message?.content || 'I was unable to analyze the image(s). Please try again.';
}

async function buildFileContext(attachments: Attachment[]): Promise<string> {
  const contexts: string[] = [];
  for (const att of attachments) {
    if (att.type === 'image') continue;
    try {
      const filePath = path.join(process.cwd(), 'upload', att.url.replace('/api/files/', ''));
      const buffer = await readFile(filePath);

      if (att.mimeType.startsWith('text/') || att.mimeType === 'application/json' || att.mimeType === 'application/csv') {
        const textContent = buffer.toString('utf-8');
        const truncated = textContent.length > 10000 ? textContent.slice(0, 10000) + '\n...(truncated)' : textContent;
        contexts.push(`--- File: ${att.name} (${att.mimeType}) ---\n${truncated}`);
      } else {
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${att.mimeType};base64,${base64}`;
        contexts.push(`--- File: ${att.name} (${att.mimeType}) ---\n[Binary file - base64 data URL provided]\n${dataUrl.slice(0, 200)}...`);
      }
    } catch {
      contexts.push(`--- File: ${att.name} ---\n[Failed to read file]`);
    }
  }
  return contexts.length > 0 ? `Attached files:\n${contexts.join('\n\n')}` : '';
}
