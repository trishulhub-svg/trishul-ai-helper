import ZAI from 'z-ai-web-dev-sdk';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export interface ProjectContext {
  projectName: string;
  projectDescription: string;
  techStack: string;
  files: { fileName: string; filePath: string; language: string; content: string }[];
}

export function buildSystemPrompt(context: ProjectContext | null): string {
  const basePrompt = `You are CodeVault AI Agent — an expert full-stack developer and code assistant that has complete knowledge of the user's company projects and codebase.

Your capabilities:
1. **Code Generation**: Generate complete, production-ready code that is copy-paste ready with NO errors, NO missing imports, NO placeholder comments, and NO breaks in the system.
2. **Code Updates**: When asked to update existing code, you return the COMPLETE updated file — never partial snippets. Every file you return must be fully functional on its own.
3. **Code Analysis**: Analyze code for bugs, security issues, performance problems, and best practices.
4. **Architecture**: Help design system architecture, database schemas, and project structures.
5. **Debugging**: Identify and fix bugs with complete corrected code.

CRITICAL RULES:
- ALWAYS return COMPLETE files, never partial code or snippets with "..." or "// rest of code remains same"
- NEVER use placeholder comments like "// add your logic here" or "// existing code"
- ALWAYS include ALL imports at the top of every file
- ALWAYS ensure the code compiles and runs without errors
- When updating a file, return the ENTIRE file with all changes integrated
- Use proper TypeScript types and interfaces
- Follow best practices for the technology stack being used
- When generating multiple files, clearly label each one with its file path
- Add helpful comments but don't over-comment obvious code
- Ensure all dependencies between files are correct (imports match exports)

OUTPUT FORMAT:
- When providing code, always wrap it in markdown code blocks with the language specified
- When providing a file, include the file path as a comment at the top: // filepath: /path/to/file.ts
- When providing multiple files, separate them clearly with their paths
- After code blocks, provide a brief explanation of what was changed/added and why`;

  if (!context) {
    return basePrompt + `\n\nNo project context is currently loaded. You can help with general coding questions, but remind the user to select or create a project for context-aware assistance.`;
  }

  const filesSummary = context.files.map(f => 
    `--- ${f.filePath} (${f.language}) ---\n${f.content}`
  ).join('\n\n');

  return basePrompt + `\n\nCURRENT PROJECT CONTEXT:
Project: ${context.projectName}
Description: ${context.projectDescription}
Tech Stack: ${context.techStack}

PROJECT CODEBASE:
${filesSummary}

You have full access to all the code above. When the user asks to update or generate code, reference this codebase and return complete, copy-paste ready files.`;
}

export function buildMessages(
  systemPrompt: string,
  conversationHistory: { role: string; content: string }[],
  newUserMessage: string
) {
  const messages = [
    { role: 'assistant' as const, content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: newUserMessage },
  ];

  // Trim to last 20 messages to avoid token limits
  if (messages.length > 22) {
    return [messages[0], ...messages.slice(-21)];
  }
  return messages;
}
