'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAgentStore } from '@/store/agent-store';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Bot,
  Plus,
  FolderOpen,
  FileCode2,
  Send,
  Trash2,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Save,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Pencil,
  FolderPlus,
  FilePlus,
  Loader2,
  FileText,
  Sparkles,
  Menu,
  Zap,
  Code2,
  Lightbulb,
  PanelRightOpen,
  PanelRightClose,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string;
  createdAt: string;
  updatedAt: string;
  files?: CodeFile[];
  conversations?: Conversation[];
  _count?: { files: number; conversations: number };
}

interface CodeFile {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  language: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  projectId: string | null;
  title: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  _count?: { messages: number };
}

interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
}

// Extracted code block type for the Code Panel
interface ExtractedCodeBlock {
  id: string;
  language: string;
  code: string;
  filePath?: string;
  messageId: string;
}

// Language map
const langMap: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  py: 'python', rs: 'rust', go: 'go', java: 'java',
  rb: 'ruby', php: 'php', sql: 'sql', css: 'css',
  scss: 'scss', html: 'html', json: 'json', yaml: 'yaml',
  yml: 'yaml', md: 'markdown', sh: 'bash', bash: 'bash',
  dockerfile: 'docker', prisma: 'prisma',
};

function getLanguage(lang: string): string {
  return langMap[lang?.toLowerCase()] || lang?.toLowerCase() || 'text';
}

// Extract all code blocks from messages
function extractCodeBlocksFromMessages(msgs: Message[]): ExtractedCodeBlock[] {
  const blocks: ExtractedCodeBlock[] = [];
  const regex = /```(\w+)?\s*\n([\s\S]*?)```/g;

  for (const msg of msgs) {
    if (msg.role !== 'assistant') continue;
    let match;
    while ((match = regex.exec(msg.content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      const filePathMatch = code.match(/\/\/\s*filepath:\s*(.+)/i) ||
                            code.match(/<!--\s*filepath:\s*(.+)\s*-->/i) ||
                            code.match(/#\s*filepath:\s*(.+)/i);
      blocks.push({
        id: `block-${msg.id}-${blocks.length}`,
        language,
        code,
        filePath: filePathMatch?.[1]?.trim(),
        messageId: msg.id,
      });
    }
  }
  return blocks;
}

// ==================== COPY BUTTON ====================
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-6 px-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-700 gap-1 ${className || ''}`}
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

// ==================== SAVE TO PROJECT BUTTON ====================
function SaveToProjectButton({ code, language, projectId, onSaved }: {
  code: string; language: string; projectId: string | null; onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [fileName, setFileName] = useState('');
  const [filePath, setFilePath] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (showDialog && projectId) {
      const filePathMatch = code.match(/\/\/\s*filepath:\s*(.+)/i) ||
                            code.match(/<!--\s*filepath:\s*(.+)\s*-->/i) ||
                            code.match(/#\s*filepath:\s*(.+)/i);
      if (filePathMatch) {
        const detected = filePathMatch[1].trim();
        setFilePath(detected);
        setFileName(detected.split('/').pop() || detected);
      }
    }
  }, [showDialog, code, projectId]);

  if (!projectId) return null;

  const handleSave = async () => {
    if (!fileName.trim() || !filePath.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: fileName.trim(), filePath: filePath.trim(), language: language || 'typescript', content: code }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to save'); }
      toast({ title: 'File saved!', description: `${fileName} saved to project` });
      setShowDialog(false); setFileName(''); setFilePath('');
      onSaved();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save file', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 gap-1" onClick={(e) => { e.stopPropagation(); setShowDialog(true); }}>
        <Save className="h-3 w-3" /> Save
      </Button>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Code to Project</DialogTitle>
            <DialogDescription>Save this code block as a file in your project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium mb-1.5 block">File Name</label><Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g., page.tsx" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">File Path</label><Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="e.g., src/app/page.tsx" /></div>
            <Button onClick={handleSave} disabled={saving || !fileName.trim() || !filePath.trim()} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== CHAT MESSAGE ====================
function ChatMessage({ message, projectId, onFilesUpdated, onViewCode }: {
  message: Message; projectId: string | null; onFilesUpdated: () => void;
  onViewCode: (code: string, language: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-lg bg-card">
          <img src="/trishul-logo.png" alt="AI" className="h-full w-full object-contain p-0.5" />
        </div>
      )}
      <div className="max-w-[92%] sm:max-w-[85%] min-w-0">
        <div className={`rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm leading-relaxed ${isUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-3 [&>p:last-child]:mb-0">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (match) {
                      return (
                        <div className="relative group my-3 rounded-lg overflow-hidden border border-border">
                          <div className="flex items-center justify-between bg-zinc-800 dark:bg-zinc-900 px-2 sm:px-3 py-1.5 text-xs text-zinc-400">
                            <span className="font-mono text-[10px] sm:text-xs">{match[1]}</span>
                            <div className="flex gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-zinc-400 hover:text-sky-400 hover:bg-zinc-700 gap-1"
                                onClick={(e) => { e.stopPropagation(); onViewCode(codeString, match[1]); }}
                                title="View in Code Panel"
                              >
                                <Eye className="h-3 w-3" /> View
                              </Button>
                              <SaveToProjectButton code={codeString} language={match[1]} projectId={projectId} onSaved={onFilesUpdated} />
                              <CopyButton text={codeString} />
                            </div>
                          </div>
                          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <SyntaxHighlighter
                              style={oneDark}
                              language={getLanguage(match[1])}
                              PreTag="div"
                              customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.75rem', lineHeight: '1.5' }}
                              {...props}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      );
                    }
                    return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
          <span className="text-[10px] sm:text-xs font-bold text-white">U</span>
        </div>
      )}
    </div>
  );
}

