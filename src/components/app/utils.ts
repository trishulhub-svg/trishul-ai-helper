import { Message, ExtractedCodeBlock, QuizQuestion } from './types';

export const langMap: Record<string, string> = {
  ts:'typescript',tsx:'tsx',js:'javascript',jsx:'jsx',py:'python',rs:'rust',
  go:'go',java:'java',rb:'ruby',php:'php',sql:'sql',css:'css',scss:'scss',
  html:'html',json:'json',yaml:'yaml',yml:'yaml',md:'markdown',sh:'bash',bash:'bash',
  dockerfile:'docker',prisma:'prisma',
};

export function getLanguage(lang: string) { return langMap[lang?.toLowerCase()] || lang?.toLowerCase() || 'text'; }

export function extractCodeBlocksFromMessages(msgs: Message[]): ExtractedCodeBlock[] {
  const blocks: ExtractedCodeBlock[] = [];
  const regex = /```(\w+)?\s*\n([\s\S]*?)```/g;
  for (const msg of msgs) {
    if (msg.role !== 'assistant') continue;
    let match;
    while ((match = regex.exec(msg.content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      const fp = code.match(/\/\/\s*filepath:\s*(.+)/i) || code.match(/<!--\s*filepath:\s*(.+)\s*-->/i) || code.match(/#\s*filepath:\s*(.+)/i);
      blocks.push({ id: `block-${msg.id}-${blocks.length}`, language, code, filePath: fp?.[1]?.trim(), messageId: msg.id });
    }
  }
  return blocks;
}

export function parseQuestions(json: string): QuizQuestion[] {
  try { return JSON.parse(json); } catch { return []; }
}

export function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}
