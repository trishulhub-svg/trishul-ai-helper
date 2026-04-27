'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAgentStore } from '@/store/agent-store';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import { Project, CodeFile, Conversation, Message, MessageAttachment, DeleteRequest, Employee, Training, TrainingAssignment, QuizQuestion, ExtractedCodeBlock } from '@/components/app/types';
import { extractCodeBlocksFromMessages } from '@/components/app/utils';

// Lazy-loaded components
const LoginScreen = dynamic(() => import('@/components/app/login-screen').then(m => ({ default: m.LoginScreen })), { ssr: false });
const TrainingView = dynamic(() => import('@/components/app/training-view').then(m => ({ default: m.TrainingView })), { ssr: false });
const AdminDashboard = dynamic(() => import('@/components/app/admin-dashboard').then(m => ({ default: m.AdminDashboard })), { ssr: false });
const Sidebar = dynamic(() => import('@/components/app/sidebar').then(m => ({ default: m.Sidebar })));
const ChatArea = dynamic(() => import('@/components/app/chat-area').then(m => ({ default: m.ChatArea })));
const Dialogs = dynamic(() => import('@/components/app/dialogs').then(m => ({ default: m.Dialogs })));
const CodePanel = dynamic(() => import('@/components/app/code-panel').then(m => ({ default: m.CodePanel })));

