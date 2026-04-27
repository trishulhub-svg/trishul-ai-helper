export interface Project {
  id: string; name: string; description: string; techStack: string;
  isLocked: boolean; createdAt: string; updatedAt: string;
  files?: CodeFile[]; conversations?: Conversation[];
  _count?: { files: number; conversations: number };
}
export interface CodeFile {
  id: string; projectId: string; fileName: string; filePath: string;
  language: string; content: string; version: number; createdAt: string; updatedAt: string;
}
export interface Conversation {
  id: string; projectId: string | null; title: string; mode: string;
  isHidden: boolean; createdAt: string; updatedAt: string; messages?: Message[]; _count?: { messages: number };
}
export interface MessageAttachment {
  type: string; // 'image', 'video', 'file'
  url: string;
  name: string;
  mimeType: string;
}
export interface Message {
  id: string; conversationId: string; role: string; content: string; createdAt: string;
  attachments?: MessageAttachment[];
}
export interface DeleteRequest {
  id: string; type: string; targetId: string; targetName: string;
  requestedBy: string; reason: string; status: string; reviewedBy: string | null; createdAt: string;
}
export interface Employee {
  id: string; employeeId: string; name: string; createdAt: string; updatedAt: string;
}
export interface Training {
  id: string; title: string; category: string; difficulty: string;
  videoUrl: string; description: string; questions: string; createdBy: string;
  createdAt: string; updatedAt: string; _count?: { assignments: number };
}
export interface TrainingAssignment {
  id: string; trainingId: string; employeeId: string; status: string;
  score: number | null; answers: string; startedAt: string | null;
  completedAt: string | null; createdAt: string; updatedAt: string;
  attempts: number; maxAttempts: number; retakeRequested: boolean; retakeApproved: boolean; dueDate: string | null;
  training?: Training; employee?: Employee;
}
export interface QuizQuestion {
  question: string; options: { a: string; b: string; c: string; d: string }; correctAnswer: string;
}
export interface ExtractedCodeBlock {
  id: string; language: string; code: string; filePath?: string; messageId: string;
}
