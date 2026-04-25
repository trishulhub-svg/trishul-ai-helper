'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAgentStore } from '@/store/agent-store';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Plus, FolderOpen, FileCode2, Send, Trash2, ChevronRight, ChevronDown,
  Copy, Check, Save, X, MessageSquare, Pencil, FolderPlus, FilePlus,
  Loader2, Sparkles, Eye, Shield, User, LogOut, KeyRound, ClipboardList,
  CheckCircle2, XCircle, Lock, Unlock, Briefcase, GraduationCap, Users,
  Play, Clock, Award, BarChart3, Settings, EyeOff, Timer, Video, Menu,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// ===================== TYPES =====================
interface Project {
  id: string; name: string; description: string; techStack: string;
  isLocked: boolean; createdAt: string; updatedAt: string;
  files?: CodeFile[]; conversations?: Conversation[];
  _count?: { files: number; conversations: number };
}
interface CodeFile {
  id: string; projectId: string; fileName: string; filePath: string;
  language: string; content: string; version: number; createdAt: string; updatedAt: string;
}
interface Conversation {
  id: string; projectId: string | null; title: string; mode: string;
  createdAt: string; updatedAt: string; messages?: Message[]; _count?: { messages: number };
}
interface Message {
  id: string; conversationId: string; role: string; content: string; createdAt: string;
}
interface DeleteRequest {
  id: string; type: string; targetId: string; targetName: string;
  requestedBy: string; reason: string; status: string; reviewedBy: string | null; createdAt: string;
}
interface Employee {
  id: string; employeeId: string; name: string; createdAt: string; updatedAt: string;
}
interface Training {
  id: string; title: string; category: string; difficulty: string;
  videoUrl: string; description: string; questions: string; createdBy: string;
  createdAt: string; updatedAt: string; _count?: { assignments: number };
}
interface TrainingAssignment {
  id: string; trainingId: string; employeeId: string; status: string;
  score: number | null; answers: string; startedAt: string | null;
  completedAt: string | null; createdAt: string; updatedAt: string;
  training?: Training; employee?: Employee;
}
interface QuizQuestion {
  question: string; options: { a: string; b: string; c: string; d: string }; correctAnswer: string;
}
interface ExtractedCodeBlock {
  id: string; language: string; code: string; filePath?: string; messageId: string;
}

// ===================== UTILS =====================
const langMap: Record<string, string> = {
  ts:'typescript',tsx:'tsx',js:'javascript',jsx:'jsx',py:'python',rs:'rust',
  go:'go',java:'java',rb:'ruby',php:'php',sql:'sql',css:'css',scss:'scss',
  html:'html',json:'json',yaml:'yaml',yml:'yaml',md:'markdown',sh:'bash',bash:'bash',
  dockerfile:'docker',prisma:'prisma',
};
function getLanguage(lang: string) { return langMap[lang?.toLowerCase()] || lang?.toLowerCase() || 'text'; }

function extractCodeBlocksFromMessages(msgs: Message[]): ExtractedCodeBlock[] {
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

function parseQuestions(json: string): QuizQuestion[] {
  try { return JSON.parse(json); } catch { return []; }
}

function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}

// ===================== COPY BUTTON =====================
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea'); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" className={`h-6 px-2 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-700 gap-1 ${className||''}`} onClick={handleCopy}>
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

// ===================== SAVE TO PROJECT BUTTON =====================
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
      const m = code.match(/\/\/\s*filepath:\s*(.+)/i) || code.match(/<!--\s*filepath:\s*(.+)\s*-->/i) || code.match(/#\s*filepath:\s*(.+)/i);
      if (m) { const d = m[1].trim(); setFilePath(d); setFileName(d.split('/').pop()||d); }
    }
  }, [showDialog, code, projectId]);

  if (!projectId) return null;
  const handleSave = async () => {
    if (!fileName.trim() || !filePath.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ fileName:fileName.trim(), filePath:filePath.trim(), language:language||'typescript', content:code }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error||'Failed'); }
      toast({ title:'File saved!', description:`${fileName} saved to project` });
      setShowDialog(false); setFileName(''); setFilePath(''); onSaved();
    } catch (err) { toast({ title:'Error', description: err instanceof Error?err.message:'Failed', variant:'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 gap-1" onClick={e=>{e.stopPropagation();setShowDialog(true);}}>
        <Save className="h-3 w-3" /> Save
      </Button>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Save Code to Project</DialogTitle><DialogDescription>Save as a file</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label className="mb-1.5 block">File Name</Label><Input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="page.tsx" /></div>
            <div><Label className="mb-1.5 block">File Path</Label><Input value={filePath} onChange={e=>setFilePath(e.target.value)} placeholder="src/app/page.tsx" /></div>
            <Button onClick={handleSave} disabled={saving||!fileName.trim()||!filePath.trim()} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================== CHAT MESSAGE =====================
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
              <ReactMarkdown components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  if (match) {
                    return (
                      <div className="relative group my-3 rounded-lg overflow-hidden border border-border">
                        <div className="flex items-center justify-between bg-zinc-800 dark:bg-zinc-900 px-2 sm:px-3 py-1.5 text-xs text-zinc-400">
                          <span className="font-mono text-[10px] sm:text-xs">{match[1]}</span>
                          <div className="flex gap-0.5">
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-zinc-400 hover:text-sky-400 hover:bg-zinc-700 gap-1" onClick={e=>{e.stopPropagation();onViewCode(codeString,match[1]);}}><Eye className="h-3 w-3" /> View</Button>
                            <SaveToProjectButton code={codeString} language={match[1]} projectId={projectId} onSaved={onFilesUpdated} />
                            <CopyButton text={codeString} />
                          </div>
                        </div>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                          <SyntaxHighlighter style={oneDark} language={getLanguage(match[1])} PreTag="div" customStyle={{margin:0,borderRadius:0,fontSize:'0.75rem',lineHeight:'1.5'}} {...props}>{codeString}</SyntaxHighlighter>
                        </div>
                      </div>
                    );
                  }
                  return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
                },
              }}>{message.content}</ReactMarkdown>
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

