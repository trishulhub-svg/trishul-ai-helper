'use client';

import { Check, Copy, Save, FileCode2, X, CheckCircle2, XCircle, ClipboardList, KeyRound, Mail, EyeOff, Users, Plus, GraduationCap, Loader2, Lightbulb, Sparkles, FolderPlus, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeFile, DeleteRequest, Employee, QuizQuestion } from './types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getLanguage } from './utils';

// ===================== COPY BUTTON (for code panel) =====================
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

import { useState } from 'react';

export interface DialogsProps {
  // New Project
  showNewProject: boolean;
  setShowNewProject: (v: boolean) => void;
  newProjectName: string;
  setNewProjectName: (v: string) => void;
  newProjectDesc: string;
  setNewProjectDesc: (v: string) => void;
  newProjectTech: string;
  setNewProjectTech: (v: string) => void;
  handleCreateProject: () => void;
  // Add File
  showNewFile: boolean;
  setShowNewFile: (v: boolean) => void;
  newFileName: string;
  setNewFileName: (v: string) => void;
  newFilePath: string;
  setNewFilePath: (v: string) => void;
  newFileLanguage: string;
  setNewFileLanguage: (v: string) => void;
  newFileContent: string;
  setNewFileContent: (v: string) => void;
  handleAddFile: () => void;
  // Paste Code
  showAddCode: boolean;
  setShowAddCode: (v: boolean) => void;
  addCodeContent: string;
  setAddCodeContent: (v: string) => void;
  handleAddCode: () => void;
  // File Viewer
  fileViewerOpen: boolean;
  setFileViewerOpen: (v: boolean) => void;
  viewingFile: CodeFile | null;
  setViewingFile: (v: CodeFile | null) => void;
  // Delete Reason
  deleteReasonDialog: {open:boolean;type:string;targetId:string;targetName:string}|null;
  setDeleteReasonDialog: (v: {open:boolean;type:string;targetId:string;targetName:string}|null) => void;
  deleteReason: string;
  setDeleteReason: (v: string) => void;
  handleSubmitDeleteRequest: () => void;
  // Delete Requests
  showDeleteRequests: boolean;
  setShowDeleteRequests: (v: boolean) => void;
  deleteRequests: DeleteRequest[];
  handleApproveDeleteRequest: (id: string) => void;
  handleRejectDeleteRequest: (id: string) => void;
  fetchDeleteRequests: () => void;
  fetchProjects: () => void;
  fetchDirectChats: () => void;
  fetchBusinessChats: () => void;
  fetchProjectLocks: () => void;
  toast: any;
  // Change Password
  showChangePassword: boolean;
  setShowChangePassword: (v: boolean) => void;
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  handleChangePassword: () => void;
  // Admin Reset
  adminEmail: string;
  adminResetStep: 'request'|'verify';
  setAdminResetStep: (v: 'request'|'verify') => void;
  adminResetOtp: string;
  setAdminResetOtp: (v: string) => void;
  adminResetNewPass: string;
  setAdminResetNewPass: (v: string) => void;
  generatedOtp: string;
  handleAdminResetRequest: () => void;
  handleAdminResetVerify: () => void;
  smtpConfigured: boolean;
  // Bulk Hide
  showBulkHide: boolean;
  setShowBulkHide: (v: boolean) => void;
  bulkHideType: 'direct_chats'|'projects';
  bulkHideSelection: Set<string>;
  setBulkHideSelection: (v: Set<string>) => void;
  visibleDirectChats: any[];
  visibleProjects: any[];
  handleBulkHide: () => void;
  // New Employee
  showNewEmployee: boolean;
  setShowNewEmployee: (v: boolean) => void;
  newEmpName: string;
  setNewEmpName: (v: string) => void;
  newEmpPass: string;
  setNewEmpPass: (v: string) => void;
  handleCreateEmployee: () => void;
  // Reset Employee Password
  showResetPassword: boolean;
  setShowResetPassword: (v: boolean) => void;
  resetEmpId: string | null;
  resetEmpPass: string;
  setResetEmpPass: (v: string) => void;
  employees: Employee[];
  handleResetEmployeePassword: () => void;
  // New Training
  showNewTraining: boolean;
  setShowNewTraining: (v: boolean) => void;
  newTrainingTitle: string;
  setNewTrainingTitle: (v: string) => void;
  newTrainingCategory: string;
  setNewTrainingCategory: (v: string) => void;
  newTrainingDifficulty: string;
  setNewTrainingDifficulty: (v: string) => void;
  newTrainingVideoUrl: string;
  setNewTrainingVideoUrl: (v: string) => void;
  newTrainingDesc: string;
  setNewTrainingDesc: (v: string) => void;
  newTrainingQuestions: QuizQuestion[];
  generatingQuiz: boolean;
  handleGenerateQuiz: () => void;
  recommending: boolean;
  recommendedCategories: {name:string;description:string}[];
  handleRecommendCategories: () => void;
  handleCreateTraining: () => void;
  // Assign Training
  showAssignTraining: boolean;
  setShowAssignTraining: (v: boolean) => void;
  assignTrainingId: string | null;
  setAssignTrainingId: (v: string|null) => void;
  selectedEmployeeIds: Set<string>;
  setSelectedEmployeeIds: (v: Set<string>) => void;
  newTrainingDueDate: string;
  setNewTrainingDueDate: (v: string) => void;
  handleAssignTraining: () => void;
}