// ==================== SIDEBAR CONTENT ====================
function SidebarContent({
  projects, currentProject, projectFiles, directChats,
  selectedProjectId, selectedConversationId, selectedDirectChatId, expandedProjects,
  showNewProject, setShowNewProject, newProjectName, setNewProjectName,
  newProjectDesc, setNewProjectDesc, newProjectTech, setNewProjectTech,
  handleCreateProject, handleDeleteProject, handleDeleteConversation, handleDeleteDirectChat,
  setSelectedProjectId, setSelectedConversationId, setSelectedDirectChatId,
  toggleProjectExpand, handleNewChat, handleNewDirectChat,
  showNewFile, setShowNewFile, showAddCode, setShowAddCode,
  newFileName, setNewFileName, newFilePath, setNewFilePath,
  newFileLanguage, setNewFileLanguage, newFileContent, setNewFileContent,
  addCodeContent, setAddCodeContent, handleAddFile, handleAddCode,
  handleDeleteFile, handleViewFile, onCloseMobile,
}: {
  projects: Project[]; currentProject: Project | null; projectFiles: CodeFile[];
  directChats: Conversation[]; selectedProjectId: string | null;
  selectedConversationId: string | null; selectedDirectChatId: string | null;
  expandedProjects: Set<string>; showNewProject: boolean; setShowNewProject: (v: boolean) => void;
  newProjectName: string; setNewProjectName: (v: string) => void;
  newProjectDesc: string; setNewProjectDesc: (v: string) => void;
  newProjectTech: string; setNewProjectTech: (v: string) => void;
  handleCreateProject: () => void; handleDeleteProject: (id: string) => void;
  handleDeleteConversation: (id: string) => void; handleDeleteDirectChat: (id: string) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedConversationId: (id: string | null) => void;
  setSelectedDirectChatId: (id: string | null) => void;
  toggleProjectExpand: (id: string) => void; handleNewChat: () => void; handleNewDirectChat: () => void;
  showNewFile: boolean; setShowNewFile: (v: boolean) => void;
  showAddCode: boolean; setShowAddCode: (v: boolean) => void;
  newFileName: string; setNewFileName: (v: string) => void;
  newFilePath: string; setNewFilePath: (v: string) => void;
  newFileLanguage: string; setNewFileLanguage: (v: string) => void;
  newFileContent: string; setNewFileContent: (v: string) => void;
  addCodeContent: string; setAddCodeContent: (v: string) => void;
  handleAddFile: () => void; handleAddCode: () => void;
  handleDeleteFile: (id: string) => void; handleViewFile: (file: CodeFile) => void;
  onCloseMobile?: () => void;
}) {
  const closeOnMobile = () => onCloseMobile?.();

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 sm:p-4 border-b">
        <div className="flex items-center gap-2.5 mb-3">
          <img src="/trishul-logo.png" alt="Trishul AI Helper" className="h-7 sm:h-8 w-auto object-contain" />
          <div>
            <h1 className="text-xs sm:text-sm font-bold">Trishul AI Helper</h1>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">Your AI Code Knowledge Base</p>
          </div>
        </div>
        <Button size="sm" className="w-full h-8 text-xs gap-1.5 mb-2" variant="default" onClick={() => { handleNewDirectChat(); closeOnMobile(); }}>
          <Sparkles className="h-3.5 w-3.5" /> Direct AI Chat
        </Button>
        <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5"><FolderPlus className="h-3.5 w-3.5" /> New Project</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create New Project</DialogTitle><DialogDescription>Add your project to store code and chat with AI</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium mb-1.5 block">Project Name *</label><Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="e.g., My Web App" onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} autoFocus /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Description</label><Textarea value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} placeholder="What is this project about?" rows={2} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Tech Stack</label><Input value={newProjectTech} onChange={(e) => setNewProjectTech(e.target.value)} placeholder="e.g., Next.js, TypeScript, Prisma" /></div>
              <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="w-full"><FolderPlus className="h-4 w-4 mr-2" /> Create Project</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {directChats.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Direct Chats</p>
              {directChats.map((conv) => (
                <div key={conv.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group ${selectedDirectChatId === conv.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={() => { setSelectedDirectChatId(conv.id); setSelectedProjectId(null); setSelectedConversationId(null); closeOnMobile(); }}>
                  <Sparkles className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteDirectChat(conv.id); }}><X className="h-2.5 w-2.5" /></Button>
                </div>
              ))}
              <div className="border-t my-2" />
            </div>
          )}

          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Projects</p>
          {projects.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm"><FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-xs">No projects yet</p></div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="mb-0.5">
                <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${selectedProjectId === project.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  onClick={() => { setSelectedProjectId(project.id); setSelectedDirectChatId(null); toggleProjectExpand(project.id); closeOnMobile(); }}>
                  {expandedProjects.has(project.id) && selectedProjectId === project.id ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
                  <FolderOpen className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium truncate flex-1">{project.name}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}><Trash2 className="h-3 w-3 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete Project?</AlertDialogTitle><AlertDialogDescription>This will permanently delete &quot;{project.name}&quot; and all its files and conversations.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteProject(project.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {expandedProjects.has(project.id) && selectedProjectId === project.id && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {currentProject?.conversations?.map((conv) => (
                      <div key={conv.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group ${selectedConversationId === conv.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        onClick={() => { setSelectedConversationId(conv.id); closeOnMobile(); }}>
                        <MessageSquare className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate flex-1">{conv.title}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}><X className="h-2.5 w-2.5" /></Button>
                      </div>
                    ))}
                    <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors" onClick={handleNewChat}><Plus className="h-3 w-3" /> New Chat</button>
                    <div className="border-t my-1" />
                    {projectFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group hover:bg-muted" onClick={() => handleViewFile(file)}>
                        <FileCode2 className="h-3 w-3 flex-shrink-0 text-emerald-500" />
                        <span className="truncate flex-1 text-muted-foreground group-hover:text-foreground">{file.filePath}</span>
                        <Badge variant="secondary" className="h-4 px-1 text-[9px]">v{file.version}</Badge>
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}><X className="h-2.5 w-2.5" /></Button>
                      </div>
                    ))}
                    <div className="flex gap-1 pt-1">
                      <Dialog open={showNewFile} onOpenChange={(open) => { setShowNewFile(open); if (!open) { setNewFileName(''); setNewFilePath(''); setNewFileLanguage('typescript'); setNewFileContent(''); } }}>
                        <DialogTrigger asChild><button className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-muted flex-1 transition-colors border border-dashed border-border"><FilePlus className="h-3 w-3" /> Add File</button></DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Add Code File</DialogTitle><DialogDescription>Add a new code file to your project</DialogDescription></DialogHeader>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div><label className="text-sm font-medium mb-1.5 block">File Name *</label><Input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="e.g., page.tsx" autoFocus /></div>
                              <div><label className="text-sm font-medium mb-1.5 block">File Path *</label><Input value={newFilePath} onChange={(e) => setNewFilePath(e.target.value)} placeholder="e.g., src/app/page.tsx" /></div>
                            </div>
                            <div><label className="text-sm font-medium mb-1.5 block">Language</label><Input value={newFileLanguage} onChange={(e) => setNewFileLanguage(e.target.value)} placeholder="e.g., typescript" /></div>
                            <div><label className="text-sm font-medium mb-1.5 block">Code Content *</label><Textarea value={newFileContent} onChange={(e) => setNewFileContent(e.target.value)} placeholder="Paste your code here..." rows={12} className="font-mono text-xs" /></div>
                            <Button onClick={handleAddFile} disabled={!newFileName.trim() || !newFilePath.trim()} className="w-full"><FilePlus className="h-4 w-4 mr-2" /> Add File</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={showAddCode} onOpenChange={(open) => { setShowAddCode(open); if (!open) setAddCodeContent(''); }}>
                        <DialogTrigger asChild><button className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-muted flex-1 transition-colors border border-dashed border-border"><Pencil className="h-3 w-3" /> Paste Code</button></DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Paste Code</DialogTitle><DialogDescription>Paste your code and it will be saved as a file</DialogDescription></DialogHeader>
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">Paste your code below. Add a <code className="bg-muted px-1 rounded">{'// filepath: /path/to/file.ts'}</code> comment at the top for automatic file path detection.</p>
                            <Textarea value={addCodeContent} onChange={(e) => setAddCodeContent(e.target.value)} placeholder={`// filepath: src/app/page.tsx\n\nexport default function Page() {\n  return <div>Hello World</div>;\n}`} rows={16} className="font-mono text-xs" autoFocus />
                            <Button onClick={handleAddCode} disabled={!addCodeContent.trim()} className="w-full"><Save className="h-4 w-4 mr-2" /> Save Code</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-2 sm:p-3 border-t">
        <div className="text-[9px] sm:text-[10px] text-muted-foreground text-center">Trishul AI Helper • by Trishulhub</div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function Home() {
  const { selectedProjectId, selectedConversationId, sidebarOpen, fileViewerOpen,
    setSelectedProjectId, setSelectedConversationId, setSidebarOpen, setFileViewerOpen, setSelectedFileId } = useAgentStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectFiles, setProjectFiles] = useState<CodeFile[]>([]);
  const [directChats, setDirectChats] = useState<Conversation[]>([]);
  const [selectedDirectChatId, setSelectedDirectChatId] = useState<string | null>(null);

  // UI states
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [viewingFile, setViewingFile] = useState<CodeFile | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Code Panel states
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [codePanelContent, setCodePanelContent] = useState<{ code: string; language: string } | null>(null);
  const [codePanelTab, setCodePanelTab] = useState<'current' | 'all'>('current');

  // Smart scroll: track if user has scrolled up
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [showAddCode, setShowAddCode] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('typescript');
  const [newFileContent, setNewFileContent] = useState('');
  const [addCodeContent, setAddCodeContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Extract code blocks from all messages for the Code Panel
  const allCodeBlocks = extractCodeBlocksFromMessages(messages);

  // Detect user scroll
  const handleChatScroll = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If user is more than 150px from bottom, they've scrolled up
    setUserScrolledUp(distanceFromBottom > 150);
  }, []);

  // Smart auto-scroll: only scroll if user hasn't scrolled up
  useEffect(() => {
    if (!userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userScrolledUp]);

  // View code in panel
  const handleViewCode = useCallback((code: string, language: string) => {
    setCodePanelContent({ code, language });
    setCodePanelTab('current');
    setCodePanelOpen(true);
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) { const data = await res.json(); setProjects(data); }
    } catch (error) { console.error('Failed to fetch projects:', error); }
  }, []);

  // Fetch direct chats
  const fetchDirectChats = useCallback(async () => {
    try {
      const res = await fetch('/api/direct-chats');
      if (res.ok) { const data = await res.json(); setDirectChats(data); }
    } catch (error) { console.error('Failed to fetch direct chats:', error); }
  }, []);

  // Fetch current project details
  const fetchProjectDetails = useCallback(async () => {
    if (!selectedProjectId) { setCurrentProject(null); setProjectFiles([]); return; }
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}`);
      if (res.ok) { const data = await res.json(); setCurrentProject(data); setProjectFiles(data.files || []); }
    } catch (error) { console.error('Failed to fetch project details:', error); }
  }, [selectedProjectId]);

  // Fetch messages
  const fetchMessages = useCallback(async (convId?: string) => {
    const id = convId || selectedConversationId;
    if (!id) { if (!selectedDirectChatId) setMessages([]); return; }
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) { const data = await res.json(); setCurrentConversation(data); setMessages(data.messages || []); }
    } catch (error) { console.error('Failed to fetch messages:', error); }
  }, [selectedConversationId, selectedDirectChatId]);

  const fetchDirectChatMessages = useCallback(async (convId?: string) => {
    const id = convId || selectedDirectChatId;
    if (!id) { setMessages([]); return; }
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) { const data = await res.json(); setMessages(data.messages || []); }
    } catch (error) { console.error('Failed to fetch direct chat messages:', error); }
  }, [selectedDirectChatId]);

  // Initial load
  useEffect(() => { fetchProjects(); fetchDirectChats(); }, [fetchProjects, fetchDirectChats]);

  // Reload project details when project changes
  useEffect(() => { fetchProjectDetails(); }, [fetchProjectDetails]);

  // Reload messages when conversation changes
  useEffect(() => {
    if (selectedDirectChatId) { fetchDirectChatMessages(); }
    else if (selectedConversationId) { fetchMessages(); }
    else { setMessages([]); }
  }, [selectedConversationId, selectedDirectChatId, fetchMessages, fetchDirectChatMessages]);

  // Reset scroll state when conversation changes
  useEffect(() => { setUserScrolledUp(false); }, [selectedConversationId, selectedDirectChatId]);

  // Create project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newProjectName.trim(), description: newProjectDesc.trim(), techStack: newProjectTech.trim() }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create project'); }
      const project = await res.json();
      toast({ title: 'Project created!', description: newProjectName });
      setShowNewProject(false); setNewProjectName(''); setNewProjectDesc(''); setNewProjectTech('');
      setSelectedProjectId(project.id); setSelectedDirectChatId(null);
      setExpandedProjects(prev => new Set(prev).add(project.id));
      fetchProjects();
    } catch (err) { toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create project', variant: 'destructive' }); }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (selectedProjectId === id) setSelectedProjectId(null);
      fetchProjects(); toast({ title: 'Project deleted' });
    } catch { toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' }); }
  };

  const handleAddFile = async () => {
    if (!selectedProjectId || !newFileName.trim() || !newFilePath.trim()) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/files`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: newFileName.trim(), filePath: newFilePath.trim(), language: newFileLanguage, content: newFileContent }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to add file'); }
      toast({ title: 'File added!', description: newFileName });
      setShowNewFile(false); setNewFileName(''); setNewFilePath(''); setNewFileLanguage('typescript'); setNewFileContent('');
      fetchProjectDetails();
    } catch (err) { toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to add file', variant: 'destructive' }); }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/files/${fileId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (viewingFile?.id === fileId) { setViewingFile(null); setFileViewerOpen(false); }
      fetchProjectDetails(); toast({ title: 'File deleted' });
    } catch { toast({ title: 'Error', description: 'Failed to delete file', variant: 'destructive' }); }
  };

  const handleAddCode = async () => {
    if (!selectedProjectId || !addCodeContent.trim()) return;
    const filePathMatch = addCodeContent.match(/\/\/\s*filepath:\s*(.+)/i) || addCodeContent.match(/<!--\s*filepath:\s*(.+)\s*-->/i);
    const filePath = filePathMatch ? filePathMatch[1].trim() : 'untitled.txt';
    const fileName = filePath.split('/').pop() || 'untitled.txt';
    const ext = fileName.split('.').pop() || 'txt';
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/files`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName, filePath, language: ext, content: addCodeContent }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to add code'); }
      toast({ title: 'Code added!', description: `Saved as ${filePath}` });
      setShowAddCode(false); setAddCodeContent(''); fetchProjectDetails();
    } catch (err) { toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to add code', variant: 'destructive' }); }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (selectedConversationId === id) { setSelectedConversationId(null); setMessages([]); }
      fetchProjectDetails(); toast({ title: 'Chat deleted' });
    } catch { toast({ title: 'Error', description: 'Failed to delete chat', variant: 'destructive' }); }
  };

  const handleDeleteDirectChat = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (selectedDirectChatId === id) { setSelectedDirectChatId(null); setMessages([]); }
      fetchDirectChats(); toast({ title: 'Direct chat deleted' });
    } catch { toast({ title: 'Error', description: 'Failed to delete chat', variant: 'destructive' }); }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMessage = inputMessage.trim();
    setInputMessage(''); setIsLoading(true); setUserScrolledUp(false);
    const tempUserMsg: Message = { id: 'temp-' + Date.now(), conversationId: selectedDirectChatId || selectedConversationId || '', role: 'user', content: userMessage, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: selectedProjectId || undefined, conversationId: selectedDirectChatId || selectedConversationId || undefined, message: userMessage }) });
      if (res.ok) {
        const data = await res.json();
        const newConvId = data.conversationId;
        if (newConvId && !selectedDirectChatId && !selectedConversationId) {
          if (!selectedProjectId) setSelectedDirectChatId(newConvId); else setSelectedConversationId(newConvId);
        }
        if (newConvId) {
          try {
            const msgRes = await fetch(`/api/conversations/${newConvId}`);
            if (msgRes.ok) { const msgData = await msgRes.json(); setCurrentConversation(msgData); setMessages(msgData.messages || []); }
          } catch (e) { console.error('Failed to fetch messages after send:', e); }
        }
        if (!selectedProjectId) fetchDirectChats(); else { fetchProjectDetails(); fetchProjects(); }
      } else {
        const errData = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: errData.error || 'Failed to get response', variant: 'destructive' });
        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      }
    } catch {
      toast({ title: 'Network Error', description: 'Could not connect to the server', variant: 'destructive' });
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally { setIsLoading(false); }
  };

  const handleNewChat = () => { setSelectedConversationId(null); setMessages([]); setCurrentConversation(null); setUserScrolledUp(false); inputRef.current?.focus(); };
  const handleNewDirectChat = () => { setSelectedDirectChatId(null); setSelectedProjectId(null); setSelectedConversationId(null); setMessages([]); setCurrentConversation(null); setCodePanelOpen(false); setUserScrolledUp(false); inputRef.current?.focus(); };
  const toggleProjectExpand = (id: string) => { setExpandedProjects(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const handleViewFile = (file: CodeFile) => { setViewingFile(file); setFileViewerOpen(true); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  // Determine if we should show the chat interface (any conversation is active or messages exist)
  const hasActiveChat = !!(selectedDirectChatId || selectedConversationId || messages.length > 0);

  const sidebarProps = {
    projects, currentProject, projectFiles, directChats, selectedProjectId, selectedConversationId,
    selectedDirectChatId, expandedProjects, showNewProject, setShowNewProject, newProjectName,
    setNewProjectName, newProjectDesc, setNewProjectDesc, newProjectTech, setNewProjectTech,
    handleCreateProject, handleDeleteProject, handleDeleteConversation, handleDeleteDirectChat,
    setSelectedProjectId, setSelectedConversationId, setSelectedDirectChatId, toggleProjectExpand,
    handleNewChat, handleNewDirectChat, showNewFile, setShowNewFile, showAddCode, setShowAddCode,
    newFileName, setNewFileName, newFilePath, setNewFilePath, newFileLanguage, setNewFileLanguage,
    newFileContent, setNewFileContent, addCodeContent, setAddCodeContent, handleAddFile,
    handleAddCode, handleDeleteFile, handleViewFile, onCloseMobile: () => setMobileSheetOpen(false),
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex bg-background overflow-hidden">
        {/* ========== DESKTOP SIDEBAR ========== */}
        {!isMobile && (
          <div className={`hidden md:flex flex-col border-r bg-card transition-all duration-300 ${sidebarOpen ? 'w-72 min-w-72' : 'w-0 min-w-0 overflow-hidden'}`}>
            <SidebarContent {...sidebarProps} />
          </div>
        )}

        {/* ========== MAIN CONTENT ========== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="h-12 border-b flex items-center gap-2 sm:gap-3 px-3 sm:px-4 flex-shrink-0">
            {isMobile && (
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Menu className="h-4 w-4" /></Button></SheetTrigger>
                <SheetContent side="left" className="w-72 p-0"><SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader><SidebarContent {...sidebarProps} /></SheetContent>
              </Sheet>
            )}
            {!isMobile && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
            )}
            <img src="/trishul-banner.png" alt="Trishulhub" className="h-6 sm:h-7 w-auto object-contain hidden sm:block" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedProjectId && currentProject ? (
                <>
                  <FolderOpen className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium truncate">{currentProject.name}</span>
                  {currentProject.techStack && <Badge variant="secondary" className="text-[9px] sm:text-[10px] flex-shrink-0 hidden sm:flex">{currentProject.techStack}</Badge>}
                  <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">• {projectFiles.length} files</span>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-xs sm:text-sm text-muted-foreground">{selectedDirectChatId ? 'Direct AI Chat' : 'Trishul AI Helper'}</span>
                </div>
              )}
            </div>

            {/* Code Panel Toggle */}
            {hasActiveChat && allCodeBlocks.length > 0 && (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setCodePanelOpen(!codePanelOpen)}>
                {codePanelOpen ? <PanelRightClose className="h-3 w-3" /> : <PanelRightOpen className="h-3 w-3" />}
                <span className="hidden sm:inline">Code</span>
                <Badge variant="secondary" className="h-4 px-1 text-[9px]">{allCodeBlocks.length}</Badge>
              </Button>
            )}
            {selectedProjectId && <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleNewChat}><Plus className="h-3 w-3" /><span className="hidden sm:inline">New Chat</span></Button>}
          </div>

          {/* Content Area */}
          <div className="flex-1 flex min-h-0">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {!hasActiveChat ? (
                /* Welcome Screen */
                <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                  <div className="text-center max-w-lg w-full">
                    <img src="/trishul-logo.png" alt="Trishul AI Helper" className="h-12 sm:h-16 w-auto object-contain mx-auto mb-4 sm:mb-6" />
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Welcome to Trishul AI Helper</h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                      Your AI-powered code knowledge base. Chat directly with AI or create a project to store your code.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                      <button className="rounded-xl border p-3 sm:p-4 hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors cursor-pointer" onClick={handleNewDirectChat}>
                        <Sparkles className="h-5 w-5 text-amber-500 mb-2" />
                        <h3 className="text-sm font-semibold mb-1">Direct AI Chat</h3>
                        <p className="text-xs text-muted-foreground">Ask AI to write, fix, or explain any code</p>
                      </button>
                      <button className="rounded-xl border p-3 sm:p-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors cursor-pointer" onClick={() => setShowNewProject(true)}>
                        <FolderPlus className="h-5 w-5 text-emerald-500 mb-2" />
                        <h3 className="text-sm font-semibold mb-1">Create Project</h3>
                        <p className="text-xs text-muted-foreground">Store your project code and chat with context</p>
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { icon: <Code2 className="h-3 w-3" />, text: 'Build a REST API' },
                        { icon: <Zap className="h-3 w-3" />, text: 'Fix my code' },
                        { icon: <Lightbulb className="h-3 w-3" />, text: 'Explain a concept' },
                        { icon: <Bot className="h-3 w-3" />, text: 'Create a component' },
                      ].map((s) => (
                        <button key={s.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs hover:bg-muted transition-colors"
                          onClick={() => { setInputMessage(s.text); handleNewDirectChat(); setTimeout(() => inputRef.current?.focus(), 100); }}>
                          {s.icon}{s.text}
                        </button>
                      ))}
                    </div>

                    {/* Quick start input at bottom of welcome screen */}
                    <div className="mt-8">
                      <div className="flex gap-2 items-end max-w-md mx-auto">
                        <div className="flex-1 relative">
                          <textarea
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything about coding... (Enter to send)"
                            rows={1}
                            className="w-full resize-none rounded-xl border bg-background px-3 py-2.5 sm:px-4 sm:py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-[200px]"
                            style={{ height: 'auto' }}
                            onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = Math.min(target.scrollHeight, 200) + 'px'; }}
                          />
                        </div>
                        <Button size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex-shrink-0" onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1.5 text-center">Powered by Trishul AI — Generate complete, production-ready code with no errors.</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Chat Interface */
                <>
                  <div ref={chatScrollRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-3 sm:p-4">
                    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                      {messages.length === 0 && selectedProjectId && (
                        <div className="text-center py-8 sm:py-12">
                          <img src="/trishul-logo.png" alt="Trishul AI Helper" className="h-10 sm:h-12 w-auto object-contain mx-auto mb-3 sm:mb-4 opacity-80" />
                          <h3 className="text-base sm:text-lg font-semibold mb-1">Ready to Code</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                            I have full knowledge of your project{projectFiles.length > 0 ? ` (${projectFiles.length} files loaded)` : ''}. Ask me to update code, add features, fix bugs, or explain anything.
                          </p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {['Update the code with new features', 'Review my code for bugs', 'Add authentication', 'Explain my codebase'].map((s) => (
                              <button key={s} className="px-3 py-1.5 rounded-full border text-xs hover:bg-muted transition-colors" onClick={() => { setInputMessage(s); inputRef.current?.focus(); }}>{s}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} projectId={selectedProjectId} onFilesUpdated={fetchProjectDetails} onViewCode={handleViewCode} />
                      ))}

                      {isLoading && (
                        <div className="flex gap-2 sm:gap-3">
                          <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center bg-card">
                            <img src="/trishul-logo.png" alt="AI" className="h-full w-full object-contain p-0.5" />
                          </div>
                          <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2.5 sm:px-4 sm:py-3">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                              {selectedProjectId ? 'Analyzing your codebase...' : 'Thinking...'}
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Scroll to bottom button */}
                  {userScrolledUp && (
                    <div className="relative">
                      <button
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs shadow-lg hover:bg-primary/90 transition-colors"
                        onClick={() => { setUserScrolledUp(false); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                      >
                        <ChevronDown className="h-3 w-3" /> Scroll to bottom
                      </button>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="border-t p-3 sm:p-4">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 relative">
                          <textarea
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedProjectId ? 'Ask AI to generate, update, or fix your code... (Enter to send)' : 'Ask me anything about coding... (Enter to send)'}
                            disabled={isLoading}
                            rows={1}
                            className="w-full resize-none rounded-xl border bg-background px-3 py-2.5 sm:px-4 sm:py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 min-h-[44px] max-h-[200px]"
                            style={{ height: 'auto' }}
                            onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = Math.min(target.scrollHeight, 200) + 'px'; }}
                          />
                        </div>
                        <Button size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex-shrink-0" onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1.5 text-center">
                        {selectedProjectId && projectFiles.length > 0
                          ? `AI has full knowledge of your ${projectFiles.length} project files. Ask for complete, copy-paste ready code.`
                          : selectedProjectId ? 'Upload code files to your project for context-aware AI assistance.'
                          : 'Powered by Trishul AI — Generate complete, production-ready code with no errors.'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ========== CODE PANEL (side-by-side code viewer) ========== */}
            {codePanelOpen && hasActiveChat && !isMobile && (
              <div className="w-[45%] border-l flex flex-col bg-card min-w-0">
                <div className="h-12 border-b flex items-center gap-2 px-3 flex-shrink-0">
                  <Code2 className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-medium">Code Panel</span>
                  <Badge variant="secondary" className="text-[10px]">{allCodeBlocks.length} blocks</Badge>
                  <div className="flex-1" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCodePanelOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Tabs value={codePanelTab} onValueChange={(v) => setCodePanelTab(v as 'current' | 'all')} className="flex-1 flex flex-col min-h-0">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-3 h-9">
                    <TabsTrigger value="current" className="text-xs data-[state=active]:bg-muted">Current</TabsTrigger>
                    <TabsTrigger value="all" className="text-xs data-[state=active]:bg-muted">All Code ({allCodeBlocks.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="current" className="flex-1 min-h-0 mt-0">
                    {codePanelContent ? (
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 border-b">
                          <span className="font-mono">{codePanelContent.language}</span>
                          <CopyButton text={codePanelContent.code} />
                        </div>
                        <ScrollArea className="flex-1">
                          <SyntaxHighlighter style={oneDark} language={getLanguage(codePanelContent.language)} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.8125rem', lineHeight: '1.6', minHeight: '100%' }} showLineNumbers>
                            {codePanelContent.code}
                          </SyntaxHighlighter>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        <div className="text-center">
                          <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>Click &quot;View&quot; on any code block</p>
                          <p className="text-xs mt-1">to see it here side-by-side</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="all" className="flex-1 min-h-0 mt-0">
                    {allCodeBlocks.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        <div className="text-center"><Code2 className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No code blocks yet</p><p className="text-xs mt-1">Chat with AI to generate code</p></div>
                      </div>
                    ) : (
                      <ScrollArea className="h-full">
                        <div className="p-2 space-y-2">
                          {allCodeBlocks.map((block, i) => (
                            <div key={block.id} className="rounded-lg border overflow-hidden">
                              <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{block.language}</span>
                                  {block.filePath && <span className="text-zinc-500 truncate max-w-[150px]">{block.filePath}</span>}
                                  <span className="text-zinc-600">#{i + 1}</span>
                                </div>
                                <div className="flex gap-0.5">
                                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-zinc-400 hover:text-sky-400 hover:bg-zinc-700 gap-0.5"
                                    onClick={() => { setCodePanelContent({ code: block.code, language: block.language }); setCodePanelTab('current'); }}>
                                    <Eye className="h-2.5 w-2.5" />
                                  </Button>
                                  <CopyButton text={block.code} className="h-5 px-1.5 text-[9px]" />
                                </div>
                              </div>
                              <SyntaxHighlighter style={oneDark} language={getLanguage(block.language)} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.7rem', lineHeight: '1.4', maxHeight: '150px', overflow: 'auto' }}>
                                {block.code.length > 2000 ? block.code.slice(0, 2000) + '\n// ... (click View to see full code)' : block.code}
                              </SyntaxHighlighter>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>

        {/* ========== MOBILE CODE PANEL (Sheet) ========== */}
        {isMobile && codePanelOpen && (
          <Sheet open={codePanelOpen} onOpenChange={setCodePanelOpen}>
            <SheetContent side="bottom" className="h-[85vh] p-0">
              <SheetHeader className="p-3 border-b flex flex-row items-center gap-2 space-y-0">
                <Code2 className="h-4 w-4 text-sky-500" />
                <span className="text-sm font-medium flex-1">Code Panel</span>
                <Badge variant="secondary" className="text-[10px]">{allCodeBlocks.length} blocks</Badge>
              </SheetHeader>
              <Tabs value={codePanelTab} onValueChange={(v) => setCodePanelTab(v as 'current' | 'all')} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-3 h-9">
                  <TabsTrigger value="current" className="text-xs data-[state=active]:bg-muted">Current</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs data-[state=active]:bg-muted">All Code ({allCodeBlocks.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="current" className="flex-1 min-h-0 mt-0">
                  {codePanelContent ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 border-b">
                        <span className="font-mono">{codePanelContent.language}</span>
                        <CopyButton text={codePanelContent.code} />
                      </div>
                      <ScrollArea className="flex-1">
                        <SyntaxHighlighter style={oneDark} language={getLanguage(codePanelContent.language)} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.75rem', lineHeight: '1.5', minHeight: '100%' }} showLineNumbers>
                          {codePanelContent.code}
                        </SyntaxHighlighter>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm"><div className="text-center"><Eye className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>Click &quot;View&quot; on any code block</p></div></div>
                  )}
                </TabsContent>
                <TabsContent value="all" className="flex-1 min-h-0 mt-0">
                  {allCodeBlocks.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm"><div className="text-center"><Code2 className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No code blocks yet</p></div></div>
                  ) : (
                    <ScrollArea className="h-[65vh]">
                      <div className="p-2 space-y-2">
                        {allCodeBlocks.map((block, i) => (
                          <div key={block.id} className="rounded-lg border overflow-hidden">
                            <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{block.language}</span>
                                {block.filePath && <span className="text-zinc-500 truncate max-w-[120px]">{block.filePath}</span>}
                                <span className="text-zinc-600">#{i + 1}</span>
                              </div>
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-zinc-400 hover:text-sky-400 hover:bg-zinc-700 gap-0.5"
                                  onClick={() => { setCodePanelContent({ code: block.code, language: block.language }); setCodePanelTab('current'); }}>
                                  <Eye className="h-2.5 w-2.5" /> View
                                </Button>
                                <CopyButton text={block.code} className="h-5 px-1.5 text-[9px]" />
                              </div>
                            </div>
                            <SyntaxHighlighter style={oneDark} language={getLanguage(block.language)} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.7rem', lineHeight: '1.4', maxHeight: '150px', overflow: 'auto' }}>
                              {block.code.length > 1500 ? block.code.slice(0, 1500) + '\n// ... (tap View to see full code)' : block.code}
                            </SyntaxHighlighter>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        )}

        {/* ========== FILE VIEWER PANEL (desktop) ========== */}
        {fileViewerOpen && viewingFile && !isMobile && (
          <Dialog open={fileViewerOpen} onOpenChange={(open) => { if (!open) { setFileViewerOpen(false); setViewingFile(null); setSelectedFileId(null); } }}>
            <DialogContent className="max-w-[80vw] max-h-[85vh] p-0 gap-0">
              <DialogHeader className="p-3 border-b flex flex-row items-center gap-2 space-y-0">
                <FileText className="h-4 w-4 text-emerald-500" />
                <DialogTitle className="text-sm font-medium truncate flex-1">{viewingFile.filePath}</DialogTitle>
                <Badge variant="secondary" className="text-[10px]">{viewingFile.language}</Badge>
                <Badge variant="outline" className="text-[10px]">v{viewingFile.version}</Badge>
                <CopyButton text={viewingFile.content} />
              </DialogHeader>
              <ScrollArea className="h-[70vh]">
                <SyntaxHighlighter style={oneDark} language={getLanguage(viewingFile.language)} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.8125rem', lineHeight: '1.6', minHeight: '100%' }} showLineNumbers>
                  {viewingFile.content}
                </SyntaxHighlighter>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}

        {/* ========== FILE VIEWER (mobile - Sheet) ========== */}
        {isMobile && fileViewerOpen && viewingFile && (
          <Dialog open={fileViewerOpen} onOpenChange={(open) => { if (!open) { setFileViewerOpen(false); setViewingFile(null); setSelectedFileId(null); } }}>
            <DialogContent className="max-w-[95vw] max-h-[85vh] p-0 gap-0">
              <DialogHeader className="p-3 border-b flex flex-row items-center gap-2 space-y-0">
                <FileText className="h-4 w-4 text-emerald-500" />
                <DialogTitle className="text-sm font-medium truncate flex-1">{viewingFile.filePath}</DialogTitle>
                <Badge variant="secondary" className="text-[10px]">{viewingFile.language}</Badge>
                <CopyButton text={viewingFile.content} />
              </DialogHeader>
              <ScrollArea className="h-[70vh]">
                <SyntaxHighlighter style={oneDark} language={getLanguage(viewingFile.language)} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.75rem', lineHeight: '1.5', minHeight: '100%' }} showLineNumbers>
                  {viewingFile.content}
                </SyntaxHighlighter>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