// ===================== QUIZ COMPONENT =====================
function QuizView({ questions, onComplete }: { questions: QuizQuestion[]; onComplete: (answers: Record<string,string>, score: number) => void }) {
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); handleSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleSubmit = (auto = false) => {
    if (submitted) return;
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correctAnswer) correct++; });
    const score = Math.round((correct / questions.length) * 100);
    if (!auto) onComplete(answers, score);
    else onComplete(answers, score);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (submitted) {
    let correct = 0;
    return (
      <div className="space-y-3">
        <div className="text-center p-4">
          <Award className="h-10 w-10 mx-auto mb-2 text-amber-500" />
          <h3 className="text-xl font-bold">Quiz Complete!</h3>
          {questions.forEach((q, i) => { if (answers[i] === q.correctAnswer) correct++; })}
          <p className="text-2xl font-bold mt-2">{Math.round((correct/questions.length)*100)}%</p>
          <p className="text-sm text-muted-foreground">{correct} of {questions.length} correct</p>
        </div>
        {questions.map((q, i) => (
          <div key={i} className={`p-3 rounded-lg border ${answers[i]===q.correctAnswer?'border-green-500/50 bg-green-500/5':'border-red-500/50 bg-red-500/5'}`}>
            <p className="font-medium text-sm mb-1">Q{i+1}: {q.question}</p>
            <p className="text-xs text-muted-foreground">Your answer: {q.options[answers[i] as keyof typeof q.options] || 'Not answered'}</p>
            {answers[i]!==q.correctAnswer && <p className="text-xs text-green-600">Correct: {q.options[q.correctAnswer as keyof typeof q.options]}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="gap-1"><Timer className="h-3 w-3" />{minutes}:{seconds.toString().padStart(2,'0')}</Badge>
        <Progress value={((600-timeLeft)/600)*100} className="w-32 h-2" />
      </div>
      {questions.map((q, i) => (
        <div key={i} className="p-3 rounded-lg border">
          <p className="font-medium text-sm mb-2">Q{i+1}: {q.question}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(q.options).map(([key, val]) => (
              <button key={key} onClick={()=>setAnswers(prev=>({...prev,[i]:key}))}
                className={`p-2 rounded-md text-xs text-left transition-colors border ${answers[i]===key?'bg-primary/10 border-primary text-primary':'hover:bg-muted border-border'}`}>
                <span className="font-semibold mr-1">{key.toUpperCase()}.</span> {val}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Button onClick={()=>handleSubmit()} className="w-full" disabled={Object.keys(answers).length<questions.length}>
        Submit Quiz ({Object.keys(answers).length}/{questions.length} answered)
      </Button>
    </div>
  );
}

// ===================== MAIN PAGE =====================
export default function Home() {
  const { selectedProjectId, selectedConversationId, sidebarOpen, fileViewerOpen,
    setSelectedProjectId, setSelectedConversationId, setSidebarOpen, setFileViewerOpen, setSelectedFileId } = useAgentStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectFiles, setProjectFiles] = useState<CodeFile[]>([]);
  const [directChats, setDirectChats] = useState<Conversation[]>([]);
  const [businessChats, setBusinessChats] = useState<Conversation[]>([]);
  const [selectedDirectChatId, setSelectedDirectChatId] = useState<string | null>(null);
  const [selectedBusinessChatId, setSelectedBusinessChatId] = useState<string | null>(null);

  // UI
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [viewingFile, setViewingFile] = useState<CodeFile | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [codePanelContent, setCodePanelContent] = useState<{code:string;language:string}|null>(null);
  const [codePanelTab, setCodePanelTab] = useState<'current'|'all'>('current');
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<'chat'|'training'|'dashboard'>('chat');

  // Dialog
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

  // Auth
  const [userRole, setUserRole] = useState<'admin'|'employee'|null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeDbId, setEmployeeDbId] = useState<string|null>(null);
  const [employeeLoginId, setEmployeeLoginId] = useState('');
  const [employeeLoginPass, setEmployeeLoginPass] = useState('');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSetupMode, setAdminSetupMode] = useState(false);
  const [adminSetupPassword, setAdminSetupPassword] = useState('');
  const [adminSetupEmail, setAdminSetupEmail] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // RBAC
  const [deleteRequests, setDeleteRequests] = useState<DeleteRequest[]>([]);
  const [projectLocks, setProjectLocks] = useState<Record<string,{lockedBy:string;lockedAt:string}>>({});
  const [showDeleteRequests, setShowDeleteRequests] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [lockedProjectId, setLockedProjectId] = useState<string|null>(null);
  const [deleteReasonDialog, setDeleteReasonDialog] = useState<{open:boolean;type:string;targetId:string;targetName:string}|null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Admin Dashboard
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState('users');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showNewEmployee, setShowNewEmployee] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPass, setNewEmpPass] = useState('');
  const [resetEmpId, setResetEmpId] = useState<string|null>(null);
  const [resetEmpPass, setResetEmpPass] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Training
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [employeeTrainings, setEmployeeTrainings] = useState<TrainingAssignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<TrainingAssignment[]>([]);
  const [showNewTraining, setShowNewTraining] = useState(false);
  const [newTrainingTitle, setNewTrainingTitle] = useState('');
  const [newTrainingCategory, setNewTrainingCategory] = useState('');
  const [newTrainingDifficulty, setNewTrainingDifficulty] = useState('beginner');
  const [newTrainingVideoUrl, setNewTrainingVideoUrl] = useState('');
  const [newTrainingDesc, setNewTrainingDesc] = useState('');
  const [newTrainingQuestions, setNewTrainingQuestions] = useState<QuizQuestion[]>([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [recommendedCategories, setRecommendedCategories] = useState<{name:string;description:string}[]>([]);
  const [showAssignTraining, setShowAssignTraining] = useState(false);
  const [assignTrainingId, setAssignTrainingId] = useState<string|null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [activeTraining, setActiveTraining] = useState<TrainingAssignment|null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const allCodeBlocks = extractCodeBlocksFromMessages(messages);

  useEffect(() => { setMounted(true); }, []);

  // Load role from localStorage
  useEffect(() => {
    if (!mounted) return;
    const r = localStorage.getItem('trishul_role');
    const n = localStorage.getItem('trishul_employee_name');
    const a = localStorage.getItem('trishul_admin_logged_in');
    const eid = localStorage.getItem('trishul_employee_db_id');
    if (r === 'admin' && a === 'true') { setUserRole('admin'); setAdminLoggedIn(true); setShowRoleSelect(false); }
    else if (r === 'employee' && n) { setUserRole('employee'); setEmployeeName(n); setEmployeeDbId(eid); setShowRoleSelect(false); }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    fetch('/api/admin/check').then(r=>r.json()).then(d=>{ if(!d.exists) setAdminSetupMode(true); }).catch(()=>{});
  }, [mounted]);

  const handleChatScroll = useCallback(() => {
    const el = chatScrollRef.current; if (!el) return;
    setUserScrolledUp(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
  }, []);

  useEffect(() => { if (!userScrolledUp) messagesEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, userScrolledUp]);

  const handleViewCode = useCallback((code:string,language:string) => {
    setCodePanelContent({code,language}); setCodePanelTab('current'); setCodePanelOpen(true);
  }, []);

  // ============ FETCHERS ============
  const fetchProjectLocks = useCallback(async () => {
    try { const r = await fetch('/api/locks'); if(r.ok){ const l=await r.json(); const m:Record<string,{lockedBy:string;lockedAt:string}>={}; l.forEach((x:{projectId:string;lockedBy:string;lockedAt:string})=>{m[x.projectId]={lockedBy:x.lockedBy,lockedAt:x.lockedAt};}); setProjectLocks(m); } } catch{}
  }, []);

  const fetchDeleteRequests = useCallback(async () => {
    if(userRole!=='admin') return;
    try { const r=await fetch('/api/delete-requests?status=pending'); if(r.ok) setDeleteRequests(await r.json()); } catch{}
  }, [userRole]);

  const fetchProjects = useCallback(async () => {
    try { const r=await fetch('/api/projects'); if(r.ok) setProjects(await r.json()); } catch{}
  }, []);

  const fetchDirectChats = useCallback(async () => {
    try { const r=await fetch('/api/direct-chats'); if(r.ok) setDirectChats(await r.json()); } catch{}
  }, []);

  const fetchBusinessChats = useCallback(async () => {
    try { const r=await fetch('/api/direct-chats'); if(r.ok){ const all:Conversation[]=await r.json(); setBusinessChats(all.filter(c=>c.mode==='business')); } } catch{}
  }, []);

  const fetchProjectDetails = useCallback(async () => {
    if(!selectedProjectId){setCurrentProject(null);setProjectFiles([]);return;}
    try { const r=await fetch(`/api/projects/${selectedProjectId}`); if(r.ok){const d=await r.json();setCurrentProject(d);setProjectFiles(d.files||[]);} } catch{}
  }, [selectedProjectId]);

  const fetchMessages = useCallback(async (convId?:string) => {
    const id=convId||selectedConversationId; if(!id){if(!selectedDirectChatId&&!selectedBusinessChatId)setMessages([]);return;}
    try { const r=await fetch(`/api/conversations/${id}`); if(r.ok){const d=await r.json();setCurrentConversation(d);setMessages(d.messages||[]);} } catch{}
  }, [selectedConversationId, selectedDirectChatId, selectedBusinessChatId]);

  const fetchEmployees = useCallback(async () => {
    try { const r=await fetch('/api/employees'); if(r.ok) setEmployees(await r.json()); } catch{}
  }, []);

  const fetchTrainings = useCallback(async () => {
    try { const r=await fetch('/api/trainings'); if(r.ok) setTrainings(await r.json()); } catch{}
  }, []);

  const fetchAllAssignments = useCallback(async () => {
    try { const r=await fetch('/api/trainings/assignments'); if(r.ok) setAllAssignments(await r.json()); } catch{}
  }, []);

  const fetchEmployeeTrainings = useCallback(async () => {
    if(!employeeDbId) return;
    try { const r=await fetch(`/api/trainings/employee/${employeeDbId}`); if(r.ok) setEmployeeTrainings(await r.json()); } catch{}
  }, [employeeDbId]);

  // Initial load
  useEffect(() => { if(userRole){fetchProjects();fetchDirectChats();fetchProjectLocks();if(userRole==='admin')fetchBusinessChats();} }, [fetchProjects,fetchDirectChats,fetchProjectLocks,fetchBusinessChats,userRole]);
  useEffect(() => { if(userRole==='admin'){fetchDeleteRequests();fetchEmployees();fetchTrainings();fetchAllAssignments();} }, [fetchDeleteRequests,fetchEmployees,fetchTrainings,fetchAllAssignments,userRole]);
  useEffect(() => { if(userRole==='employee'&&employeeDbId) fetchEmployeeTrainings(); }, [fetchEmployeeTrainings,userRole,employeeDbId]);
  useEffect(() => { fetchProjectDetails(); }, [fetchProjectDetails]);
  useEffect(() => {
    if(selectedBusinessChatId){ fetch(`/api/conversations/${selectedBusinessChatId}`).then(r=>r.ok?r.json():null).then(d=>{if(d){setCurrentConversation(d);setMessages(d.messages||[]);}}).catch(()=>{}); }
    else if(selectedDirectChatId){ fetch(`/api/conversations/${selectedDirectChatId}`).then(r=>r.ok?r.json():null).then(d=>{if(d){setCurrentConversation(d);setMessages(d.messages||[]);}}).catch(()=>{}); }
    else if(selectedConversationId) fetchMessages();
    else setMessages([]);
  }, [selectedConversationId, selectedDirectChatId, selectedBusinessChatId, fetchMessages]);
  useEffect(() => { setUserScrolledUp(false); }, [selectedConversationId, selectedDirectChatId, selectedBusinessChatId]);

  // Periodic refresh
  useEffect(() => {
    if(!userRole) return;
    const iv = setInterval(()=>{fetchProjectLocks();if(userRole==='admin')fetchDeleteRequests();},15000);
    return ()=>clearInterval(iv);
  }, [fetchProjectLocks,fetchDeleteRequests,userRole]);

  // ============ EMPLOYEE PROJECT LOCKING ============
  const handleEmployeeSelectProject = useCallback(async (projectId:string) => {
    if(userRole!=='employee') return;
    try {
      const r=await fetch(`/api/projects/${projectId}/lock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lockedBy:employeeName})});
      if(r.ok) setLockedProjectId(projectId);
      else if(r.status===409){const d=await r.json();toast({title:'Project Locked',description:d.error||'In use',variant:'destructive'});return false;}
      else{toast({title:'Error',description:'Failed to lock project',variant:'destructive'});return false;}
    } catch{toast({title:'Error',description:'Failed to lock',variant:'destructive'});return false;}
    return true;
  }, [userRole,employeeName,toast]);

  const wrappedSetSelectedProjectId = useCallback((id:string|null) => {
    if(userRole==='employee'&&id){
      const lockInfo=projectLocks[id];
      if(lockInfo&&lockInfo.lockedBy!==employeeName){toast({title:'Project Locked',description:`In use by ${lockInfo.lockedBy}`,variant:'destructive'});return;}
      if(!lockInfo){handleEmployeeSelectProject(id).then(ok=>{if(ok!==false)setSelectedProjectId(id);});return;}
      setSelectedProjectId(id);
    } else setSelectedProjectId(id);
  }, [userRole,projectLocks,employeeName,handleEmployeeSelectProject,setSelectedProjectId,toast]);

  const handleEndAndSave = useCallback(async () => {
    if(!lockedProjectId||userRole!=='employee') return;
    try { await fetch(`/api/projects/${lockedProjectId}/unlock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lockedBy:employeeName})});
      setLockedProjectId(null);setSelectedProjectId(null);setSelectedConversationId(null);setMessages([]);fetchProjectLocks();
      toast({title:'Project Saved',description:'Session ended.'});
    } catch{toast({title:'Error',description:'Failed to unlock',variant:'destructive'});}
  }, [lockedProjectId,userRole,employeeName,setSelectedProjectId,setSelectedConversationId,fetchProjectLocks,toast]);

  // ============ DELETE REQUESTS ============
  const submitDeleteRequest = useCallback(async (type:string,targetId:string,targetName:string,reason:string) => {
    try { const r=await fetch('/api/delete-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,targetId,targetName,requestedBy:employeeName,reason})});
      if(r.ok) toast({title:'Request Sent',description:'Sent to admin for approval'}); else toast({title:'Error',description:'Failed',variant:'destructive'});
    } catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
  }, [employeeName,toast]);

  // ============ CRUD ============
  const handleCreateProject = async () => {
    if(!newProjectName.trim()) return;
    try { const r=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newProjectName.trim(),description:newProjectDesc.trim(),techStack:newProjectTech.trim()})});
      if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'Failed');}
      const p=await r.json();toast({title:'Project created!'});setShowNewProject(false);setNewProjectName('');setNewProjectDesc('');setNewProjectTech('');
      wrappedSetSelectedProjectId(p.id);setSelectedDirectChatId(null);setSelectedBusinessChatId(null);
      setExpandedProjects(prev=>new Set(prev).add(p.id));fetchProjects();
    } catch(err){toast({title:'Error',description:err instanceof Error?err.message:'Failed',variant:'destructive'});}
  };

  const handleDeleteProject = async (id:string) => {
    if(userRole==='employee'){const p=projects.find(x=>x.id===id);setDeleteReasonDialog({open:true,type:'project',targetId:id,targetName:p?.name||'Project'});return;}
    try{const r=await fetch(`/api/projects/${id}`,{method:'DELETE'});if(!r.ok)throw new Error();if(selectedProjectId===id)setSelectedProjectId(null);fetchProjects();fetchProjectLocks();toast({title:'Project deleted'});}catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
  };

  const handleAddFile = async () => {
    if(!selectedProjectId||!newFileName.trim()||!newFilePath.trim()) return;
    try{const r=await fetch(`/api/projects/${selectedProjectId}/files`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileName:newFileName.trim(),filePath:newFilePath.trim(),language:newFileLanguage,content:newFileContent})});
      if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'Failed');}
      toast({title:'File added!'});setShowNewFile(false);setNewFileName('');setNewFilePath('');setNewFileLanguage('typescript');setNewFileContent('');fetchProjectDetails();
    }catch(err){toast({title:'Error',description:err instanceof Error?err.message:'Failed',variant:'destructive'});}
  };

  const handleDeleteFile = async (fileId:string) => {
    if(!selectedProjectId)return;if(userRole==='employee'){const f=projectFiles.find(x=>x.id===fileId);setDeleteReasonDialog({open:true,type:'file',targetId:fileId,targetName:f?.filePath||'File'});return;}
    try{const r=await fetch(`/api/projects/${selectedProjectId}/files/${fileId}`,{method:'DELETE'});if(!r.ok)throw new Error();if(viewingFile?.id===fileId){setViewingFile(null);setFileViewerOpen(false);}fetchProjectDetails();toast({title:'File deleted'});}catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
  };

  const handleAddCode = async () => {
    if(!selectedProjectId||!addCodeContent.trim()) return;
    const m=addCodeContent.match(/\/\/\s*filepath:\s*(.+)/i)||addCodeContent.match(/<!--\s*filepath:\s*(.+)\s*-->/i);
    const fp=m?m[1].trim():'untitled.txt';const fn=fp.split('/').pop()||'untitled.txt';const ext=fn.split('.').pop()||'txt';
    try{const r=await fetch(`/api/projects/${selectedProjectId}/files`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileName:fn,filePath:fp,language:ext,content:addCodeContent})});
      if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'Failed');}
      toast({title:'Code added!'});setShowAddCode(false);setAddCodeContent('');fetchProjectDetails();
    }catch(err){toast({title:'Error',description:err instanceof Error?err.message:'Failed',variant:'destructive'});}
  };

  const handleDeleteConversation = async (id:string) => {
    if(userRole==='employee'){const c=currentProject?.conversations?.find(x=>x.id===id);setDeleteReasonDialog({open:true,type:'conversation',targetId:id,targetName:c?.title||'Chat'});return;}
    try{const r=await fetch(`/api/conversations/${id}`,{method:'DELETE'});if(!r.ok)throw new Error();if(selectedConversationId===id){setSelectedConversationId(null);setMessages([]);}fetchProjectDetails();toast({title:'Chat deleted'});}catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
  };

  const handleDeleteDirectChat = async (id:string) => {
    if(userRole==='employee'){const c=directChats.find(x=>x.id===id);setDeleteReasonDialog({open:true,type:'directChat',targetId:id,targetName:c?.title||'Chat'});return;}
    try{const r=await fetch(`/api/conversations/${id}`,{method:'DELETE'});if(!r.ok)throw new Error();if(selectedDirectChatId===id){setSelectedDirectChatId(null);setMessages([]);}fetchDirectChats();toast({title:'Chat deleted'});}catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
  };

  const handleSubmitDeleteRequest = async () => {
    if(!deleteReasonDialog)return;await submitDeleteRequest(deleteReasonDialog.type,deleteReasonDialog.targetId,deleteReasonDialog.targetName,deleteReason);
    setDeleteReasonDialog(null);setDeleteReason('');
  };

  const handleApproveDeleteRequest = async (id:string) => {
    try{const r=await fetch(`/api/delete-requests/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'approve',reviewedBy:'admin'})});
      if(r.ok){toast({title:'Approved'});fetchDeleteRequests();fetchProjects();fetchDirectChats();fetchProjectLocks();if(selectedProjectId)fetchProjectDetails();}
      else toast({title:'Error',description:'Failed',variant:'destructive'});
    }catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
  };

  const handleRejectDeleteRequest = async (id:string) => {
    try{const r=await fetch(`/api/delete-requests/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reject',reviewedBy:'admin'})});
      if(r.ok){toast({title:'Rejected'});fetchDeleteRequests();}else toast({title:'Error',description:'Failed',variant:'destructive'});
    }catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
  };

  const handleChangePassword = async () => {
    try{const r=await fetch('/api/admin/change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword,newPassword})});
      if(r.ok){toast({title:'Password Changed'});setShowChangePassword(false);setCurrentPassword('');setNewPassword('');}
      else{const d=await r.json();toast({title:'Error',description:d.error||'Failed',variant:'destructive'});}
    }catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
  };

  // ============ AUTH ============
  const handleEmployeeLogin = async () => {
    if(!employeeLoginId.trim()||!employeeLoginPass.trim()){toast({title:'Required',description:'Enter Employee ID and Password',variant:'destructive'});return;}
    setRoleLoading(true);
    try{
      const r=await fetch('/api/employees/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employeeId:employeeLoginId.trim(),password:employeeLoginPass.trim()})});
      if(r.ok){const d=await r.json();localStorage.setItem('trishul_role','employee');localStorage.setItem('trishul_employee_name',d.name);localStorage.setItem('trishul_employee_db_id',d.id);
        setUserRole('employee');setEmployeeName(d.name);setEmployeeDbId(d.id);setShowRoleSelect(false);setEmployeeLoginId('');setEmployeeLoginPass('');
        toast({title:'Welcome!',description:`Hello, ${d.name}`});
      } else {toast({title:'Login Failed',description:'Invalid Employee ID or Password',variant:'destructive'});}
    }catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
    finally{setRoleLoading(false);}
  };

  const handleAdminLogin = async () => {
    if(!adminPassword.trim()){toast({title:'Required',description:'Enter admin password',variant:'destructive'});return;}
    setRoleLoading(true);
    try{
      const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:adminPassword})});
      if(r.ok){localStorage.setItem('trishul_role','admin');localStorage.setItem('trishul_admin_logged_in','true');setUserRole('admin');setAdminLoggedIn(true);setShowRoleSelect(false);setAdminPassword('');toast({title:'Welcome, Admin!'});}
      else{const d=await r.json();toast({title:'Login Failed',description:d.error||'Invalid password',variant:'destructive'});}
    }catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
    finally{setRoleLoading(false);}
  };

  const handleAdminSetup = async () => {
    if(!adminSetupPassword.trim()||!adminSetupEmail.trim()){toast({title:'Required',description:'Fill in all fields',variant:'destructive'});return;}
    setRoleLoading(true);
    try{
      const r=await fetch('/api/admin/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:adminSetupEmail.trim(),password:adminSetupPassword.trim()})});
      if(r.ok){localStorage.setItem('trishul_role','admin');localStorage.setItem('trishul_admin_logged_in','true');setUserRole('admin');setAdminLoggedIn(true);setShowRoleSelect(false);setAdminSetupMode(false);setAdminSetupPassword('');setAdminSetupEmail('');toast({title:'Admin Created!'});}
      else{const d=await r.json();toast({title:'Setup Failed',description:d.error||'Failed',variant:'destructive'});}
    }catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
    finally{setRoleLoading(false);}
  };

  const handleLogout = useCallback(() => {
    if(userRole==='employee'&&lockedProjectId){fetch(`/api/projects/${lockedProjectId}/unlock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lockedBy:employeeName})}).catch(()=>{});setLockedProjectId(null);}
    localStorage.removeItem('trishul_role');localStorage.removeItem('trishul_employee_name');localStorage.removeItem('trishul_admin_logged_in');localStorage.removeItem('trishul_employee_db_id');
    setUserRole(null);setEmployeeName('');setAdminLoggedIn(false);setShowRoleSelect(true);setAdminPassword('');
    setSelectedProjectId(null);setSelectedConversationId(null);setSelectedDirectChatId(null);setSelectedBusinessChatId(null);
    setMessages([]);setCurrentProject(null);setCurrentConversation(null);setActiveView('chat');
    toast({title:'Logged Out'});
  }, [userRole,lockedProjectId,employeeName,setSelectedProjectId,setSelectedConversationId,toast]);

  // ============ CHAT ============
  const handleSendMessage = async () => {
    if(!inputMessage.trim()||isLoading) return;
    const userMsg=inputMessage.trim();setInputMessage('');setIsLoading(true);setUserScrolledUp(false);
    const tempMsg:Message={id:'temp-'+Date.now(),conversationId:selectedBusinessChatId||selectedDirectChatId||selectedConversationId||'',role:'user',content:userMsg,createdAt:new Date().toISOString()};
    setMessages(prev=>[...prev,tempMsg]);
    try{
      const isBusiness=!!selectedBusinessChatId||activeView==='chat'&&userRole==='admin'&&!!selectedBusinessChatId;
      const endpoint=isBusiness?'/api/chat/business':'/api/chat';
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        projectId:selectedProjectId||undefined,
        conversationId:selectedBusinessChatId||selectedDirectChatId||selectedConversationId||undefined,
        message:userMsg,
      })});
      if(r.ok){
        const d=await r.json();const newConvId=d.conversationId;
        if(newConvId&&!selectedDirectChatId&&!selectedConversationId&&!selectedBusinessChatId){
          if(isBusiness)setSelectedBusinessChatId(newConvId);else if(!selectedProjectId)setSelectedDirectChatId(newConvId);else setSelectedConversationId(newConvId);
        }
        if(newConvId){try{const mr=await fetch(`/api/conversations/${newConvId}`);if(mr.ok){const md=await mr.json();setCurrentConversation(md);setMessages(md.messages||[]);}}catch{}}
        if(isBusiness)fetchBusinessChats();else if(!selectedProjectId)fetchDirectChats();else{fetchProjectDetails();fetchProjects();}
      }else{toast({title:'Error',description:'Failed',variant:'destructive'});setMessages(prev=>prev.filter(m=>m.id!==tempMsg.id));}
    }catch{toast({title:'Network Error',variant:'destructive'});setMessages(prev=>prev.filter(m=>m.id!==tempMsg.id));}
    finally{setIsLoading(false);}
  };

  const handleNewChat=()=>{setSelectedConversationId(null);setMessages([]);setCurrentConversation(null);setUserScrolledUp(false);inputRef.current?.focus();};
  const handleNewDirectChat=()=>{setSelectedDirectChatId(null);setSelectedProjectId(null);setSelectedConversationId(null);setSelectedBusinessChatId(null);setMessages([]);setCurrentConversation(null);setCodePanelOpen(false);setActiveView('chat');setUserScrolledUp(false);inputRef.current?.focus();};
  const handleNewBusinessChat=()=>{setSelectedBusinessChatId(null);setSelectedDirectChatId(null);setSelectedProjectId(null);setSelectedConversationId(null);setMessages([]);setCurrentConversation(null);setActiveView('chat');setUserScrolledUp(false);inputRef.current?.focus();};
  const toggleProjectExpand=(id:string)=>{setExpandedProjects(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});};
  const handleViewFile=(file:CodeFile)=>{setViewingFile(file);setFileViewerOpen(true);};
  const handleKeyDown=(e:React.KeyboardEvent)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSendMessage();}};

  // ============ ADMIN PROJECT TOGGLE LOCK ============
  const handleToggleProjectLock = async (projectId:string) => {
    try{const r=await fetch(`/api/projects/${projectId}/toggle-lock`,{method:'POST'});if(r.ok){fetchProjects();toast({title:'Project visibility updated'});}else toast({title:'Error',variant:'destructive'});}catch{toast({title:'Error',variant:'destructive'});}
  };

  // ============ EMPLOYEE MANAGEMENT ============
  const handleCreateEmployee = async () => {
    if(!newEmpName.trim()){toast({title:'Required',description:'Enter employee name',variant:'destructive'});return;}
    try{const r=await fetch('/api/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newEmpName.trim(),password:newEmpPass.trim()||'password123'})});
      if(r.ok){const d=await r.json();toast({title:'Employee Created',description:`ID: ${d.employeeId}`});setShowNewEmployee(false);setNewEmpName('');setNewEmpPass('');fetchEmployees();}
      else{const d=await r.json();toast({title:'Error',description:d.error||'Failed',variant:'destructive'});}
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  const handleDeleteEmployee = async (id:string) => {
    try{const r=await fetch(`/api/employees/${id}`,{method:'DELETE'});if(r.ok){fetchEmployees();fetchAllAssignments();toast({title:'Employee deleted'});}else toast({title:'Error',variant:'destructive'});}catch{toast({title:'Error',variant:'destructive'});}
  };

  const handleResetEmployeePassword = async () => {
    if(!resetEmpId||!resetEmpPass.trim()){toast({title:'Required',description:'Enter new password',variant:'destructive'});return;}
    try{const emp=employees.find(e=>e.id===resetEmpId);const eid=emp?.employeeId;if(!eid)return;
      const r=await fetch('/api/employees/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employeeId:eid,newPassword:resetEmpPass.trim()})});
      if(r.ok){toast({title:'Password Reset'});setShowResetPassword(false);setResetEmpId(null);setResetEmpPass('');}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // ============ TRAINING MANAGEMENT ============
  const handleGenerateQuiz = async () => {
    if(!newTrainingCategory.trim()){toast({title:'Required',description:'Enter a category first',variant:'destructive'});return;}
    setGeneratingQuiz(true);
    try{const r=await fetch('/api/trainings/generate-quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:newTrainingCategory.trim(),difficulty:newTrainingDifficulty})});
      if(r.ok){const d=await r.json();setNewTrainingQuestions(d.questions||[]);toast({title:'Quiz Generated',description:`${(d.questions||[]).length} questions`});}
      else toast({title:'Error',description:'Failed to generate quiz',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
    finally{setGeneratingQuiz(false);}
  };

  const handleRecommendCategories = async () => {
    setRecommending(true);
    try{const r=await fetch('/api/trainings/recommend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context:'technology and business training'})});
      if(r.ok){const d=await r.json();setRecommendedCategories(d.categories||[]);toast({title:'Categories Recommended'});}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
    finally{setRecommending(false);}
  };

  const handleCreateTraining = async () => {
    if(!newTrainingTitle.trim()||!newTrainingCategory.trim()){toast({title:'Required',description:'Title and category required',variant:'destructive'});return;}
    try{const r=await fetch('/api/trainings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      title:newTrainingTitle.trim(),category:newTrainingCategory.trim(),difficulty:newTrainingDifficulty,
      videoUrl:newTrainingVideoUrl.trim(),description:newTrainingDesc.trim(),questions:JSON.stringify(newTrainingQuestions),
    })});
      if(r.ok){toast({title:'Training Created'});setShowNewTraining(false);setNewTrainingTitle('');setNewTrainingCategory('');setNewTrainingDifficulty('beginner');setNewTrainingVideoUrl('');setNewTrainingDesc('');setNewTrainingQuestions([]);fetchTrainings();}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  const handleAssignTraining = async () => {
    if(!assignTrainingId||selectedEmployeeIds.size===0){toast({title:'Required',description:'Select employees',variant:'destructive'});return;}
    try{const r=await fetch('/api/trainings/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({trainingId:assignTrainingId,employeeIds:Array.from(selectedEmployeeIds)})});
      if(r.ok){toast({title:'Training Assigned'});setShowAssignTraining(false);setAssignTrainingId(null);setSelectedEmployeeIds(new Set());fetchAllAssignments();}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // Employee: Start training
  const handleStartTraining = async (assignment: TrainingAssignment) => {
    try{const r=await fetch(`/api/trainings/assignments/${assignment.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'in_progress'})});
      if(r.ok){setActiveTraining({...assignment,status:'in_progress',startedAt:new Date().toISOString()});setVideoWatched(false);setQuizMode(false);fetchEmployeeTrainings();}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // Employee: Complete quiz
  const handleCompleteQuiz = async (answers: Record<string,string>, score: number) => {
    if(!activeTraining) return;
    try{const r=await fetch(`/api/trainings/assignments/${activeTraining.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'finished',answers:JSON.stringify(answers),score})});
      if(r.ok){fetchEmployeeTrainings();setQuizMode(false);}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // ============ HELPERS ============
  const isAdmin = userRole==='admin';
  const visibleProjects = isAdmin ? projects : projects.filter(p=>!p.isLocked);

  // ==================== LOADING ====================
  if(!mounted){
    return(<div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center"><img src="/trishul-logo.png" alt="Trishul AI Helper" className="h-14 sm:h-16 w-auto object-contain mx-auto mb-4" /><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div></div>);
  }

  // ==================== LOGIN SCREEN ====================
  if(showRoleSelect){
    return(
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/trishul-logo.png" alt="Trishul AI Helper" className="h-14 sm:h-16 w-auto object-contain mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Trishul AI Helper</h1>
            <p className="text-sm text-muted-foreground">Your AI-powered Code Knowledge Base</p>
          </div>
          {adminSetupMode && (
            <Card className="mb-4"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5 text-amber-500"/>Setup Administrator</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Admin Email *</Label><Input value={adminSetupEmail} onChange={e=>setAdminSetupEmail(e.target.value)} placeholder="admin@example.com" type="email" /></div>
              <div><Label>Password *</Label><Input value={adminSetupPassword} onChange={e=>setAdminSetupPassword(e.target.value)} placeholder="Create a strong password" type="password" onKeyDown={e=>e.key==='Enter'&&handleAdminSetup()} /></div>
              <Button onClick={handleAdminSetup} disabled={roleLoading||!adminSetupEmail.trim()||!adminSetupPassword.trim()} className="w-full">
                {roleLoading?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:<Shield className="h-4 w-4 mr-2"/>}Create Admin Account
              </Button>
            </CardContent></Card>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="h-5 w-5 text-emerald-500"/>Employee</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Input value={employeeLoginId} onChange={e=>setEmployeeLoginId(e.target.value)} placeholder="Employee ID" onKeyDown={e=>e.key==='Enter'&&handleEmployeeLogin()} />
                <Input value={employeeLoginPass} onChange={e=>setEmployeeLoginPass(e.target.value)} placeholder="Password" type="password" onKeyDown={e=>e.key==='Enter'&&handleEmployeeLogin()} />
                <Button onClick={handleEmployeeLogin} disabled={roleLoading||!employeeLoginId.trim()||!employeeLoginPass.trim()} className="w-full" variant="default">
                  {roleLoading?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:<User className="h-4 w-4 mr-2"/>}Login
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5 text-amber-500"/>Administrator</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Input value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Admin Password" type="password" onKeyDown={e=>e.key==='Enter'&&handleAdminLogin()} />
                <Button onClick={handleAdminLogin} disabled={roleLoading||!adminPassword.trim()} className="w-full">
                  {roleLoading?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:<Shield className="h-4 w-4 mr-2"/>}Login as Admin
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==================== TRAINING VIEW (EMPLOYEE) ====================
  if(activeView==='training' && userRole==='employee'){
    // Active training with video/quiz
    if(activeTraining && activeTraining.training){
      const questions = parseQuestions(activeTraining.training.questions||'[]');
      return (
        <div className="min-h-screen flex flex-col bg-background">
          <header className="border-b p-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={()=>{setActiveTraining(null);setQuizMode(false);fetchEmployeeTrainings();}}><X className="h-4 w-4 mr-1"/>Back</Button>
            <h2 className="font-semibold text-sm truncate">{activeTraining.training.title}</h2>
            <Badge variant={activeTraining.status==='due'?'secondary':activeTraining.status==='in_progress'?'default':'outline'}>
              {activeTraining.status}
            </Badge>
          </header>
          <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
            {!quizMode ? (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-black aspect-video">
                  {activeTraining.training.videoUrl ? (
                    <iframe src={getYouTubeEmbedUrl(activeTraining.training.videoUrl)} className="w-full h-full" allowFullScreen allow="autoplay" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground"><Video className="h-12 w-12 mb-2 opacity-30" /><p className="text-sm">No video available</p></div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activeTraining.training.description}</p>
                {questions.length > 0 && (
                  <Button onClick={()=>setQuizMode(true)} disabled={!activeTraining.training.videoUrl&&!videoWatched} className="w-full">
                    <Play className="h-4 w-4 mr-2"/>Start Quiz ({questions.length} questions, 10 min)
                  </Button>
                )}
                {!activeTraining.training.videoUrl && questions.length>0 && (
                  <Button onClick={()=>setQuizMode(true)} className="w-full"><Play className="h-4 w-4 mr-2"/>Start Quiz</Button>
                )}
              </div>
            ) : (
              <QuizView questions={questions} onComplete={handleCompleteQuiz} />
            )}
          </div>
        </div>
      );
    }

    // Training list
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b p-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={()=>setActiveView('chat')}><X className="h-4 w-4 mr-1"/>Back</Button>
          <h2 className="font-semibold text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4"/>My Training</h2>
        </header>
        <ScrollArea className="flex-1">
          <div className="p-4 max-w-3xl mx-auto w-full space-y-3">
            {employeeTrainings.length===0?(
              <div className="text-center py-12 text-muted-foreground"><GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-30"/><p className="text-sm">No training assigned yet</p></div>
            ):employeeTrainings.map(a=>(
              <Card key={a.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={()=>handleStartTraining(a)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{a.training?.title||'Training'}</h3>
                    <Badge variant={a.status==='due'?'secondary':a.status==='in_progress'?'default':'outline'} className="text-[10px]">
                      {a.status==='due'?'Due':a.status==='in_progress'?'In Progress':'Finished'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{a.training?.category}</span>
                    <span>{a.training?.difficulty}</span>
                    {a.score!==null&&<span className="font-semibold text-foreground">Score: {a.score}%</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ==================== MAIN APP ====================
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-3 sm:p-4 border-b">
        <div className="flex items-center gap-2.5 mb-3">
          <img src="/trishul-logo.png" alt="Trishul AI Helper" className="h-7 sm:h-8 w-auto object-contain" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xs sm:text-sm font-bold">Trishul AI Helper</h1>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">AI Code Knowledge Base</p>
          </div>
          <Badge variant={isAdmin?'default':'secondary'} className="text-[9px] px-1.5 py-0 gap-1 flex-shrink-0">
            {isAdmin?<Shield className="h-2.5 w-2.5"/>:<User className="h-2.5 w-2.5"/>}
            {isAdmin?'Admin':employeeName}
          </Badge>
        </div>

        {isAdmin && (
          <div className="flex gap-1 mb-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={()=>setShowAdminDashboard(true)}><Settings className="h-3 w-3"/>Dashboard</Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 relative" onClick={()=>setShowDeleteRequests(true)}>
              <ClipboardList className="h-3 w-3"/>Requests
              {deleteRequests.length>0&&<Badge variant="destructive" className="h-4 min-w-4 px-1 text-[8px] absolute -top-1 -right-1">{deleteRequests.length}</Badge>}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={()=>setShowChangePassword(true)}><KeyRound className="h-3 w-3"/>Pass</Button>
            <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-destructive hover:text-destructive" onClick={handleLogout}><LogOut className="h-3 w-3"/></Button>
          </div>
        )}

        {!isAdmin && (
          <div className="space-y-1.5 mb-2">
            {lockedProjectId && (
              <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1.5 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10" onClick={handleEndAndSave}><Unlock className="h-3 w-3"/>End & Save</Button>
            )}
            <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1.5" onClick={()=>setActiveView('training')}><GraduationCap className="h-3 w-3"/>My Training</Button>
            <Button size="sm" variant="ghost" className="w-full h-7 text-[10px] gap-1 text-destructive hover:text-destructive" onClick={handleLogout}><LogOut className="h-3 w-3"/>Logout</Button>
          </div>
        )}

        <div className="space-y-1.5">
          <Button size="sm" className="w-full h-8 text-xs gap-1.5" variant="default" onClick={()=>{handleNewDirectChat();if(isMobile)setMobileSheetOpen(false);}}><Sparkles className="h-3.5 w-3.5"/>Direct AI Chat</Button>
          {isAdmin && <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-500/10" onClick={()=>{handleNewBusinessChat();if(isMobile)setMobileSheetOpen(false);}}><Briefcase className="h-3.5 w-3.5"/>Trishul B.A.</Button>}
          <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5" onClick={()=>setShowNewProject(true)}><FolderPlus className="h-3.5 w-3.5"/>New Project</Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Business Chats (Admin only) */}
          {isAdmin && businessChats.length>0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Business Agent</p>
              {businessChats.map(c=>(
                <div key={c.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group ${selectedBusinessChatId===c.id?'bg-primary/10 text-primary font-medium':'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={()=>{setSelectedBusinessChatId(c.id);setSelectedDirectChatId(null);setSelectedProjectId(null);setSelectedConversationId(null);if(isMobile)setMobileSheetOpen(false);}}>
                  <Briefcase className="h-3 w-3 flex-shrink-0 text-amber-500"/>
                  <span className="truncate flex-1">{c.title}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={e=>{e.stopPropagation();/* delete business chat */}}><X className="h-2.5 w-2.5"/></Button>
                </div>
              ))}
              <div className="border-t my-2"/>
            </div>
          )}

          {/* Direct Chats */}
          {directChats.filter(c=>c.mode!=='business').length>0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Direct Chats</p>
              {directChats.filter(c=>c.mode!=='business').map(c=>(
                <div key={c.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group ${selectedDirectChatId===c.id?'bg-primary/10 text-primary font-medium':'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={()=>{setSelectedDirectChatId(c.id);setSelectedProjectId(null);setSelectedConversationId(null);setSelectedBusinessChatId(null);if(isMobile)setMobileSheetOpen(false);}}>
                  <Sparkles className="h-3 w-3 flex-shrink-0"/>
                  <span className="truncate flex-1">{c.title}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={e=>{e.stopPropagation();handleDeleteDirectChat(c.id);}}><X className="h-2.5 w-2.5"/></Button>
                </div>
              ))}
              <div className="border-t my-2"/>
            </div>
          )}

          {/* Projects */}
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Projects</p>
          {visibleProjects.length===0?(
            <div className="text-center py-4 text-muted-foreground text-sm"><FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30"/><p className="text-xs">No projects yet</p></div>
          ):visibleProjects.map(project=>{
            const lockInfo=projectLocks[project.id];const isLocked=!!lockInfo;const isLockedByMe=lockInfo?.lockedBy===employeeName&&!isAdmin;const isLockedByOther=isLocked&&!isLockedByMe&&!isAdmin;
            return(
              <div key={project.id} className="mb-0.5">
                <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${selectedProjectId===project.id?'bg-primary/10 text-primary':'hover:bg-muted'} ${isLockedByOther?'opacity-70':''}`}
                  onClick={()=>{wrappedSetSelectedProjectId(project.id);setSelectedDirectChatId(null);setSelectedBusinessChatId(null);toggleProjectExpand(project.id);if(isMobile)setMobileSheetOpen(false);}}>
                  {expandedProjects.has(project.id)&&selectedProjectId===project.id?<ChevronDown className="h-3.5 w-3.5 flex-shrink-0"/>:<ChevronRight className="h-3.5 w-3.5 flex-shrink-0"/>}
                  <FolderOpen className="h-4 w-4 flex-shrink-0"/>
                  <span className="text-xs sm:text-sm font-medium truncate flex-1">{project.name}</span>
                  {/* Admin lock toggle */}
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className={`h-5 w-5 ${project.isLocked?'text-red-500':'text-muted-foreground'}`} onClick={e=>{e.stopPropagation();handleToggleProjectLock(project.id);}} title={project.isLocked?'Hidden from employees':'Visible to employees'}>
                      {project.isLocked?<EyeOff className="h-3 w-3"/>:<Eye className="h-3 w-3"/>}
                    </Button>
                  )}
                  {/* Live indicator */}
                  {isLocked && <Badge variant="outline" className="h-4 px-1 text-[8px] gap-0.5 border-green-500/50 text-green-600 flex-shrink-0 bg-green-500/10"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"/>{lockInfo.lockedBy}</Badge>}
                  {/* Admin locked badge */}
                  {project.isLocked && isAdmin && <Badge variant="outline" className="h-4 px-1 text-[8px] border-red-500/50 text-red-500 bg-red-500/10">Hidden</Badge>}
                  {/* Delete */}
                  {isAdmin?(
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}><Trash2 className="h-3 w-3 text-destructive"/></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Project?</AlertDialogTitle><AlertDialogDescription>Delete &quot;{project.name}&quot; and all its data.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteProject(project.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  ):(
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>{e.stopPropagation();handleDeleteProject(project.id);}}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                  )}
                </div>
                {expandedProjects.has(project.id)&&selectedProjectId===project.id&&(
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {currentProject?.conversations?.map(conv=>(
                      <div key={conv.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group ${selectedConversationId===conv.id?'bg-primary/10 text-primary font-medium':'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        onClick={()=>{setSelectedConversationId(conv.id);if(isMobile)setMobileSheetOpen(false);}}>
                        <MessageSquare className="h-3 w-3 flex-shrink-0"/><span className="truncate flex-1">{conv.title}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={e=>{e.stopPropagation();handleDeleteConversation(conv.id);}}><X className="h-2.5 w-2.5"/></Button>
                      </div>
                    ))}
                    <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors" onClick={handleNewChat}><Plus className="h-3 w-3"/>New Chat</button>
                    <div className="border-t my-1"/>
                    {projectFiles.map(file=>(
                      <div key={file.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group hover:bg-muted" onClick={()=>handleViewFile(file)}>
                        <FileCode2 className="h-3 w-3 flex-shrink-0 text-emerald-500"/><span className="truncate flex-1 text-muted-foreground group-hover:text-foreground">{file.filePath}</span>
                        <Badge variant="secondary" className="h-4 px-1 text-[9px]">v{file.version}</Badge>
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={e=>{e.stopPropagation();handleDeleteFile(file.id);}}><X className="h-2.5 w-2.5"/></Button>
                      </div>
                    ))}
                    <div className="flex gap-1 pt-1">
                      <button className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-muted flex-1 transition-colors border border-dashed border-border" onClick={()=>setShowNewFile(true)}><FilePlus className="h-3 w-3"/>Add File</button>
                      <button className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-muted flex-1 transition-colors border border-dashed border-border" onClick={()=>setShowAddCode(true)}><Pencil className="h-3 w-3"/>Paste Code</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-2 sm:p-3 border-t"><div className="text-[9px] sm:text-[10px] text-muted-foreground text-center">Trishul AI Helper • by Trishulhub</div></div>
    </div>
  );

  const chatHeader = selectedBusinessChatId ? 'Trishul B.A. — Business Agent' : selectedDirectChatId ? 'Direct AI Chat' : currentProject?.name || 'Trishul AI Helper';
  const hasActiveChat = !!(selectedBusinessChatId||selectedDirectChatId||selectedConversationId||messages.length>0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        {!isMobile && sidebarOpen && (
          <div className="w-64 lg:w-72 border-r flex-shrink-0 flex flex-col bg-card">{sidebarContent}</div>
        )}
        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent side="left" className="p-0 w-72"><SheetHeader className="sr-only"><SheetTitle>Menu</SheetTitle></SheetHeader>{sidebarContent}</SheetContent>
          </Sheet>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="border-b p-2 sm:p-3 flex items-center gap-2">
            {isMobile && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setMobileSheetOpen(true)}><Menu className="h-4 w-4"/></Button>}
            {!isMobile && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setSidebarOpen(!sidebarOpen)}><Menu className="h-4 w-4"/></Button>}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold truncate flex items-center gap-2">
                {selectedBusinessChatId && <Briefcase className="h-4 w-4 text-amber-500 flex-shrink-0"/>}
                {selectedDirectChatId && !selectedBusinessChatId && <Sparkles className="h-4 w-4 flex-shrink-0"/>}
                {chatHeader}
              </h2>
            </div>
            {lockedProjectId && !isAdmin && <Badge variant="outline" className="text-[9px] gap-1 border-emerald-500/50 text-emerald-600"><Lock className="h-2.5 w-2.5"/>Locked</Badge>}
            {codePanelOpen && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>setCodePanelOpen(false)}><X className="h-3.5 w-3.5"/></Button>}
          </div>

          {/* Messages */}
          <div ref={chatScrollRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {!hasActiveChat && !selectedProjectId && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <img src="/trishul-logo.png" alt="Trishul AI" className="h-16 sm:h-20 w-auto object-contain mx-auto mb-4" />
                  <h2 className="text-lg sm:text-xl font-bold mb-2">Welcome to Trishul AI Helper</h2>
                  <p className="text-sm text-muted-foreground mb-6">Start a Direct Chat or select a project to begin.</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={handleNewDirectChat} className="gap-2"><Sparkles className="h-4 w-4"/>Direct AI Chat</Button>
                    {isAdmin && <Button variant="outline" onClick={handleNewBusinessChat} className="gap-2 border-amber-500/50 text-amber-600"><Briefcase className="h-4 w-4"/>Trishul B.A.</Button>}
                    <Button variant="outline" onClick={()=>setShowNewProject(true)} className="gap-2"><FolderPlus className="h-4 w-4"/>New Project</Button>
                  </div>
                </div>
              </div>
            )}
            {!hasActiveChat && selectedProjectId && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center"><FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30"/><p className="text-sm text-muted-foreground mb-4">Select a chat or start a new one</p>
                  <Button onClick={handleNewChat} className="gap-2"><Plus className="h-4 w-4"/>New Chat</Button>
                </div>
              </div>
            )}
            {messages.map(msg=><ChatMessage key={msg.id} message={msg} projectId={selectedProjectId} onFilesUpdated={fetchProjectDetails} onViewCode={handleViewCode}/>)}
            {isLoading && <div className="flex gap-2 sm:gap-3 justify-start"><div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center bg-card"><img src="/trishul-logo.png" alt="AI" className="h-full w-full object-contain p-0.5"/></div><div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2.5 sm:px-4 sm:py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/></div></div>}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div className="border-t p-2 sm:p-3">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <textarea ref={inputRef} value={inputMessage} onChange={e=>setInputMessage(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={selectedBusinessChatId?"Ask Trishul B.A. about business strategy...":"Ask anything about code..."}
                className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px] max-h-[120px]"
                rows={1}/>
              <Button onClick={handleSendMessage} disabled={isLoading||!inputMessage.trim()} size="icon" className="h-10 w-10 flex-shrink-0"><Send className="h-4 w-4"/></Button>
            </div>
          </div>
        </div>

        {/* Code Panel */}
        {codePanelOpen && codePanelContent && (
          <div className={`${isMobile?'w-full':'w-96 lg:w-[28rem]'} border-l flex-shrink-0 flex flex-col bg-card`}>
            <div className="border-b p-2 flex items-center gap-2">
              <Tabs value={codePanelTab} onValueChange={v=>setCodePanelTab(v as 'current'|'all')} className="flex-1">
                <TabsList className="h-7"><TabsTrigger value="current" className="text-[10px] h-6">Current</TabsTrigger><TabsTrigger value="all" className="text-[10px] h-6">All Code ({allCodeBlocks.length})</TabsTrigger></TabsList>
              </Tabs>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>setCodePanelOpen(false)}><X className="h-3 w-3"/></Button>
            </div>
            <ScrollArea className="flex-1">
              {codePanelTab==='current'&&codePanelContent&&(
                <div className="p-2">
                  <div className="flex items-center justify-between bg-zinc-800 px-2 py-1.5 text-xs text-zinc-400 rounded-t-lg">
                    <span className="font-mono text-[10px]">{codePanelContent.language}</span><CopyButton text={codePanelContent.code}/>
                  </div>
                  <SyntaxHighlighter style={oneDark} language={getLanguage(codePanelContent.language)} PreTag="div" customStyle={{margin:0,borderRadius:'0 0 0.5rem 0.5rem',fontSize:'0.7rem',lineHeight:'1.5'}}>{codePanelContent.code}</SyntaxHighlighter>
                </div>
              )}
              {codePanelTab==='all'&&allCodeBlocks.map(block=>(
                <div key={block.id} className="p-2 border-b last:border-b-0">
                  <div className="flex items-center justify-between bg-zinc-800 px-2 py-1.5 text-xs text-zinc-400 rounded-t-lg">
                    <span className="font-mono text-[10px]">{block.language}{block.filePath?` — ${block.filePath}`:''}</span><CopyButton text={block.code}/>
                  </div>
                  <SyntaxHighlighter style={oneDark} language={getLanguage(block.language)} PreTag="div" customStyle={{margin:0,borderRadius:'0 0 0.5rem 0.5rem',fontSize:'0.7rem',lineHeight:'1.5'}}>{block.code}</SyntaxHighlighter>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* ==================== DIALOGS ==================== */}

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={v=>{setShowNewProject(v);if(!v){setNewProjectName('');setNewProjectDesc('');setNewProjectTech('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Create New Project</DialogTitle><DialogDescription>Add a new project to your workspace</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} placeholder="My Project" autoFocus onKeyDown={e=>e.key==='Enter'&&handleCreateProject()}/></div>
            <div><Label>Description</Label><Textarea value={newProjectDesc} onChange={e=>setNewProjectDesc(e.target.value)} placeholder="What is this project about?" rows={2}/></div>
            <div><Label>Tech Stack</Label><Input value={newProjectTech} onChange={e=>setNewProjectTech(e.target.value)} placeholder="React, TypeScript, Node.js"/></div>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="w-full"><FolderPlus className="h-4 w-4 mr-2"/>Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add File Dialog */}
      <Dialog open={showNewFile} onOpenChange={v=>{setShowNewFile(v);if(!v){setNewFileName('');setNewFilePath('');setNewFileLanguage('typescript');setNewFileContent('');}}}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Add Code File</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>File Name *</Label><Input value={newFileName} onChange={e=>setNewFileName(e.target.value)} placeholder="page.tsx" autoFocus/></div>
              <div><Label>File Path *</Label><Input value={newFilePath} onChange={e=>setNewFilePath(e.target.value)} placeholder="src/app/page.tsx"/></div>
            </div>
            <div><Label>Language</Label><Input value={newFileLanguage} onChange={e=>setNewFileLanguage(e.target.value)} placeholder="typescript"/></div>
            <div><Label>Code Content *</Label><Textarea value={newFileContent} onChange={e=>setNewFileContent(e.target.value)} placeholder="Paste code..." rows={12} className="font-mono text-xs"/></div>
            <Button onClick={handleAddFile} disabled={!newFileName.trim()||!newFilePath.trim()} className="w-full"><FilePlus className="h-4 w-4 mr-2"/>Add File</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paste Code Dialog */}
      <Dialog open={showAddCode} onOpenChange={v=>{setShowAddCode(v);if(!v)setAddCodeContent('');}}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Paste Code</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Add <code className="bg-muted px-1 rounded">{`// filepath: src/app/page.tsx`}</code> at top for auto-detection.</p>
            <Textarea value={addCodeContent} onChange={e=>setAddCodeContent(e.target.value)} placeholder={`// filepath: src/app/page.tsx\n\nexport default function Page() {\n  return <div>Hello</div>;\n}`} rows={16} className="font-mono text-xs" autoFocus/>
            <Button onClick={handleAddCode} disabled={!addCodeContent.trim()} className="w-full"><Save className="h-4 w-4 mr-2"/>Save Code</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      <Dialog open={fileViewerOpen} onOpenChange={v=>{setFileViewerOpen(v);if(!v)setViewingFile(null);}}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle className="flex items-center gap-2"><FileCode2 className="h-4 w-4 text-emerald-500"/>{viewingFile?.filePath||'File'}</DialogTitle></DialogHeader>
          {viewingFile && <div className="rounded-lg overflow-hidden border"><SyntaxHighlighter style={oneDark} language={getLanguage(viewingFile.language)} PreTag="div" customStyle={{margin:0,fontSize:'0.75rem',lineHeight:'1.5',maxHeight:'60vh'}}>{viewingFile.content}</SyntaxHighlighter></div>}
        </DialogContent>
      </Dialog>

      {/* Delete Reason Dialog (Employee) */}
      <Dialog open={!!deleteReasonDialog} onOpenChange={v=>{if(!v){setDeleteReasonDialog(null);setDeleteReason('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Request Deletion</DialogTitle><DialogDescription>Submit a request to delete &quot;{deleteReasonDialog?.targetName}&quot;</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Reason *</Label><Textarea value={deleteReason} onChange={e=>setDeleteReason(e.target.value)} placeholder="Why do you want to delete this?" rows={3}/></div>
            <Button onClick={handleSubmitDeleteRequest} disabled={!deleteReason.trim()} className="w-full">Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Requests Dialog (Admin) */}
      <Dialog open={showDeleteRequests} onOpenChange={setShowDeleteRequests}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5"/>Delete Requests</DialogTitle></DialogHeader>
          {deleteRequests.length===0?<p className="text-sm text-muted-foreground py-4 text-center">No pending requests</p>:
          <div className="space-y-3">{deleteRequests.map(r=>(
            <div key={r.id} className="p-3 rounded-lg border space-y-2">
              <div className="flex items-center justify-between"><span className="font-medium text-sm">{r.targetName}</span><Badge variant="outline" className="text-[10px]">{r.type}</Badge></div>
              <p className="text-xs text-muted-foreground">By: {r.requestedBy} • {r.reason}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={()=>handleApproveDeleteRequest(r.id)}><CheckCircle2 className="h-3 w-3"/>Approve</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>handleRejectDeleteRequest(r.id)}><XCircle className="h-3 w-3"/>Reject</Button>
              </div>
            </div>
          ))}</div>}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={v=>{setShowChangePassword(v);if(!v){setCurrentPassword('');setNewPassword('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/>Change Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Current Password</Label><Input value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} type="password"/></div>
            <div><Label>New Password</Label><Input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password"/></div>
            <Button onClick={handleChangePassword} disabled={!currentPassword.trim()||!newPassword.trim()} className="w-full">Change Password</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== ADMIN DASHBOARD ==================== */}
      <Dialog open={showAdminDashboard} onOpenChange={setShowAdminDashboard}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-4 pb-0"><DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/>Admin Dashboard</DialogTitle></DialogHeader>
          <Tabs value={adminTab} onValueChange={setAdminTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-4 border-b"><TabsList className="h-9"><TabsTrigger value="users" className="text-xs gap-1"><Users className="h-3 w-3"/>Users</TabsTrigger><TabsTrigger value="trainings" className="text-xs gap-1"><GraduationCap className="h-3 w-3"/>Trainings</TabsTrigger><TabsTrigger value="assignments" className="text-xs gap-1"><BarChart3 className="h-3 w-3"/>Assignments</TabsTrigger></TabsList></div>
            <ScrollArea className="flex-1 p-4">
              {/* USERS TAB */}
              <TabsContent value="users" className="mt-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Employees ({employees.length})</h3>
                  <Button size="sm" className="gap-1 text-xs" onClick={()=>setShowNewEmployee(true)}><Plus className="h-3 w-3"/>Add Employee</Button>
                </div>
                {employees.length===0?<p className="text-sm text-muted-foreground text-center py-4">No employees yet</p>:
                <div className="space-y-2">{employees.map(emp=>(
                  <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div><p className="font-medium text-sm">{emp.name}</p><p className="text-xs text-muted-foreground">ID: {emp.employeeId}</p></div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={()=>{setResetEmpId(emp.id);setShowResetPassword(true);}}><KeyRound className="h-3 w-3"/>Reset Pass</Button>
                      <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {emp.name}?</AlertDialogTitle><AlertDialogDescription>This will remove the employee and all their training assignments.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteEmployee(emp.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}</div>}
              </TabsContent>

              {/* TRAININGS TAB */}
              <TabsContent value="trainings" className="mt-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Trainings ({trainings.length})</h3>
                  <Button size="sm" className="gap-1 text-xs" onClick={()=>setShowNewTraining(true)}><Plus className="h-3 w-3"/>New Training</Button>
                </div>
                {trainings.length===0?<p className="text-sm text-muted-foreground text-center py-4">No trainings yet</p>:
                <div className="space-y-2">{trainings.map(t=>(
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div><p className="font-medium text-sm">{t.title}</p><div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{t.category}</span><Badge variant="outline" className="text-[9px]">{t.difficulty}</Badge><span>{parseQuestions(t.questions||'[]').length} questions</span></div></div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={()=>{setAssignTrainingId(t.id);setSelectedEmployeeIds(new Set());setShowAssignTraining(true);}}><Users className="h-3 w-3"/>Assign</Button>
                      <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete training?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async()=>{await fetch(`/api/trainings/${t.id}`,{method:'DELETE'});fetchTrainings();fetchAllAssignments();toast({title:'Deleted'});}}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}</div>}
              </TabsContent>

              {/* ASSIGNMENTS TAB */}
              <TabsContent value="assignments" className="mt-0">
                <h3 className="font-semibold text-sm mb-3">All Assignments</h3>
                {allAssignments.length===0?<p className="text-sm text-muted-foreground text-center py-4">No assignments yet</p>:
                <div className="space-y-2">{allAssignments.map(a=>(
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div><p className="font-medium text-sm">{a.training?.title||'Training'}</p><p className="text-xs text-muted-foreground">Employee: {a.employee?.name||a.employeeId}</p></div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.status==='due'?'secondary':a.status==='in_progress'?'default':'outline'} className="text-[10px]">{a.status}</Badge>
                      {a.score!==null&&<span className="text-xs font-semibold">{a.score}%</span>}
                    </div>
                  </div>
                ))}</div>}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* New Employee Dialog */}
      <Dialog open={showNewEmployee} onOpenChange={v=>{setShowNewEmployee(v);if(!v){setNewEmpName('');setNewEmpPass('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Create Employee</DialogTitle><DialogDescription>Add a new employee with login credentials</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name *</Label><Input value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} placeholder="John Doe" autoFocus onKeyDown={e=>e.key==='Enter'&&handleCreateEmployee()}/></div>
            <div><Label>Initial Password</Label><Input value={newEmpPass} onChange={e=>setNewEmpPass(e.target.value)} placeholder="Defaults to password123" type="password"/></div>
            <Button onClick={handleCreateEmployee} disabled={!newEmpName.trim()} className="w-full"><Plus className="h-4 w-4 mr-2"/>Create Employee</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Employee Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={v=>{setShowResetPassword(v);if(!v){setResetEmpId(null);setResetEmpPass('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Reset Employee Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Employee: {employees.find(e=>e.id===resetEmpId)?.name}</p>
            <div><Label>New Password *</Label><Input value={resetEmpPass} onChange={e=>setResetEmpPass(e.target.value)} placeholder="Enter new password" type="password"/></div>
            <Button onClick={handleResetEmployeePassword} disabled={!resetEmpPass.trim()} className="w-full">Reset Password</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Training Dialog */}
      <Dialog open={showNewTraining} onOpenChange={v=>{setShowNewTraining(v);if(!v){setNewTrainingTitle('');setNewTrainingCategory('');setNewTrainingDifficulty('beginner');setNewTrainingVideoUrl('');setNewTrainingDesc('');setNewTrainingQuestions([]);}}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create Training</DialogTitle><DialogDescription>Set up a new training module with video and quiz</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={newTrainingTitle} onChange={e=>setNewTrainingTitle(e.target.value)} placeholder="PHP Fundamentals" autoFocus/></div>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><Label>Category *</Label><Input value={newTrainingCategory} onChange={e=>setNewTrainingCategory(e.target.value)} placeholder="PHP, HTML, Public Health..."/></div>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1 mb-0.5" onClick={handleRecommendCategories} disabled={recommending}>{recommending?<Loader2 className="h-3 w-3 animate-spin"/>:<Lightbulb className="h-3 w-3"/>}AI Suggest</Button>
            </div>
            {recommendedCategories.length>0 && (
              <div className="flex flex-wrap gap-1.5">{recommendedCategories.map((c,i)=>(
                <Badge key={i} variant="outline" className="cursor-pointer hover:bg-primary/10 text-[10px]" onClick={()=>setNewTrainingCategory(c.name)}>{c.name}</Badge>
              ))}</div>
            )}
            <div><Label>Difficulty</Label><Select value={newTrainingDifficulty} onValueChange={v=>setNewTrainingDifficulty(v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div>
            <div><Label>Video URL (YouTube)</Label><Input value={newTrainingVideoUrl} onChange={e=>setNewTrainingVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."/></div>
            <div><Label>Description</Label><Textarea value={newTrainingDesc} onChange={e=>setNewTrainingDesc(e.target.value)} placeholder="Training description..." rows={2}/></div>
            <Separator/>
            <div className="flex items-center justify-between"><Label className="text-sm font-semibold">Quiz Questions ({newTrainingQuestions.length})</Label>
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleGenerateQuiz} disabled={generatingQuiz||!newTrainingCategory.trim()}>
                {generatingQuiz?<Loader2 className="h-3 w-3 animate-spin"/>:<Sparkles className="h-3 w-3"/>}AI Generate Quiz
              </Button>
            </div>
            {newTrainingQuestions.length>0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">{newTrainingQuestions.map((q,i)=>(
                <div key={i} className="p-2 rounded-lg border text-xs"><p className="font-medium">Q{i+1}: {q.question}</p><p className="text-muted-foreground">A: {q.options.a} | B: {q.options.b} | C: {q.options.c} | D: {q.options.d}</p></div>
              ))}</div>
            )}
            <Button onClick={handleCreateTraining} disabled={!newTrainingTitle.trim()||!newTrainingCategory.trim()} className="w-full"><GraduationCap className="h-4 w-4 mr-2"/>Create Training</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Training Dialog */}
      <Dialog open={showAssignTraining} onOpenChange={v=>{setShowAssignTraining(v);if(!v){setAssignTrainingId(null);setSelectedEmployeeIds(new Set());}}}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Assign Training</DialogTitle><DialogDescription>Select employees to assign this training to</DialogDescription></DialogHeader>
          <div className="space-y-3">
            {employees.length===0?<p className="text-sm text-muted-foreground">No employees to assign to</p>:
            <div className="space-y-2">{employees.map(emp=>(
              <div key={emp.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${selectedEmployeeIds.has(emp.id)?'bg-primary/10 border-primary':'hover:bg-muted'}`}
                onClick={()=>setSelectedEmployeeIds(prev=>{const n=new Set(prev);if(n.has(emp.id))n.delete(emp.id);else n.add(emp.id);return n;})}>
                <div className={`h-4 w-4 rounded border ${selectedEmployeeIds.has(emp.id)?'bg-primary border-primary':'border-border'} flex items-center justify-center`}>
                  {selectedEmployeeIds.has(emp.id)&&<Check className="h-3 w-3 text-primary-foreground"/>}
                </div>
                <span className="text-sm">{emp.name}</span><span className="text-xs text-muted-foreground ml-auto">{emp.employeeId}</span>
              </div>
            ))}</div>}
            <Button onClick={handleAssignTraining} disabled={selectedEmployeeIds.size===0} className="w-full"><Users className="h-4 w-4 mr-2"/>Assign to {selectedEmployeeIds.size} Employee{selectedEmployeeIds.size!==1?'s':''}</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