export default function MainApp() {
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
  const [chatInputClearSignal, setChatInputClearSignal] = useState(0);
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
  const [chatMode, setChatMode] = useState<'none'|'direct'|'business'|'project'>('none');
  const [directChatLocks, setDirectChatLocks] = useState<Record<string,{lockedBy:string;lockedAt:string}>>({});
  const [lockedDirectChatId, setLockedDirectChatId] = useState<string|null>(null);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editingType, setEditingType] = useState<'project'|'chat'|null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminId, setAdminId] = useState('');
  const [showBulkHide, setShowBulkHide] = useState(false);
  const [bulkHideType, setBulkHideType] = useState<'direct_chats'|'projects'>('direct_chats');
  const [bulkHideSelection, setBulkHideSelection] = useState<Set<string>>(new Set());
  const [showAdminResetPassword, setShowAdminResetPassword] = useState(false);
  const [adminResetOtp, setAdminResetOtp] = useState('');
  const [adminResetNewPass, setAdminResetNewPass] = useState('');
  const [adminResetStep, setAdminResetStep] = useState<'request'|'verify'>('request');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
  const [adminNewEmail, setAdminNewEmail] = useState('');
  const [adminEmailPassword, setAdminEmailPassword] = useState('');
  const [newTrainingDueDate, setNewTrainingDueDate] = useState('');

  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);

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

  // Attachments
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputValueRef = useRef('');
  const isLoadingRef = useRef(false);
  const allCodeBlocks = extractCodeBlocksFromMessages(messages);

  useEffect(() => { setMounted(true); }, []);

  // Load role from localStorage
  useEffect(() => {
    if (!mounted) return;
    const r = localStorage.getItem('trishul_role');
    const n = localStorage.getItem('trishul_employee_name');
    const a = localStorage.getItem('trishul_admin_logged_in');
    const eid = localStorage.getItem('trishul_employee_db_id');
    if (r === 'admin' && a === 'true') { setUserRole('admin'); setAdminLoggedIn(true); setShowRoleSelect(false); const em=localStorage.getItem('trishul_admin_email'); const aid=localStorage.getItem('trishul_admin_id'); if(em) setAdminEmail(em); if(aid) setAdminId(aid); }
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
    try { const r = await fetch('/api/locks?includeConversations=true'); if(r.ok){ const l=await r.json(); const pm:Record<string,{lockedBy:string;lockedAt:string}>={}; const cm:Record<string,{lockedBy:string;lockedAt:string}>={}; l.forEach((x:{projectId?:string;conversationId?:string;lockedBy:string;lockedAt:string})=>{if(x.projectId)pm[x.projectId]={lockedBy:x.lockedBy,lockedAt:x.lockedAt};if(x.conversationId)cm[x.conversationId]={lockedBy:x.lockedBy,lockedAt:x.lockedAt};}); setProjectLocks(pm); setDirectChatLocks(cm); } } catch{}
  }, []);

  const fetchDeleteRequests = useCallback(async () => {
    if(userRole!=='admin') return;
    try { const r=await fetch('/api/delete-requests?status=pending'); if(r.ok) setDeleteRequests(await r.json()); } catch{}
  }, [userRole]);

  const fetchProjects = useCallback(async () => {
    try { const r=await fetch('/api/projects'); if(r.ok) setProjects(await r.json()); } catch{}
  }, []);

  const fetchDirectChats = useCallback(async () => {
    try { const r=await fetch('/api/direct-chats?mode=direct'); if(r.ok) setDirectChats(await r.json()); } catch{}
  }, []);

  const fetchBusinessChats = useCallback(async () => {
    try { const r=await fetch('/api/direct-chats?mode=business'); if(r.ok){ setBusinessChats(await r.json()); } } catch{}
  }, []);

  const fetchProjectDetails = useCallback(async () => {
    if(!selectedProjectId){setCurrentProject(null);setProjectFiles([]);return;}
    try { const r=await fetch(`/api/projects/${selectedProjectId}`); if(r.ok){const d=await r.json();setCurrentProject(d);setProjectFiles(d.files||[]);} } catch{}
  }, [selectedProjectId]);

  const parseMessagesWithAttachments = (rawMessages: any[]): Message[] => {
    return (rawMessages || []).map((m: any) => ({
      ...m,
      attachments: typeof m.attachments === 'string' ? (()=>{try{return JSON.parse(m.attachments)}catch{return[]}})() : (m.attachments || []),
    }));
  };

  const fetchMessages = useCallback(async (convId?:string) => {
    const id=convId||selectedConversationId; if(!id){if(!selectedDirectChatId&&!selectedBusinessChatId)setMessages([]);return;}
    try { const r=await fetch(`/api/conversations/${id}`); if(r.ok){const d=await r.json();setCurrentConversation(d);setMessages(parseMessagesWithAttachments(d.messages||[]));} } catch{}
  }, [selectedConversationId, selectedDirectChatId, selectedBusinessChatId]);

  const fetchAuditLogs = useCallback(async () => {
    try{const r=await fetch('/api/audit-logs');if(r.ok){const d=await r.json();setAuditLogs(d.logs||[]);}}catch{}
  }, []);

  const fetchSmtpSettings = useCallback(async () => {
    try{const r=await fetch('/api/admin/smtp');if(r.ok){const d=await r.json();setSmtpHost(d.smtpHost||'');setSmtpPort(d.smtpPort||'587');setSmtpUser(d.smtpUser||'');setSmtpFrom(d.smtpFrom||'');setSmtpConfigured(d.smtpConfigured||false);}}catch{}
  }, []);

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
    try { const r=await fetch(`/api/trainings/employee/${employeeDbId}`); if(r.ok){const d=await r.json(); setEmployeeTrainings(d.assignments||[]);} } catch{}
  }, [employeeDbId]);

  // Initial load
  useEffect(() => { if(userRole){fetchProjects();fetchDirectChats();fetchProjectLocks();if(userRole==='admin')fetchBusinessChats();} }, [fetchProjects,fetchDirectChats,fetchProjectLocks,fetchBusinessChats,userRole]);
  useEffect(() => { if(userRole==='admin'){fetchDeleteRequests();fetchEmployees();fetchTrainings();fetchAllAssignments();fetchAuditLogs();fetchSmtpSettings();} }, [fetchDeleteRequests,fetchEmployees,fetchTrainings,fetchAllAssignments,fetchAuditLogs,fetchSmtpSettings,userRole]);
  useEffect(() => { if(userRole==='employee'&&employeeDbId) fetchEmployeeTrainings(); }, [fetchEmployeeTrainings,userRole,employeeDbId]);
  useEffect(() => { fetchProjectDetails(); }, [fetchProjectDetails]);
  useEffect(() => {
    if(selectedBusinessChatId){ fetch(`/api/conversations/${selectedBusinessChatId}`).then(r=>r.ok?r.json():null).then(d=>{if(d){setCurrentConversation(d);setMessages(parseMessagesWithAttachments(d.messages||[]));}}).catch(()=>{}); }
    else if(selectedDirectChatId){ fetch(`/api/conversations/${selectedDirectChatId}`).then(r=>r.ok?r.json():null).then(d=>{if(d){setCurrentConversation(d);setMessages(parseMessagesWithAttachments(d.messages||[]));}}).catch(()=>{}); }
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
    if(userRole==='employee'){
      const c=directChats.find(x=>x.id===id)||businessChats.find(x=>x.id===id);
      const chatModeType=c?.mode==='business'?'businessChat':'directChat';
      setDeleteReasonDialog({open:true,type:chatModeType,targetId:id,targetName:c?.title||'Chat'});
      return;
    }
    try{const r=await fetch(`/api/conversations/${id}`,{method:'DELETE'});if(!r.ok)throw new Error();if(selectedDirectChatId===id){setSelectedDirectChatId(null);setMessages([]);}if(selectedBusinessChatId===id){setSelectedBusinessChatId(null);setMessages([]);}fetchDirectChats();fetchBusinessChats();toast({title:'Chat deleted'});}catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
  };

  const handleSubmitDeleteRequest = async () => {
    if(!deleteReasonDialog)return;await submitDeleteRequest(deleteReasonDialog.type,deleteReasonDialog.targetId,deleteReasonDialog.targetName,deleteReason);
    setDeleteReasonDialog(null);setDeleteReason('');
  };

  const handleApproveDeleteRequest = async (id:string) => {
    try{const r=await fetch(`/api/delete-requests/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'approve',reviewedBy:'admin'})});
      if(r.ok){toast({title:'Approved & Deleted'});fetchDeleteRequests();fetchProjects();fetchDirectChats();fetchBusinessChats();fetchProjectLocks();if(selectedProjectId)fetchProjectDetails();}
      else{const d=await r.json().catch(()=>({}));toast({title:'Error',description:d.error||'Failed',variant:'destructive'});}
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
      if(r.ok){const d=await r.json();const emp=d.employee||d;localStorage.setItem('trishul_role','employee');localStorage.setItem('trishul_employee_name',emp.name);localStorage.setItem('trishul_employee_db_id',emp.id);
        setUserRole('employee');setEmployeeName(emp.name);setEmployeeDbId(emp.id);setShowRoleSelect(false);setEmployeeLoginId('');setEmployeeLoginPass('');
        toast({title:'Welcome!',description:`Hello, ${emp.name}`});
      } else {toast({title:'Login Failed',description:'Invalid Employee ID or Password',variant:'destructive'});}
    }catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
    finally{setRoleLoading(false);}
  };

  const handleAdminLogin = async () => {
    if(!adminPassword.trim()){toast({title:'Required',description:'Enter admin password',variant:'destructive'});return;}
    setRoleLoading(true);
    try{
      const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:adminPassword})});
      if(r.ok){const d=await r.json();localStorage.setItem('trishul_role','admin');localStorage.setItem('trishul_admin_logged_in','true');setUserRole('admin');setAdminLoggedIn(true);setShowRoleSelect(false);setAdminPassword('');if(d.admin){setAdminEmail(d.admin.email||'');setAdminId(d.admin.id||'');localStorage.setItem('trishul_admin_email',d.admin.email||'');localStorage.setItem('trishul_admin_id',d.admin.id||'');}toast({title:'Welcome, Admin!'});}
      else{const d=await r.json();toast({title:'Login Failed',description:d.error||'Invalid password',variant:'destructive'});}
    }catch{toast({title:'Error',description:'Failed',variant:'destructive'});}
    finally{setRoleLoading(false);}
  };

  const handleAdminSetup = async () => {
    if(!adminSetupPassword.trim()||!adminSetupEmail.trim()){toast({title:'Required',description:'Fill in all fields',variant:'destructive'});return;}
    setRoleLoading(true);
    try{
      const r=await fetch('/api/admin/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:adminSetupEmail.trim(),password:adminSetupPassword.trim()})});
      if(r.ok){const d=await r.json();localStorage.setItem('trishul_role','admin');localStorage.setItem('trishul_admin_logged_in','true');setUserRole('admin');setAdminLoggedIn(true);setShowRoleSelect(false);setAdminSetupMode(false);setAdminEmail(adminSetupEmail.trim());setAdminId(d.id||'');localStorage.setItem('trishul_admin_email',adminSetupEmail.trim());localStorage.setItem('trishul_admin_id',d.id||'');setAdminSetupPassword('');setAdminSetupEmail('');toast({title:'Admin Created!'});}
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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const r = await fetch('/api/upload', { method: 'POST', body: formData });
        if (r.ok) {
          const d = await r.json();
          setPendingAttachments(prev => [...prev, { type: d.type, url: d.url, name: d.name, mimeType: d.mimeType }]);
        } else {
          toast({ title: 'Upload Failed', description: `Failed to upload ${file.name}`, variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: 'Upload Error', description: 'Failed to upload file(s)', variant: 'destructive' });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = useCallback(async (msgFromInput?: string) => {
    const msg = msgFromInput || inputMessage.trim();
    if((!msg && pendingAttachments.length === 0)||isLoadingRef.current) return;
    if(userRole==='employee' && selectedDirectChatId && directChatLocks[selectedDirectChatId]?.lockedBy==='admin'){
      toast({title:'Chat Locked',description:'Admin is currently using this chat',variant:'destructive'});return;
    }
    if(userRole==='employee' && selectedProjectId && projectLocks[selectedProjectId]?.lockedBy==='admin'){
      toast({title:'Project Locked',description:'Admin is currently using this project',variant:'destructive'});return;
    }
    const userMsg=msg;setInputMessage('');setIsLoading(true);isLoadingRef.current=true;setUserScrolledUp(false);
    const currentAttachments=[...pendingAttachments];setPendingAttachments([]);
    const tempMsg:Message={id:'temp-'+Date.now(),conversationId:selectedBusinessChatId||selectedDirectChatId||selectedConversationId||'',role:'user',content:userMsg||'📎 Shared file(s)',createdAt:new Date().toISOString(),attachments:currentAttachments};
    setMessages(prev=>[...prev,tempMsg]);
    try{
      const isBusiness=!!selectedBusinessChatId||chatMode==='business';
      const endpoint=isBusiness?'/api/chat/business':'/api/chat';
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        projectId:isBusiness?undefined:(selectedProjectId||undefined),
        conversationId:selectedBusinessChatId||selectedDirectChatId||selectedConversationId||undefined,
        message:userMsg||'Please analyze the attached file(s).',
        attachments:currentAttachments.length>0?currentAttachments:undefined,
      })});
      if(r.ok){
        const d=await r.json();const newConvId=d.conversationId;
        if(newConvId&&!selectedDirectChatId&&!selectedConversationId&&!selectedBusinessChatId){
          if(isBusiness)setSelectedBusinessChatId(newConvId);else if(!selectedProjectId)setSelectedDirectChatId(newConvId);else setSelectedConversationId(newConvId);
        }
        if(newConvId){try{const mr=await fetch(`/api/conversations/${newConvId}`);if(mr.ok){const md=await mr.json();setCurrentConversation(md);setMessages(parseMessagesWithAttachments(md.messages||[]));}}catch{}}
        if(isBusiness)fetchBusinessChats();else if(!selectedProjectId)fetchDirectChats();else{fetchProjectDetails();fetchProjects();}
      }else{toast({title:'Error',description:'Failed',variant:'destructive'});setMessages(prev=>prev.filter(m=>m.id!==tempMsg.id));}
    }catch{toast({title:'Network Error',variant:'destructive'});setMessages(prev=>prev.filter(m=>m.id!==tempMsg.id));}
    finally{setIsLoading(false);isLoadingRef.current=false;}
  }, [inputMessage, pendingAttachments, userRole, selectedDirectChatId, directChatLocks, selectedProjectId, projectLocks, selectedBusinessChatId, chatMode, selectedConversationId, toast, fetchBusinessChats, fetchDirectChats, fetchProjectDetails, fetchProjects]);

  const handleNewChat=()=>{setSelectedConversationId(null);setMessages([]);setCurrentConversation(null);setUserScrolledUp(false);setPendingAttachments([]);chatInputValueRef.current='';setChatMode(selectedProjectId?'project':'none');};
  const handleNewDirectChat=()=>{setSelectedDirectChatId(null);setSelectedProjectId(null);setSelectedConversationId(null);setSelectedBusinessChatId(null);setMessages([]);setCurrentConversation(null);setCodePanelOpen(false);setActiveView('chat');setUserScrolledUp(false);setPendingAttachments([]);chatInputValueRef.current='';setChatMode('direct');};
  const handleNewBusinessChat=()=>{setSelectedBusinessChatId(null);setSelectedDirectChatId(null);setSelectedProjectId(null);setSelectedConversationId(null);setMessages([]);setCurrentConversation(null);setActiveView('chat');setUserScrolledUp(false);setPendingAttachments([]);chatInputValueRef.current='';setChatMode('business');};
  const toggleProjectExpand=(id:string)=>{setExpandedProjects(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});};
  const handleViewFile=(file:CodeFile)=>{setViewingFile(file);setFileViewerOpen(true);};

  // ============ RENAME HANDLERS ============
  const handleStartRename = (id:string, type:'project'|'chat', currentName:string) => {
    setEditingId(id); setEditingType(type); setEditingValue(currentName);
  };
  const handleSaveRename = async () => {
    if(!editingId||!editingValue.trim()) {setEditingId(null);return;}
    try {
      const isAdmin = userRole==='admin';
      const endpoint = editingType==='project'
        ? `/api/projects/${editingId}/rename`
        : `/api/conversations/${editingId}/rename`;
      const body = editingType==='project'
        ? {name:editingValue.trim(),performedBy:isAdmin?'admin':employeeName}
        : {title:editingValue.trim(),performedBy:isAdmin?'admin':employeeName};
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(r.ok){toast({title:'Renamed'});if(editingType==='project')fetchProjects();else{fetchDirectChats();fetchBusinessChats();}}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
    setEditingId(null);setEditingType(null);setEditingValue('');
  };

  // ============ DIRECT CHAT LOCKING ============
  const handleSelectDirectChat = async (chatId:string) => {
    if(userRole==='employee'){
      const lockInfo=directChatLocks[chatId];
      if(lockInfo&&lockInfo.lockedBy!=='admin'&&lockInfo.lockedBy!==employeeName){toast({title:'Chat Locked',description:`In use by ${lockInfo.lockedBy}`,variant:'destructive'});return;}
      if(lockInfo&&lockInfo.lockedBy==='admin'){toast({title:'Chat Locked',description:'Admin is currently using this chat',variant:'destructive'});return;}
      if(!lockInfo){
        try{const r=await fetch(`/api/conversations/${chatId}/lock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lockedBy:employeeName})});
          if(r.ok) setLockedDirectChatId(chatId);
          else if(r.status===409){const d=await r.json();toast({title:'Chat Locked',description:d.error||'In use',variant:'destructive'});return;}
        }catch{toast({title:'Error',description:'Failed to lock chat',variant:'destructive'});return;}
      }
    }
    if(userRole==='admin'){
      try{const r=await fetch(`/api/conversations/${chatId}/lock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lockedBy:'admin'})});
        if(r.ok) setLockedDirectChatId(chatId);
      }catch{}
    }
    setSelectedDirectChatId(chatId);setSelectedProjectId(null);setSelectedConversationId(null);setSelectedBusinessChatId(null);setChatMode('direct');
    if(isMobile)setMobileSheetOpen(false);
  };
  const handleEndDirectChat = async () => {
    if(!lockedDirectChatId) return;
    try{await fetch(`/api/conversations/${lockedDirectChatId}/unlock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lockedBy:userRole==='admin'?'admin':employeeName})});
      setLockedDirectChatId(null);setSelectedDirectChatId(null);setMessages([]);setChatMode('none');fetchDirectChats();fetchProjectLocks();
      toast({title:'Chat Saved',description:'Session ended.'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // ============ TOGGLE CHAT HIDE ============
  const handleToggleChatHide = async (chatId:string) => {
    const isAdmin = userRole==='admin';
    try{const r=await fetch(`/api/conversations/${chatId}/toggle-hide`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({performedBy:isAdmin?'admin':employeeName})});
      if(r.ok){fetchDirectChats();fetchBusinessChats();toast({title:'Chat visibility updated'});}else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // ============ BULK HIDE ============
  const handleBulkHide = async () => {
    if(bulkHideSelection.size===0) return;
    try{const r=await fetch('/api/bulk-hide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:bulkHideType,ids:Array.from(bulkHideSelection),hide:true,performedBy:'admin'})});
      if(r.ok){fetchProjects();fetchDirectChats();fetchBusinessChats();setShowBulkHide(false);setBulkHideSelection(new Set());toast({title:`${bulkHideSelection.size} items hidden`});}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // ============ ADMIN PASSWORD RESET ============
  const handleAdminResetRequest = async () => {
    if(!adminEmail){toast({title:'Error',description:'Admin email not found. Please log in again.',variant:'destructive'});return;}
    try{const r=await fetch('/api/admin/request-password-reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:adminEmail})});
      if(r.ok){const d=await r.json();setGeneratedOtp(d.otp||'');setAdminId(d.adminId||adminId);setAdminResetStep('verify');
        toast({title:'OTP Generated',description:`Your OTP is shown below. Email delivery may take a few minutes.`});
      }
      else{const d=await r.json().catch(()=>({}));toast({title:'Error',description:d.error||'Failed',variant:'destructive'});}
    }catch{toast({title:'Error',variant:'destructive'});}
  };
  const handleAdminResetVerify = async () => {
    if(!adminResetOtp.trim()||!adminResetNewPass.trim()){toast({title:'Required',description:'Enter OTP and new password',variant:'destructive'});return;}
    try{const r=await fetch('/api/admin/verify-password-reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({otp:adminResetOtp.trim(),newPassword:adminResetNewPass.trim(),adminId:adminId})});
      if(r.ok){toast({title:'Password Reset Successfully'});setShowChangePassword(false);setShowAdminResetPassword(false);setAdminResetOtp('');setAdminResetNewPass('');setAdminResetStep('request');setGeneratedOtp('');}
      else{const d=await r.json();toast({title:'Error',description:d.error||'Invalid OTP',variant:'destructive'});}
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // ============ ADMIN EMAIL UPDATE ============
  const handleUpdateEmail = async () => {
    if(!adminNewEmail.trim()||!adminEmailPassword.trim()){toast({title:'Required',description:'Enter email and current password',variant:'destructive'});return;}
    try{const r=await fetch('/api/admin/update-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:adminNewEmail.trim(),password:adminEmailPassword.trim()})});
      if(r.ok){const d=await r.json();toast({title:'Email Updated'});setShowUpdateEmail(false);setAdminNewEmail('');setAdminEmailPassword('');if(d.email){setAdminEmail(d.email);localStorage.setItem('trishul_admin_email',d.email);}}
      else{const d=await r.json();toast({title:'Error',description:d.error||'Failed',variant:'destructive'});}
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // ============ SMTP SETTINGS ============
  const handleSaveSmtp = async () => {
    if(!smtpPassword.trim()){toast({title:'Required',description:'Enter your current admin password to save SMTP settings',variant:'destructive'});return;}
    setSmtpSaving(true);
    try{const r=await fetch('/api/admin/smtp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({smtpHost:smtpHost.trim(),smtpPort:smtpPort.trim(),smtpUser:smtpUser.trim(),smtpPass:smtpPass.trim(),smtpFrom:smtpFrom.trim(),currentPassword:smtpPassword.trim()})});
      if(r.ok){toast({title:'SMTP Settings Saved',description:'Email OTP will now be sent to your inbox'});setSmtpPass('');setSmtpPassword('');fetchSmtpSettings();}
      else{const d=await r.json();toast({title:'Error',description:d.error||'Failed',variant:'destructive'});}
    }catch{toast({title:'Error',variant:'destructive'});}
    setSmtpSaving(false);
  };
  const handleTestSmtp = async () => {
    if(!smtpHost.trim()||!smtpUser.trim()||!smtpPass.trim()){toast({title:'Required',description:'Fill in SMTP host, user, and password to test',variant:'destructive'});return;}
    setSmtpTesting(true);
    try{const r=await fetch('/api/admin/smtp',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({smtpHost:smtpHost.trim(),smtpPort:smtpPort.trim(),smtpUser:smtpUser.trim(),smtpPass:smtpPass.trim()})});
      if(r.ok){toast({title:'SMTP Connection OK',description:'Email sending is working correctly'});}
      else{const d=await r.json();toast({title:'SMTP Connection Failed',description:d.error||'Failed',variant:'destructive'});}
    }catch{toast({title:'Error',variant:'destructive'});}
    setSmtpTesting(false);
  };

  // ============ TRAINING RETAKE ============
  const handleRequestRetake = async (assignmentId:string) => {
    try{const r=await fetch(`/api/trainings/assignments/${assignmentId}/request-retake`,{method:'POST'});
      if(r.ok){toast({title:'Retake Requested',description:'Waiting for admin approval'});fetchEmployeeTrainings();}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };
  const handleApproveRetake = async (assignmentId:string) => {
    const isAdmin = userRole==='admin';
    try{const r=await fetch(`/api/trainings/assignments/${assignmentId}/approve-retake`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({performedBy:isAdmin?'admin':employeeName})});
      if(r.ok){toast({title:'Retake Approved'});fetchAllAssignments();}
      else{const d=await r.json().catch(()=>({}));toast({title:'Error',description:d.error||'Failed to approve retake',variant:'destructive'});}
    }catch{toast({title:'Error',variant:'destructive'});}
  };
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
    try{const r=await fetch('/api/trainings/generate-quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:newTrainingCategory.trim(),difficulty:newTrainingDifficulty,videoUrl:newTrainingVideoUrl.trim()})});
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
    try{const r=await fetch('/api/trainings/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({trainingId:assignTrainingId,employeeIds:Array.from(selectedEmployeeIds),dueDate:newTrainingDueDate||undefined})});
      if(r.ok){toast({title:'Training Assigned'});setShowAssignTraining(false);setAssignTrainingId(null);setSelectedEmployeeIds(new Set());setNewTrainingDueDate('');fetchAllAssignments();}
      else toast({title:'Error',variant:'destructive'});
    }catch{toast({title:'Error',variant:'destructive'});}
  };

  // Employee: Start training
  const handleStartTraining = async (assignment: TrainingAssignment) => {
    if(assignment.status==='finished'){
      setActiveTraining(assignment);setVideoWatched(false);setQuizMode(false);return;
    }
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
  const visibleDirectChats = isAdmin ? directChats.filter(c=>c.mode!=='business') : directChats.filter(c=>c.mode!=='business'&&!c.isHidden);
  const dueTrainingsCount = employeeTrainings.filter(a=>a.status==='due').length;
  const retakeRequestedCount = allAssignments.filter(a=>a.retakeRequested&&!a.retakeApproved).length;

  // ==================== LOADING ====================
  if(!mounted){
    return(<div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center"><img src="/trishul-logo.png" alt="Trishul AI Helper" className="h-14 sm:h-16 w-auto object-contain mx-auto mb-4" /><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div></div>);
  }

  // ==================== LOGIN SCREEN ====================
  if(showRoleSelect){
    return <LoginScreen
      adminSetupMode={adminSetupMode} adminSetupEmail={adminSetupEmail} setAdminSetupEmail={setAdminSetupEmail}
      adminSetupPassword={adminSetupPassword} setAdminSetupPassword={setAdminSetupPassword} handleAdminSetup={handleAdminSetup}
      employeeLoginId={employeeLoginId} setEmployeeLoginId={setEmployeeLoginId} employeeLoginPass={employeeLoginPass}
      setEmployeeLoginPass={setEmployeeLoginPass} handleEmployeeLogin={handleEmployeeLogin} adminPassword={adminPassword}
      setAdminPassword={setAdminPassword} handleAdminLogin={handleAdminLogin} roleLoading={roleLoading}
    />;
  }

  // ==================== TRAINING VIEW (EMPLOYEE) ====================
  if(activeView==='training' && userRole==='employee'){
    return <TrainingView
      activeTraining={activeTraining} setActiveTraining={setActiveTraining} quizMode={quizMode}
      setQuizMode={setQuizMode} videoWatched={videoWatched} setVideoWatched={setVideoWatched}
      employeeTrainings={employeeTrainings} fetchEmployeeTrainings={fetchEmployeeTrainings}
      handleStartTraining={handleStartTraining} handleCompleteQuiz={handleCompleteQuiz}
      handleRequestRetake={handleRequestRetake} setActiveView={setActiveView}
    />;
  }

  // ==================== FULL-PAGE ADMIN DASHBOARD ====================
  if(activeView==='dashboard' && userRole==='admin'){
    return <AdminDashboard
      adminTab={adminTab} setAdminTab={setAdminTab} setActiveView={setActiveView}
      employees={employees} trainings={trainings} allAssignments={allAssignments}
      deleteRequests={deleteRequests} auditLogs={auditLogs} retakeRequestedCount={retakeRequestedCount}
      fetchDeleteRequests={fetchDeleteRequests} fetchProjects={fetchProjects} fetchDirectChats={fetchDirectChats}
      fetchBusinessChats={fetchBusinessChats} fetchProjectLocks={fetchProjectLocks} fetchTrainings={fetchTrainings}
      fetchAllAssignments={fetchAllAssignments} fetchSmtpSettings={fetchSmtpSettings}
      handleDeleteEmployee={handleDeleteEmployee} handleCreateEmployee={handleCreateEmployee}
      handleResetEmployeePassword={handleResetEmployeePassword} handleAssignTraining={handleAssignTraining}
      handleCreateTraining={handleCreateTraining} handleGenerateQuiz={handleGenerateQuiz}
      handleRecommendCategories={handleRecommendCategories} handleApproveRetake={handleApproveRetake}
      handleSaveSmtp={handleSaveSmtp} handleTestSmtp={handleTestSmtp} handleChangePassword={handleChangePassword}
      handleAdminResetRequest={handleAdminResetRequest} handleAdminResetVerify={handleAdminResetVerify}
      handleUpdateEmail={handleUpdateEmail} handleBulkHide={handleBulkHide} toast={toast}
      showNewEmployee={showNewEmployee} setShowNewEmployee={setShowNewEmployee}
      newEmpName={newEmpName} setNewEmpName={setNewEmpName} newEmpPass={newEmpPass} setNewEmpPass={setNewEmpPass}
      showNewTraining={showNewTraining} setShowNewTraining={setShowNewTraining}
      newTrainingTitle={newTrainingTitle} setNewTrainingTitle={setNewTrainingTitle}
      newTrainingCategory={newTrainingCategory} setNewTrainingCategory={setNewTrainingCategory}
      newTrainingDifficulty={newTrainingDifficulty} setNewTrainingDifficulty={setNewTrainingDifficulty}
      newTrainingVideoUrl={newTrainingVideoUrl} setNewTrainingVideoUrl={setNewTrainingVideoUrl}
      newTrainingDesc={newTrainingDesc} setNewTrainingDesc={setNewTrainingDesc}
      newTrainingQuestions={newTrainingQuestions} generatingQuiz={generatingQuiz} recommending={recommending}
      recommendedCategories={recommendedCategories} showAssignTraining={showAssignTraining}
      setShowAssignTraining={setShowAssignTraining} assignTrainingId={assignTrainingId}
      setAssignTrainingId={setAssignTrainingId} selectedEmployeeIds={selectedEmployeeIds}
      setSelectedEmployeeIds={setSelectedEmployeeIds} newTrainingDueDate={newTrainingDueDate}
      setNewTrainingDueDate={setNewTrainingDueDate} showResetPassword={showResetPassword}
      setShowResetPassword={setShowResetPassword} resetEmpId={resetEmpId} resetEmpPass={resetEmpPass}
      setResetEmpPass={setResetEmpPass} showChangePassword={showChangePassword}
      setShowChangePassword={setShowChangePassword} currentPassword={currentPassword}
      setCurrentPassword={setCurrentPassword} newPassword={newPassword} setNewPassword={setNewPassword}
      showDeleteRequests={showDeleteRequests} setShowDeleteRequests={setShowDeleteRequests}
      smtpHost={smtpHost} setSmtpHost={setSmtpHost} smtpPort={smtpPort} setSmtpPort={setSmtpPort}
      smtpUser={smtpUser} setSmtpUser={setSmtpUser} smtpPass={smtpPass} setSmtpPass={setSmtpPass}
      smtpFrom={smtpFrom} setSmtpFrom={setSmtpFrom} smtpConfigured={smtpConfigured}
      smtpPassword={smtpPassword} setSmtpPassword={setSmtpPassword} smtpSaving={smtpSaving}
      smtpTesting={smtpTesting} adminEmail={adminEmail} adminResetStep={adminResetStep}
      setAdminResetStep={setAdminResetStep} adminResetOtp={adminResetOtp} setAdminResetOtp={setAdminResetOtp}
      adminResetNewPass={adminResetNewPass} setAdminResetNewPass={setAdminResetNewPass}
      generatedOtp={generatedOtp} showUpdateEmail={showUpdateEmail} setShowUpdateEmail={setShowUpdateEmail}
      adminNewEmail={adminNewEmail} setAdminNewEmail={setAdminNewEmail} adminEmailPassword={adminEmailPassword}
      setAdminEmailPassword={setAdminEmailPassword} showBulkHide={showBulkHide} setShowBulkHide={setShowBulkHide}
      bulkHideType={bulkHideType} bulkHideSelection={bulkHideSelection} setBulkHideSelection={setBulkHideSelection}
      visibleDirectChats={visibleDirectChats} visibleProjects={visibleProjects}
    />;
  }

  const currentChatMode = selectedBusinessChatId ? 'business' : selectedDirectChatId ? 'direct' : selectedProjectId ? 'project' : chatMode;
  const isChatLockedForEmployee = (userRole==='employee' && selectedDirectChatId && directChatLocks[selectedDirectChatId]?.lockedBy==='admin') || (userRole==='employee' && selectedProjectId && projectLocks[selectedProjectId]?.lockedBy==='admin');
  const chatHeader = currentChatMode==='business' ? 'Trishul B.A. — Business Agent' : currentChatMode==='direct' ? 'Direct AI Chat' : currentProject?.name || 'Trishul AI Helper';
  const hasActiveChat = chatMode!=='none'||!!(selectedBusinessChatId||selectedDirectChatId||selectedConversationId||messages.length>0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        {!isMobile && sidebarOpen && (
          <div className="w-64 lg:w-72 border-r flex-shrink-0 flex flex-col bg-card">
            <Sidebar
              isAdmin={isAdmin} employeeName={employeeName} projects={projects}
              visibleProjects={visibleProjects} directChats={directChats} businessChats={businessChats}
              visibleDirectChats={visibleDirectChats} currentProject={currentProject}
              projectFiles={projectFiles} projectLocks={projectLocks} directChatLocks={directChatLocks}
              selectedProjectId={selectedProjectId} selectedConversationId={selectedConversationId}
              selectedDirectChatId={selectedDirectChatId} selectedBusinessChatId={selectedBusinessChatId}
              expandedProjects={expandedProjects} lockedProjectId={lockedProjectId}
              lockedDirectChatId={lockedDirectChatId} deleteRequests={deleteRequests}
              dueTrainingsCount={dueTrainingsCount} retakeRequestedCount={retakeRequestedCount}
              editingId={editingId} editingType={editingType} editingValue={editingValue}
              setEditingValue={setEditingValue} setActiveView={setActiveView}
              fetchAuditLogs={fetchAuditLogs} setShowDeleteRequests={setShowDeleteRequests}
              setShowChangePassword={setShowChangePassword} handleEndDirectChat={handleEndDirectChat}
              handleEndAndSave={handleEndAndSave} handleLogout={handleLogout}
              handleNewDirectChat={handleNewDirectChat} handleNewBusinessChat={handleNewBusinessChat}
              handleNewChat={handleNewChat} setShowNewProject={setShowNewProject}
              setShowNewFile={setShowNewFile} setShowAddCode={setShowAddCode}
              wrappedSetSelectedProjectId={wrappedSetSelectedProjectId}
              setSelectedDirectChatId={setSelectedDirectChatId}
              setSelectedBusinessChatId={setSelectedBusinessChatId}
              setSelectedConversationId={setSelectedConversationId} setChatMode={setChatMode}
              toggleProjectExpand={toggleProjectExpand} handleSelectDirectChat={handleSelectDirectChat}
              handleToggleChatHide={handleToggleChatHide} handleStartRename={handleStartRename}
              handleSaveRename={handleSaveRename} handleDeleteProject={handleDeleteProject}
              handleDeleteConversation={handleDeleteConversation} handleDeleteDirectChat={handleDeleteDirectChat}
              handleDeleteFile={handleDeleteFile} handleViewFile={handleViewFile}
              handleToggleProjectLock={handleToggleProjectLock} setBulkHideType={setBulkHideType}
              setBulkHideSelection={setBulkHideSelection} setShowBulkHide={setShowBulkHide}
              isMobile={isMobile} setMobileSheetOpen={setMobileSheetOpen}
              setEditingId={(v:string|null)=>setEditingId(v)}
            />
          </div>
        )}
        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent side="left" className="p-0 w-72"><SheetHeader className="sr-only"><SheetTitle>Menu</SheetTitle></SheetHeader>
              <Sidebar
                isAdmin={isAdmin} employeeName={employeeName} projects={projects}
                visibleProjects={visibleProjects} directChats={directChats} businessChats={businessChats}
                visibleDirectChats={visibleDirectChats} currentProject={currentProject}
                projectFiles={projectFiles} projectLocks={projectLocks} directChatLocks={directChatLocks}
                selectedProjectId={selectedProjectId} selectedConversationId={selectedConversationId}
                selectedDirectChatId={selectedDirectChatId} selectedBusinessChatId={selectedBusinessChatId}
                expandedProjects={expandedProjects} lockedProjectId={lockedProjectId}
                lockedDirectChatId={lockedDirectChatId} deleteRequests={deleteRequests}
                dueTrainingsCount={dueTrainingsCount} retakeRequestedCount={retakeRequestedCount}
                editingId={editingId} editingType={editingType} editingValue={editingValue}
                setEditingValue={setEditingValue} setActiveView={setActiveView}
                fetchAuditLogs={fetchAuditLogs} setShowDeleteRequests={setShowDeleteRequests}
                setShowChangePassword={setShowChangePassword} handleEndDirectChat={handleEndDirectChat}
                handleEndAndSave={handleEndAndSave} handleLogout={handleLogout}
                handleNewDirectChat={handleNewDirectChat} handleNewBusinessChat={handleNewBusinessChat}
                handleNewChat={handleNewChat} setShowNewProject={setShowNewProject}
                setShowNewFile={setShowNewFile} setShowAddCode={setShowAddCode}
                wrappedSetSelectedProjectId={wrappedSetSelectedProjectId}
                setSelectedDirectChatId={setSelectedDirectChatId}
                setSelectedBusinessChatId={setSelectedBusinessChatId}
                setSelectedConversationId={setSelectedConversationId} setChatMode={setChatMode}
                toggleProjectExpand={toggleProjectExpand} handleSelectDirectChat={handleSelectDirectChat}
                handleToggleChatHide={handleToggleChatHide} handleStartRename={handleStartRename}
                handleSaveRename={handleSaveRename} handleDeleteProject={handleDeleteProject}
                handleDeleteConversation={handleDeleteConversation} handleDeleteDirectChat={handleDeleteDirectChat}
                handleDeleteFile={handleDeleteFile} handleViewFile={handleViewFile}
                handleToggleProjectLock={handleToggleProjectLock} setBulkHideType={setBulkHideType}
                setBulkHideSelection={setBulkHideSelection} setShowBulkHide={setShowBulkHide}
                isMobile={isMobile} setMobileSheetOpen={setMobileSheetOpen}
                setEditingId={(v:string|null)=>setEditingId(v)}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Chat Area */}
        <ChatArea
          messages={messages} isLoading={isLoading} selectedProjectId={selectedProjectId}
          onFilesUpdated={fetchProjectDetails} onViewCode={handleViewCode}
          handleSendMessage={handleSendMessage} chatInputValueRef={chatInputValueRef}
          chatInputClearSignal={chatInputClearSignal} setChatInputClearSignal={setChatInputClearSignal}
          chatHeader={chatHeader} currentChatMode={currentChatMode}
          selectedBusinessChatId={selectedBusinessChatId} selectedDirectChatId={selectedDirectChatId}
          isAdmin={isAdmin} lockedProjectId={lockedProjectId} lockedDirectChatId={lockedDirectChatId}
          isChatLockedForEmployee={isChatLockedForEmployee} chatScrollRef={chatScrollRef}
          handleChatScroll={handleChatScroll} messagesEndRef={messagesEndRef}
          hasActiveChat={hasActiveChat} chatMode={chatMode}
          selectedConversationId={selectedConversationId} handleNewDirectChat={handleNewDirectChat}
          handleNewBusinessChat={handleNewBusinessChat} handleNewChat={handleNewChat}
          setShowNewProject={setShowNewProject} sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen} setMobileSheetOpen={setMobileSheetOpen} isMobile={isMobile}
          codePanelOpen={codePanelOpen} setCodePanelOpen={setCodePanelOpen}
          pendingAttachments={pendingAttachments} uploadingFile={uploadingFile}
          fileInputRef={fileInputRef} handleFileUpload={handleFileUpload}
          removePendingAttachment={removePendingAttachment}
          selectedBusinessChatIdForPlaceholder={selectedBusinessChatId}
        />

        {/* Code Panel */}
        <CodePanel
          codePanelOpen={codePanelOpen} codePanelContent={codePanelContent}
          codePanelTab={codePanelTab} setCodePanelTab={setCodePanelTab}
          setCodePanelOpen={setCodePanelOpen} allCodeBlocks={allCodeBlocks} isMobile={isMobile}
        />
      </div>

      {/* Dialogs */}
      <Dialogs
        showNewProject={showNewProject} setShowNewProject={setShowNewProject}
        newProjectName={newProjectName} setNewProjectName={setNewProjectName}
        newProjectDesc={newProjectDesc} setNewProjectDesc={setNewProjectDesc}
        newProjectTech={newProjectTech} setNewProjectTech={setNewProjectTech}
        handleCreateProject={handleCreateProject}
        showNewFile={showNewFile} setShowNewFile={setShowNewFile}
        newFileName={newFileName} setNewFileName={setNewFileName}
        newFilePath={newFilePath} setNewFilePath={setNewFilePath}
        newFileLanguage={newFileLanguage} setNewFileLanguage={setNewFileLanguage}
        newFileContent={newFileContent} setNewFileContent={setNewFileContent}
        handleAddFile={handleAddFile}
        showAddCode={showAddCode} setShowAddCode={setShowAddCode}
        addCodeContent={addCodeContent} setAddCodeContent={setAddCodeContent}
        handleAddCode={handleAddCode}
        fileViewerOpen={fileViewerOpen} setFileViewerOpen={setFileViewerOpen}
        viewingFile={viewingFile} setViewingFile={setViewingFile}
        deleteReasonDialog={deleteReasonDialog} setDeleteReasonDialog={setDeleteReasonDialog}
        deleteReason={deleteReason} setDeleteReason={setDeleteReason}
        handleSubmitDeleteRequest={handleSubmitDeleteRequest}
        showDeleteRequests={showDeleteRequests} setShowDeleteRequests={setShowDeleteRequests}
        deleteRequests={deleteRequests} handleApproveDeleteRequest={handleApproveDeleteRequest}
        handleRejectDeleteRequest={handleRejectDeleteRequest}
        fetchDeleteRequests={fetchDeleteRequests} fetchProjects={fetchProjects}
        fetchDirectChats={fetchDirectChats} fetchBusinessChats={fetchBusinessChats}
        fetchProjectLocks={fetchProjectLocks} toast={toast}
        showChangePassword={showChangePassword} setShowChangePassword={setShowChangePassword}
        currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
        newPassword={newPassword} setNewPassword={setNewPassword}
        handleChangePassword={handleChangePassword}
        adminEmail={adminEmail} adminResetStep={adminResetStep}
        setAdminResetStep={setAdminResetStep} adminResetOtp={adminResetOtp}
        setAdminResetOtp={setAdminResetOtp} adminResetNewPass={adminResetNewPass}
        setAdminResetNewPass={setAdminResetNewPass} generatedOtp={generatedOtp}
        handleAdminResetRequest={handleAdminResetRequest}
        handleAdminResetVerify={handleAdminResetVerify} smtpConfigured={smtpConfigured}
        showBulkHide={showBulkHide} setShowBulkHide={setShowBulkHide}
        bulkHideType={bulkHideType} bulkHideSelection={bulkHideSelection}
        setBulkHideSelection={setBulkHideSelection} visibleDirectChats={visibleDirectChats}
        visibleProjects={visibleProjects} handleBulkHide={handleBulkHide}
        showNewEmployee={showNewEmployee} setShowNewEmployee={setShowNewEmployee}
        newEmpName={newEmpName} setNewEmpName={setNewEmpName}
        newEmpPass={newEmpPass} setNewEmpPass={setNewEmpPass}
        handleCreateEmployee={handleCreateEmployee}
        showResetPassword={showResetPassword} setShowResetPassword={setShowResetPassword}
        resetEmpId={resetEmpId} resetEmpPass={resetEmpPass} setResetEmpPass={setResetEmpPass}
        employees={employees} handleResetEmployeePassword={handleResetEmployeePassword}
        showNewTraining={showNewTraining} setShowNewTraining={setShowNewTraining}
        newTrainingTitle={newTrainingTitle} setNewTrainingTitle={setNewTrainingTitle}
        newTrainingCategory={newTrainingCategory} setNewTrainingCategory={setNewTrainingCategory}
        newTrainingDifficulty={newTrainingDifficulty} setNewTrainingDifficulty={setNewTrainingDifficulty}
        newTrainingVideoUrl={newTrainingVideoUrl} setNewTrainingVideoUrl={setNewTrainingVideoUrl}
        newTrainingDesc={newTrainingDesc} setNewTrainingDesc={setNewTrainingDesc}
        newTrainingQuestions={newTrainingQuestions} generatingQuiz={generatingQuiz}
        handleGenerateQuiz={handleGenerateQuiz} recommending={recommending}
        recommendedCategories={recommendedCategories} handleRecommendCategories={handleRecommendCategories}
        handleCreateTraining={handleCreateTraining}
        showAssignTraining={showAssignTraining} setShowAssignTraining={setShowAssignTraining}
        assignTrainingId={assignTrainingId} setAssignTrainingId={setAssignTrainingId}
        selectedEmployeeIds={selectedEmployeeIds} setSelectedEmployeeIds={setSelectedEmployeeIds}
        newTrainingDueDate={newTrainingDueDate} setNewTrainingDueDate={setNewTrainingDueDate}
        handleAssignTraining={handleAssignTraining}
      />
    </div>
  );
}