export function Dialogs(props: DialogsProps) {
  const p = props;

  return (
    <>
      {/* New Project Dialog */}
      <Dialog open={p.showNewProject} onOpenChange={v=>{p.setShowNewProject(v);if(!v){p.setNewProjectName('');p.setNewProjectDesc('');p.setNewProjectTech('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Create New Project</DialogTitle><DialogDescription>Add a new project to your workspace</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={p.newProjectName} onChange={e=>p.setNewProjectName(e.target.value)} placeholder="My Project" autoFocus onKeyDown={e=>e.key==='Enter'&&p.handleCreateProject()}/></div>
            <div><Label>Description</Label><Textarea value={p.newProjectDesc} onChange={e=>p.setNewProjectDesc(e.target.value)} placeholder="What is this project about?" rows={2}/></div>
            <div><Label>Tech Stack</Label><Input value={p.newProjectTech} onChange={e=>p.setNewProjectTech(e.target.value)} placeholder="React, TypeScript, Node.js"/></div>
            <Button onClick={p.handleCreateProject} disabled={!p.newProjectName.trim()} className="w-full"><FolderPlus className="h-4 w-4 mr-2"/>Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add File Dialog */}
      <Dialog open={p.showNewFile} onOpenChange={v=>{p.setShowNewFile(v);if(!v){p.setNewFileName('');p.setNewFilePath('');p.setNewFileLanguage('typescript');p.setNewFileContent('');}}}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Add Code File</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>File Name *</Label><Input value={p.newFileName} onChange={e=>p.setNewFileName(e.target.value)} placeholder="page.tsx" autoFocus/></div>
              <div><Label>File Path *</Label><Input value={p.newFilePath} onChange={e=>p.setNewFilePath(e.target.value)} placeholder="src/app/page.tsx"/></div>
            </div>
            <div><Label>Language</Label><Input value={p.newFileLanguage} onChange={e=>p.setNewFileLanguage(e.target.value)} placeholder="typescript"/></div>
            <div><Label>Code Content *</Label><Textarea value={p.newFileContent} onChange={e=>p.setNewFileContent(e.target.value)} placeholder="Paste code..." rows={12} className="font-mono text-xs"/></div>
            <Button onClick={p.handleAddFile} disabled={!p.newFileName.trim()||!p.newFilePath.trim()} className="w-full"><FilePlus className="h-4 w-4 mr-2"/>Add File</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paste Code Dialog */}
      <Dialog open={p.showAddCode} onOpenChange={v=>{p.setShowAddCode(v);if(!v)p.setAddCodeContent('');}}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Paste Code</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Add <code className="bg-muted px-1 rounded">{`// filepath: src/app/page.tsx`}</code> at top for auto-detection.</p>
            <Textarea value={p.addCodeContent} onChange={e=>p.setAddCodeContent(e.target.value)} placeholder={`// filepath: src/app/page.tsx\n\nexport default function Page() {\n  return <div>Hello</div>;\n}`} rows={16} className="font-mono text-xs" autoFocus/>
            <Button onClick={p.handleAddCode} disabled={!p.addCodeContent.trim()} className="w-full"><Save className="h-4 w-4 mr-2"/>Save Code</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      <Dialog open={p.fileViewerOpen} onOpenChange={v=>{p.setFileViewerOpen(v);if(!v)p.setViewingFile(null);}}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle className="flex items-center gap-2"><FileCode2 className="h-4 w-4 text-emerald-500"/>{p.viewingFile?.filePath||'File'}</DialogTitle></DialogHeader>
          {p.viewingFile && <div className="rounded-lg overflow-hidden border"><SyntaxHighlighter style={oneDark} language={getLanguage(p.viewingFile.language)} PreTag="div" customStyle={{margin:0,fontSize:'0.75rem',lineHeight:'1.5',maxHeight:'60vh'}}>{p.viewingFile.content}</SyntaxHighlighter></div>}
        </DialogContent>
      </Dialog>

      {/* Delete Reason Dialog (Employee) */}
      <Dialog open={!!p.deleteReasonDialog} onOpenChange={v=>{if(!v){p.setDeleteReasonDialog(null);p.setDeleteReason('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Request Deletion</DialogTitle><DialogDescription>Submit a request to delete &quot;{p.deleteReasonDialog?.targetName}&quot;</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Reason *</Label><Textarea value={p.deleteReason} onChange={e=>p.setDeleteReason(e.target.value)} placeholder="Why do you want to delete this?" rows={3}/></div>
            <Button onClick={p.handleSubmitDeleteRequest} disabled={!p.deleteReason.trim()} className="w-full">Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Requests Dialog (Admin) */}
      <Dialog open={p.showDeleteRequests} onOpenChange={p.setShowDeleteRequests}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5"/>Delete Requests</DialogTitle></DialogHeader>
          {p.deleteRequests.length===0?<p className="text-sm text-muted-foreground py-4 text-center">No pending requests</p>:
          <div className="space-y-3">{p.deleteRequests.map(r=>(
            <div key={r.id} className="p-3 rounded-lg border space-y-2">
              <div className="flex items-center justify-between"><span className="font-medium text-sm">{r.targetName}</span><Badge variant="outline" className="text-[10px]">{r.type}</Badge></div>
              <p className="text-xs text-muted-foreground">By: {r.requestedBy} • {r.reason}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={()=>p.handleApproveDeleteRequest(r.id)}><CheckCircle2 className="h-3 w-3"/>Approve</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>p.handleRejectDeleteRequest(r.id)}><XCircle className="h-3 w-3"/>Reject</Button>
              </div>
            </div>
          ))}</div>}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={p.showChangePassword} onOpenChange={v=>{p.setShowChangePassword(v);if(!v){p.setCurrentPassword('');p.setNewPassword('');p.setAdminResetStep('request');p.setAdminResetOtp('');p.setAdminResetNewPass('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/>Password Management</DialogTitle></DialogHeader>
          <Tabs defaultValue="change" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="change" className="text-xs gap-1"><KeyRound className="h-3 w-3"/>Change Password</TabsTrigger>
              <TabsTrigger value="reset" className="text-xs gap-1"><Mail className="h-3 w-3"/>Reset via Email</TabsTrigger>
            </TabsList>
            <TabsContent value="change" className="mt-3">
              <div className="space-y-3">
                <div><Label>Current Password</Label><Input value={p.currentPassword} onChange={e=>p.setCurrentPassword(e.target.value)} type="password"/></div>
                <div><Label>New Password</Label><Input value={p.newPassword} onChange={e=>p.setNewPassword(e.target.value)} type="password"/></div>
                <Button onClick={p.handleChangePassword} disabled={!p.currentPassword.trim()||!p.newPassword.trim()} className="w-full">Change Password</Button>
              </div>
            </TabsContent>
            <TabsContent value="reset" className="mt-3">
              <div className="space-y-3">
                {p.adminEmail&&<div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"><Mail className="h-4 w-4 text-primary flex-shrink-0"/><span className="text-sm font-medium truncate">{p.adminEmail}</span></div>}
                {!p.adminEmail&&<p className="text-xs text-destructive">Admin email not found. Please log in again.</p>}
                {p.smtpConfigured?(
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600"/><span className="text-xs text-green-600 font-medium">OTP shown on screen + sent to your email</span>
                  </div>
                ):(
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <Mail className="h-4 w-4 text-amber-600"/><span className="text-xs text-amber-600 font-medium">OTP always shown on screen for instant access. Configure SMTP in Dashboard → Settings for email delivery too.</span>
                  </div>
                )}
                {p.adminResetStep==='request'?(
                  <div className="space-y-2">
                    <Button onClick={p.handleAdminResetRequest} disabled={!p.adminEmail} className="w-full"><Mail className="h-4 w-4 mr-2"/>Send OTP to Email</Button>
                  </div>
                ):(
                  <div className="space-y-2">
                    {p.generatedOtp&&<div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30"><span className="text-xs font-medium">Your OTP:</span><code className="text-lg font-bold text-primary tracking-widest">{p.generatedOtp}</code></div>}
                    {p.smtpConfigured&&<p className="text-xs text-muted-foreground">OTP also sent to {p.adminEmail} (may take a few minutes).</p>}
                    <div><Label>OTP</Label><Input value={p.adminResetOtp} onChange={e=>p.setAdminResetOtp(e.target.value)} placeholder="Enter OTP from above"/></div>
                    <div><Label>New Password</Label><Input value={p.adminResetNewPass} onChange={e=>p.setAdminResetNewPass(e.target.value)} type="password"/></div>
                    <Button onClick={p.handleAdminResetVerify} disabled={!p.adminResetOtp.trim()||!p.adminResetNewPass.trim()} className="w-full">Verify & Reset</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Bulk Hide Dialog */}
      <Dialog open={p.showBulkHide} onOpenChange={v=>{p.setShowBulkHide(v);if(!v)p.setBulkHideSelection(new Set());}}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bulk Hide {p.bulkHideType==='direct_chats'?'Direct Chats':'Projects'}</DialogTitle>
          <DialogDescription>Uncheck items you want to keep visible. Checked items will be hidden from employees.</DialogDescription></DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(p.bulkHideType==='direct_chats'?p.visibleDirectChats:p.visibleProjects).map((item:any)=>(
              <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${p.bulkHideSelection.has(item.id)?'bg-primary/10 border-primary':'hover:bg-muted'}`}
                onClick={()=>p.setBulkHideSelection(prev=>{const n=new Set(prev);if(n.has(item.id))n.delete(item.id);else n.add(item.id);return n;})}>
                <div className={`h-4 w-4 rounded border ${p.bulkHideSelection.has(item.id)?'bg-primary border-primary':'border-border'} flex items-center justify-center`}>
                  {p.bulkHideSelection.has(item.id)&&<Check className="h-3 w-3 text-primary-foreground"/>}
                </div>
                <span className="text-sm truncate">{item.title||item.name}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>p.setShowBulkHide(false)}>Cancel</Button>
            <Button onClick={p.handleBulkHide} disabled={p.bulkHideSelection.size===0}>
              <EyeOff className="h-4 w-4 mr-2"/>Hide {p.bulkHideSelection.size} Item{p.bulkHideSelection.size!==1?'s':''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Employee Dialog */}
      <Dialog open={p.showNewEmployee} onOpenChange={v=>{p.setShowNewEmployee(v);if(!v){p.setNewEmpName('');p.setNewEmpPass('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Create Employee</DialogTitle><DialogDescription>Add a new employee with login credentials</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name *</Label><Input value={p.newEmpName} onChange={e=>p.setNewEmpName(e.target.value)} placeholder="John Doe" autoFocus onKeyDown={e=>e.key==='Enter'&&p.handleCreateEmployee()}/></div>
            <div><Label>Initial Password</Label><Input value={p.newEmpPass} onChange={e=>p.setNewEmpPass(e.target.value)} placeholder="Defaults to password123" type="password"/></div>
            <Button onClick={p.handleCreateEmployee} disabled={!p.newEmpName.trim()} className="w-full"><Plus className="h-4 w-4 mr-2"/>Create Employee</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Employee Password Dialog */}
      <Dialog open={p.showResetPassword} onOpenChange={v=>{p.setShowResetPassword(v);if(!v){p.setResetEmpPass('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Reset Employee Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Employee: {p.employees.find(e=>e.id===p.resetEmpId)?.name}</p>
            <div><Label>New Password *</Label><Input value={p.resetEmpPass} onChange={e=>p.setResetEmpPass(e.target.value)} placeholder="Enter new password" type="password"/></div>
            <Button onClick={p.handleResetEmployeePassword} disabled={!p.resetEmpPass.trim()} className="w-full">Reset Password</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Training Dialog */}
      <Dialog open={p.showNewTraining} onOpenChange={v=>{p.setShowNewTraining(v);if(!v){p.setNewTrainingTitle('');p.setNewTrainingCategory('');p.setNewTrainingDifficulty('beginner');p.setNewTrainingVideoUrl('');p.setNewTrainingDesc('');}}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create Training</DialogTitle><DialogDescription>Set up a new training module with video and quiz</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={p.newTrainingTitle} onChange={e=>p.setNewTrainingTitle(e.target.value)} placeholder="PHP Fundamentals" autoFocus/></div>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><Label>Category *</Label><Input value={p.newTrainingCategory} onChange={e=>p.setNewTrainingCategory(e.target.value)} placeholder="PHP, HTML, Public Health..."/></div>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1 mb-0.5" onClick={p.handleRecommendCategories} disabled={p.recommending}>{p.recommending?<Loader2 className="h-3 w-3 animate-spin"/>:<Lightbulb className="h-3 w-3"/>}AI Suggest</Button>
            </div>
            {p.recommendedCategories.length>0 && (
              <div className="flex flex-wrap gap-1.5">{p.recommendedCategories.map((c,i)=>(
                <Badge key={i} variant="outline" className="cursor-pointer hover:bg-primary/10 text-[10px]" onClick={()=>p.setNewTrainingCategory(c.name)}>{c.name}</Badge>
              ))}</div>
            )}
            <div><Label>Difficulty</Label><Select value={p.newTrainingDifficulty} onValueChange={v=>p.setNewTrainingDifficulty(v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div>
            <div><Label>Video URL (YouTube)</Label><Input value={p.newTrainingVideoUrl} onChange={e=>p.setNewTrainingVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."/></div>
            <div><Label>Description</Label><Textarea value={p.newTrainingDesc} onChange={e=>p.setNewTrainingDesc(e.target.value)} placeholder="Training description..." rows={2}/></div>
            <Separator/>
            <div className="flex items-center justify-between"><Label className="text-sm font-semibold">Quiz Questions ({p.newTrainingQuestions.length})</Label>
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={p.handleGenerateQuiz} disabled={p.generatingQuiz||!p.newTrainingCategory.trim()}>
                {p.generatingQuiz?<Loader2 className="h-3 w-3 animate-spin"/>:<Sparkles className="h-3 w-3"/>}AI Generate Quiz
              </Button>
            </div>
            {p.newTrainingQuestions.length>0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">{p.newTrainingQuestions.map((q,i)=>(
                <div key={i} className="p-2 rounded-lg border text-xs"><p className="font-medium">Q{i+1}: {q.question}</p><p className="text-muted-foreground">A: {q.options.a} | B: {q.options.b} | C: {q.options.c} | D: {q.options.d}</p></div>
              ))}</div>
            )}
            <Button onClick={p.handleCreateTraining} disabled={!p.newTrainingTitle.trim()||!p.newTrainingCategory.trim()} className="w-full"><GraduationCap className="h-4 w-4 mr-2"/>Create Training</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Training Dialog */}
      <Dialog open={p.showAssignTraining} onOpenChange={v=>{p.setShowAssignTraining(v);if(!v){p.setAssignTrainingId(null);p.setSelectedEmployeeIds(new Set());p.setNewTrainingDueDate('');}}}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Assign Training</DialogTitle><DialogDescription>Select employees and set a due date</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Due Date (optional)</Label><Input type="date" value={p.newTrainingDueDate} onChange={e=>p.setNewTrainingDueDate(e.target.value)}/></div>
            {p.employees.length===0?<p className="text-sm text-muted-foreground">No employees to assign to</p>:
            <div className="space-y-2">{p.employees.map(emp=>(
              <div key={emp.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${p.selectedEmployeeIds.has(emp.id)?'bg-primary/10 border-primary':'hover:bg-muted'}`}
                onClick={()=>p.setSelectedEmployeeIds(prev=>{const n=new Set(prev);if(n.has(emp.id))n.delete(emp.id);else n.add(emp.id);return n;})}>
                <div className={`h-4 w-4 rounded border ${p.selectedEmployeeIds.has(emp.id)?'bg-primary border-primary':'border-border'} flex items-center justify-center`}>
                  {p.selectedEmployeeIds.has(emp.id)&&<Check className="h-3 w-3 text-primary-foreground"/>}
                </div>
                <span className="text-sm">{emp.name}</span><span className="text-xs text-muted-foreground ml-auto">{emp.employeeId}</span>
              </div>
            ))}</div>}
            <Button onClick={p.handleAssignTraining} disabled={p.selectedEmployeeIds.size===0} className="w-full"><Users className="h-4 w-4 mr-2"/>Assign to {p.selectedEmployeeIds.size} Employee{p.selectedEmployeeIds.size!==1?'s':''}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
