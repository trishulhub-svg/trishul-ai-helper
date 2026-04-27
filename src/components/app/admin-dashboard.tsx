'use client';

import {
  X, Settings, Users, GraduationCap, ClipboardList, Trash2, Eye,
  CheckCircle2, XCircle, BarChart3, Award, Plus, KeyRound, Loader2,
  Mail, Lightbulb, Sparkles, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Check } from 'lucide-react';
import { Employee, Training, TrainingAssignment, DeleteRequest } from './types';
import { parseQuestions } from './utils';

export interface AdminDashboardProps {
  adminTab: string;
  setAdminTab: (v: string) => void;
  setActiveView: (v: 'chat'|'training'|'dashboard') => void;
  employees: Employee[];
  trainings: Training[];
  allAssignments: TrainingAssignment[];
  deleteRequests: DeleteRequest[];
  auditLogs: any[];
  retakeRequestedCount: number;
  // Handlers
  fetchDeleteRequests: () => void;
  fetchProjects: () => void;
  fetchDirectChats: () => void;
  fetchBusinessChats: () => void;
  fetchProjectLocks: () => void;
  fetchTrainings: () => void;
  fetchAllAssignments: () => void;
  fetchSmtpSettings: () => void;
  handleDeleteEmployee: (id: string) => void;
  handleCreateEmployee: () => void;
  handleResetEmployeePassword: () => void;
  handleAssignTraining: () => void;
  handleCreateTraining: () => void;
  handleGenerateQuiz: () => void;
  handleRecommendCategories: () => void;
  handleApproveRetake: (assignmentId: string) => void;
  handleSaveSmtp: () => void;
  handleTestSmtp: () => void;
  handleChangePassword: () => void;
  handleAdminResetRequest: () => void;
  handleAdminResetVerify: () => void;
  handleUpdateEmail: () => void;
  handleBulkHide: () => void;
  toast: any;
  // Dialog state
  showNewEmployee: boolean;
  setShowNewEmployee: (v: boolean) => void;
  newEmpName: string;
  setNewEmpName: (v: string) => void;
  newEmpPass: string;
  setNewEmpPass: (v: string) => void;
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
  newTrainingQuestions: any[];
  generatingQuiz: boolean;
  recommending: boolean;
  recommendedCategories: {name:string;description:string}[];
  showAssignTraining: boolean;
  setShowAssignTraining: (v: boolean) => void;
  assignTrainingId: string | null;
  setAssignTrainingId: (v: string|null) => void;
  selectedEmployeeIds: Set<string>;
  setSelectedEmployeeIds: (v: Set<string>) => void;
  newTrainingDueDate: string;
  setNewTrainingDueDate: (v: string) => void;
  showResetPassword: boolean;
  setShowResetPassword: (v: boolean) => void;
  resetEmpId: string | null;
  resetEmpPass: string;
  setResetEmpPass: (v: string) => void;
  showChangePassword: boolean;
  setShowChangePassword: (v: boolean) => void;
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  showDeleteRequests: boolean;
  setShowDeleteRequests: (v: boolean) => void;
  // SMTP
  smtpHost: string;
  setSmtpHost: (v: string) => void;
  smtpPort: string;
  setSmtpPort: (v: string) => void;
  smtpUser: string;
  setSmtpUser: (v: string) => void;
  smtpPass: string;
  setSmtpPass: (v: string) => void;
  smtpFrom: string;
  setSmtpFrom: (v: string) => void;
  smtpConfigured: boolean;
  smtpPassword: string;
  setSmtpPassword: (v: string) => void;
  smtpSaving: boolean;
  smtpTesting: boolean;
  // Admin reset
  adminEmail: string;
  adminResetStep: 'request'|'verify';
  setAdminResetStep: (v: 'request'|'verify') => void;
  adminResetOtp: string;
  setAdminResetOtp: (v: string) => void;
  adminResetNewPass: string;
  setAdminResetNewPass: (v: string) => void;
  generatedOtp: string;
  // Email update
  showUpdateEmail: boolean;
  setShowUpdateEmail: (v: boolean) => void;
  adminNewEmail: string;
  setAdminNewEmail: (v: string) => void;
  adminEmailPassword: string;
  setAdminEmailPassword: (v: string) => void;
  // Bulk hide
  showBulkHide: boolean;
  setShowBulkHide: (v: boolean) => void;
  bulkHideType: 'direct_chats'|'projects';
  bulkHideSelection: Set<string>;
  setBulkHideSelection: (v: Set<string>) => void;
  visibleDirectChats: any[];
  visibleProjects: any[];
}

export function AdminDashboard(props: AdminDashboardProps) {
  const {
    adminTab, setAdminTab, setActiveView, employees, trainings, allAssignments,
    deleteRequests, auditLogs, retakeRequestedCount, fetchDeleteRequests,
    fetchProjects, fetchDirectChats, fetchBusinessChats, fetchProjectLocks,
    fetchTrainings, fetchAllAssignments, handleDeleteEmployee, handleCreateEmployee,
    handleResetEmployeePassword, handleAssignTraining, handleCreateTraining,
    handleGenerateQuiz, handleRecommendCategories, handleApproveRetake,
    handleSaveSmtp, handleTestSmtp, handleChangePassword, handleAdminResetRequest,
    handleAdminResetVerify, handleUpdateEmail, handleBulkHide, toast,
    showNewEmployee, setShowNewEmployee, newEmpName, setNewEmpName, newEmpPass, setNewEmpPass,
    showNewTraining, setShowNewTraining, newTrainingTitle, setNewTrainingTitle,
    newTrainingCategory, setNewTrainingCategory, newTrainingDifficulty, setNewTrainingDifficulty,
    newTrainingVideoUrl, setNewTrainingVideoUrl, newTrainingDesc, setNewTrainingDesc,
    newTrainingQuestions, generatingQuiz, recommending, recommendedCategories,
    showAssignTraining, setShowAssignTraining, assignTrainingId, setAssignTrainingId,
    selectedEmployeeIds, setSelectedEmployeeIds, newTrainingDueDate, setNewTrainingDueDate,
    showResetPassword, setShowResetPassword, resetEmpId, resetEmpPass, setResetEmpPass,
    showChangePassword, setShowChangePassword, currentPassword, setCurrentPassword, newPassword, setNewPassword,
    showDeleteRequests, setShowDeleteRequests,
    smtpHost, setSmtpHost, smtpPort, setSmtpPort, smtpUser, setSmtpUser, smtpPass, setSmtpPass,
    smtpFrom, setSmtpFrom, smtpConfigured, smtpPassword, setSmtpPassword, smtpSaving, smtpTesting,
    adminEmail, adminResetStep, setAdminResetStep, adminResetOtp, setAdminResetOtp,
    adminResetNewPass, setAdminResetNewPass, generatedOtp,
    showUpdateEmail, setShowUpdateEmail, adminNewEmail, setAdminNewEmail, adminEmailPassword, setAdminEmailPassword,
    showBulkHide, setShowBulkHide, bulkHideType, bulkHideSelection, setBulkHideSelection,
    visibleDirectChats, visibleProjects,
  } = props;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b p-3 sm:p-4 flex items-center gap-3 bg-card">
        <Button variant="ghost" size="sm" onClick={()=>setActiveView('chat')}><X className="h-4 w-4 mr-1"/>Back to Chat</Button>
        <h1 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5"/>Admin Dashboard</h1>
        <Badge variant="default" className="text-[10px]">Admin</Badge>
      </header>
      <Tabs value={adminTab} onValueChange={setAdminTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 border-b bg-card"><TabsList className="h-10">
          <TabsTrigger value="overview" className="text-xs gap-1"><BarChart3 className="h-3 w-3"/>Overview</TabsTrigger>
          <TabsTrigger value="users" className="text-xs gap-1"><Users className="h-3 w-3"/>Users</TabsTrigger>
          <TabsTrigger value="trainings" className="text-xs gap-1"><GraduationCap className="h-3 w-3"/>Trainings</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs gap-1 relative"><ClipboardList className="h-3 w-3"/>Assignments{retakeRequestedCount>0&&<Badge variant="destructive" className="h-4 min-w-4 px-1 text-[8px] ml-1">{retakeRequestedCount}</Badge>}</TabsTrigger>
          <TabsTrigger value="delete-requests" className="text-xs gap-1 relative"><Trash2 className="h-3 w-3"/>Delete Requests{deleteRequests.length>0&&<Badge variant="destructive" className="h-4 min-w-4 px-1 text-[8px] ml-1">{deleteRequests.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1"><Eye className="h-3 w-3"/>Audit Log</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1"><Settings className="h-3 w-3"/>Settings</TabsTrigger>
        </TabsList></div>
        <ScrollArea className="flex-1 p-4 sm:p-6">
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-0 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card><CardContent className="p-4 text-center"><Users className="h-6 w-6 mx-auto mb-2 text-primary"/><p className="text-2xl font-bold">{employees.length}</p><p className="text-xs text-muted-foreground">Employees</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><GraduationCap className="h-6 w-6 mx-auto mb-2 text-primary"/><p className="text-2xl font-bold">{trainings.length}</p><p className="text-xs text-muted-foreground">Trainings</p></CardContent></Card>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={()=>setAdminTab('delete-requests')}><CardContent className="p-4 text-center"><ClipboardList className="h-6 w-6 mx-auto mb-2 text-primary"/><p className="text-2xl font-bold">{deleteRequests.length}</p><p className="text-xs text-muted-foreground">Pending Requests</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><Award className="h-6 w-6 mx-auto mb-2 text-primary"/><p className="text-2xl font-bold">{allAssignments.filter(a=>a.status==='finished').length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
            </div>
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            {auditLogs.length===0?<p className="text-sm text-muted-foreground">No activity recorded yet</p>:
            <div className="space-y-2 max-h-96 overflow-y-auto">{auditLogs.slice(0,20).map((log:any)=>(
              <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg border text-xs">
                <Badge variant="outline" className="text-[9px] flex-shrink-0">{log.action}</Badge>
                <span className="text-muted-foreground">{log.targetType}</span>
                <span className="font-medium truncate flex-1">{log.targetName}</span>
                {log.oldValue&&<span className="text-muted-foreground">from &quot;{log.oldValue}&quot; to &quot;{log.newValue}&quot;</span>}
                <span className="text-muted-foreground flex-shrink-0">by {log.performedBy}</span>
                <span className="text-muted-foreground flex-shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}</div>}
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="mt-0 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Employees ({employees.length})</h3>
              <Button className="gap-1" onClick={()=>setShowNewEmployee(true)}><Plus className="h-4 w-4"/>Add Employee</Button>
            </div>
            {employees.length===0?<p className="text-muted-foreground text-center py-8">No employees yet</p>:
            <div className="space-y-3">{employees.map(emp=>(
              <div key={emp.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div><p className="font-medium">{emp.name}</p><p className="text-xs text-muted-foreground">ID: {emp.employeeId}</p></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={()=>{setShowResetPassword(true);}}><KeyRound className="h-3 w-3"/>Reset Pass</Button>
                  <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {emp.name}?</AlertDialogTitle><AlertDialogDescription>This will remove the employee and all their training assignments.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteEmployee(emp.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}</div>}
          </TabsContent>

          {/* TRAININGS TAB */}
          <TabsContent value="trainings" className="mt-0 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Trainings ({trainings.length})</h3>
              <Button className="gap-1" onClick={()=>setShowNewTraining(true)}><Plus className="h-4 w-4"/>New Training</Button>
            </div>
            {trainings.length===0?<p className="text-muted-foreground text-center py-8">No trainings yet</p>:
            <div className="space-y-3">{trainings.map(t=>(
              <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div><p className="font-medium">{t.title}</p><div className="flex items-center gap-2 text-xs text-muted-foreground mt-1"><span>{t.category}</span><Badge variant="outline" className="text-[9px]">{t.difficulty}</Badge><span>{parseQuestions(t.questions||'[]').length} questions</span></div></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={()=>{setAssignTrainingId(t.id);setSelectedEmployeeIds(new Set());setShowAssignTraining(true);}}><Users className="h-3 w-3"/>Assign</Button>
                  <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete training?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async()=>{await fetch(`/api/trainings/${t.id}`,{method:'DELETE'});fetchTrainings();fetchAllAssignments();toast({title:'Deleted'});}}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}</div>}
          </TabsContent>

          {/* ASSIGNMENTS TAB */}
          <TabsContent value="assignments" className="mt-0 max-w-5xl mx-auto">
            <h3 className="font-semibold mb-4">All Assignments</h3>
            {allAssignments.length===0?<p className="text-muted-foreground text-center py-8">No assignments yet</p>:
            <div className="space-y-3">{allAssignments.map(a=>(
              <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">{a.training?.title||'Training'}</p>
                  <p className="text-xs text-muted-foreground">Employee: {a.employee?.name||a.employeeId} • Attempt: {a.attempts}/{a.maxAttempts}</p>
                  {a.dueDate&&<p className="text-xs text-muted-foreground">Due: {new Date(a.dueDate).toLocaleDateString()}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status==='due'?'secondary':a.status==='in_progress'?'default':'outline'} className="text-[10px]">{a.status}</Badge>
                  {a.score!==null&&<span className="text-xs font-semibold">{a.score}%</span>}
                  {a.retakeRequested&&!a.retakeApproved&&<Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-amber-500/50 text-amber-600" onClick={()=>handleApproveRetake(a.id)}><CheckCircle2 className="h-3 w-3"/>Approve Retake</Button>}
                  {a.retakeRequested&&<Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-600">Retake Requested</Badge>}
                </div>
              </div>
            ))}</div>}
          </TabsContent>

          {/* AUDIT LOG TAB */}
          <TabsContent value="audit" className="mt-0 max-w-5xl mx-auto">
            <h3 className="font-semibold mb-4">Audit Log</h3>
            {auditLogs.length===0?<p className="text-muted-foreground text-center py-8">No audit logs yet</p>:
            <div className="space-y-2">{auditLogs.map((log:any)=>(
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border text-xs">
                <Badge variant="outline" className="text-[9px] flex-shrink-0">{log.action}</Badge>
                <span className="text-muted-foreground w-20 flex-shrink-0">{log.targetType}</span>
                <span className="font-medium truncate flex-1">{log.targetName}</span>
                {log.oldValue&&<span className="text-muted-foreground">&quot;{log.oldValue}&quot; → &quot;{log.newValue}&quot;</span>}
                <span className="text-muted-foreground flex-shrink-0">by {log.performedBy}</span>
                <span className="text-muted-foreground flex-shrink-0 w-36 text-right">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}</div>}
          </TabsContent>

          {/* DELETE REQUESTS TAB */}
          <TabsContent value="delete-requests" className="mt-0 max-w-3xl mx-auto">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Trash2 className="h-5 w-5"/>Delete Requests</h3>
            {deleteRequests.length===0?<p className="text-muted-foreground text-center py-8">No pending delete requests</p>:
            <div className="space-y-3">{deleteRequests.map(req=>(
              <div key={req.id} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{req.targetName}</span>
                  <Badge variant="outline" className="text-[10px]">{req.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Requested by: <span className="font-medium">{req.requestedBy}</span></p>
                {req.reason&&<p className="text-sm text-muted-foreground bg-muted p-2 rounded">&quot;{req.reason}&quot;</p>}
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1" onClick={async()=>{
                    const r=await fetch(`/api/delete-requests/${req.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'approve',reviewedBy:'admin'})});
                    if(r.ok){toast({title:'Approved & Deleted'});fetchDeleteRequests();fetchProjects();fetchDirectChats();fetchBusinessChats();fetchProjectLocks();}
                    else{const d=await r.json().catch(()=>({}));toast({title:'Error',description:d.error||'Failed',variant:'destructive'});}
                  }}><CheckCircle2 className="h-3 w-3"/>Approve & Delete</Button>
                  <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={async()=>{
                    const r=await fetch(`/api/delete-requests/${req.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reject',reviewedBy:'admin'})});
                    if(r.ok){toast({title:'Rejected'});fetchDeleteRequests();}
                    else toast({title:'Error',variant:'destructive'});
                  }}><XCircle className="h-3 w-3"/>Reject</Button>
                </div>
              </div>
            ))}</div>}
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="mt-0 max-w-3xl mx-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4"/>Email / SMTP Settings</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {smtpConfigured ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                      <CheckCircle2 className="h-4 w-4 text-green-600"/><span className="text-xs text-green-600 font-medium">SMTP is configured — OTP will be sent to your email</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <Mail className="h-4 w-4 text-amber-600"/><span className="text-xs text-amber-600 font-medium">SMTP not configured — OTP will be shown on screen instead of email</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Configure your email provider SMTP settings to receive OTP codes via email for password reset. Common providers: Gmail (smtp.gmail.com:587), Outlook (smtp.office365.com:587), SendGrid (smtp.sendgrid.net:587).</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>SMTP Host</Label><Input value={smtpHost} onChange={e=>setSmtpHost(e.target.value)} placeholder="smtp.gmail.com"/></div>
                    <div><Label>Port</Label><Input value={smtpPort} onChange={e=>setSmtpPort(e.target.value)} placeholder="587"/></div>
                  </div>
                  <div><Label>SMTP Username (Email)</Label><Input value={smtpUser} onChange={e=>setSmtpUser(e.target.value)} placeholder="your-email@gmail.com" type="email"/></div>
                  <div><Label>SMTP Password {smtpConfigured?'(leave blank to keep current)':''}</Label><Input value={smtpPass} onChange={e=>setSmtpPass(e.target.value)} placeholder="App password" type="password"/></div>
                  <div><Label>From Email (optional)</Label><Input value={smtpFrom} onChange={e=>setSmtpFrom(e.target.value)} placeholder="Defaults to SMTP username"/></div>
                  <Separator/>
                  <div><Label>Admin Password (required to save)</Label><Input value={smtpPassword} onChange={e=>setSmtpPassword(e.target.value)} placeholder="Enter your current admin password" type="password"/></div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSmtp} disabled={smtpSaving||!smtpPassword.trim()} className="flex-1">{smtpSaving?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:null}Save SMTP Settings</Button>
                    <Button variant="outline" onClick={handleTestSmtp} disabled={smtpTesting||!smtpHost.trim()||!smtpUser.trim()}>{smtpTesting?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:null}Test Connection</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label>Current Password</Label><Input value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} type="password"/></div>
                  <div><Label>New Password</Label><Input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password"/></div>
                  <Button onClick={handleChangePassword} disabled={!currentPassword.trim()||!newPassword.trim()}>Change Password</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Reset Password (OTP to Email)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {smtpConfigured&&(
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                      <CheckCircle2 className="h-4 w-4 text-green-600"/><span className="text-xs text-green-600 font-medium">OTP will be sent to {adminEmail}</span>
                    </div>
                  )}
                  {!smtpConfigured&&(
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <Mail className="h-4 w-4 text-amber-600"/><span className="text-xs text-amber-600 font-medium">SMTP not configured. OTP will be shown on screen for instant access.</span>
                    </div>
                  )}
                  {adminResetStep==='request'?(
                    <Button onClick={handleAdminResetRequest} disabled={!adminEmail} className="w-full"><Mail className="h-4 w-4 mr-2"/>Send OTP to Email</Button>
                  ):(
                    <div className="space-y-3">
                      {generatedOtp&&<div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30"><span className="text-xs font-medium">Your OTP:</span><code className="text-lg font-bold text-primary tracking-widest">{generatedOtp}</code></div>}
                      {smtpConfigured&&<p className="text-xs text-muted-foreground">OTP also sent to {adminEmail} (may take a few minutes).</p>}
                      <div><Label>OTP</Label><Input value={adminResetOtp} onChange={e=>setAdminResetOtp(e.target.value)} placeholder="Enter OTP from above"/></div>
                      <div><Label>New Password</Label><Input value={adminResetNewPass} onChange={e=>setAdminResetNewPass(e.target.value)} type="password"/></div>
                      <Button onClick={handleAdminResetVerify} disabled={!adminResetOtp.trim()||!adminResetNewPass.trim()} className="w-full">Verify & Reset</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Update Admin Email</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label>New Email</Label><Input value={adminNewEmail} onChange={e=>setAdminNewEmail(e.target.value)} placeholder="new-email@example.com" type="email"/></div>
                  <div><Label>Current Password</Label><Input value={adminEmailPassword} onChange={e=>setAdminEmailPassword(e.target.value)} type="password"/></div>
                  <Button onClick={handleUpdateEmail} disabled={!adminNewEmail.trim()||!adminEmailPassword.trim()}>Update Email</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Bulk Hide</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">Hide multiple chats or projects from employees at once.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=>{setShowBulkHide(true);}}>Hide All Direct Chats</Button>
                    <Button variant="outline" size="sm" onClick={()=>{setShowBulkHide(true);}}>Hide All Projects</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Dashboard Dialogs */}
      <Dialog open={showNewEmployee} onOpenChange={v=>{setShowNewEmployee(v);if(!v){setNewEmpName('');setNewEmpPass('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Create Employee</DialogTitle><DialogDescription>Add a new employee with login credentials</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name *</Label><Input value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} placeholder="John Doe" autoFocus onKeyDown={e=>e.key==='Enter'&&handleCreateEmployee()}/></div>
            <div><Label>Initial Password</Label><Input value={newEmpPass} onChange={e=>setNewEmpPass(e.target.value)} placeholder="Defaults to password123" type="password"/></div>
            <Button onClick={handleCreateEmployee} disabled={!newEmpName.trim()} className="w-full"><Plus className="h-4 w-4 mr-2"/>Create Employee</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showNewTraining} onOpenChange={v=>{setShowNewTraining(v);if(!v){setNewTrainingTitle('');setNewTrainingCategory('');setNewTrainingDifficulty('beginner');setNewTrainingVideoUrl('');setNewTrainingDesc('');}}}>
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
              <div className="space-y-2 max-h-60 overflow-y-auto">{newTrainingQuestions.map((q:any,i)=>(
                <div key={i} className="p-2 rounded-lg border text-xs"><p className="font-medium">Q{i+1}: {q.question}</p><p className="text-muted-foreground">A: {q.options.a} | B: {q.options.b} | C: {q.options.c} | D: {q.options.d}</p></div>
              ))}</div>
            )}
            <Button onClick={handleCreateTraining} disabled={!newTrainingTitle.trim()||!newTrainingCategory.trim()} className="w-full"><GraduationCap className="h-4 w-4 mr-2"/>Create Training</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showAssignTraining} onOpenChange={v=>{setShowAssignTraining(v);if(!v){setAssignTrainingId(null);setSelectedEmployeeIds(new Set());setNewTrainingDueDate('');}}}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Assign Training</DialogTitle><DialogDescription>Select employees and set a due date</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Due Date (optional)</Label><Input type="date" value={newTrainingDueDate} onChange={e=>setNewTrainingDueDate(e.target.value)}/></div>
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
      <Dialog open={showResetPassword} onOpenChange={v=>{setShowResetPassword(v);if(!v){setResetEmpPass('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Reset Employee Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Employee: {employees.find(e=>e.id===resetEmpId)?.name}</p>
            <div><Label>New Password *</Label><Input value={resetEmpPass} onChange={e=>setResetEmpPass(e.target.value)} placeholder="Enter new password" type="password"/></div>
            <Button onClick={handleResetEmployeePassword} disabled={!resetEmpPass.trim()} className="w-full">Reset Password</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showChangePassword} onOpenChange={v=>{setShowChangePassword(v);if(!v){setCurrentPassword('');setNewPassword('');setAdminResetStep('request');setAdminResetOtp('');setAdminResetNewPass('');}}}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/>Password Management</DialogTitle></DialogHeader>
          <Tabs defaultValue="change" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="change" className="text-xs gap-1"><KeyRound className="h-3 w-3"/>Change Password</TabsTrigger>
              <TabsTrigger value="reset" className="text-xs gap-1"><Mail className="h-3 w-3"/>Reset via Email</TabsTrigger>
            </TabsList>
            <TabsContent value="change" className="mt-3">
              <div className="space-y-3">
                <div><Label>Current Password</Label><Input value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} type="password"/></div>
                <div><Label>New Password</Label><Input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password"/></div>
                <Button onClick={handleChangePassword} disabled={!currentPassword.trim()||!newPassword.trim()} className="w-full">Change Password</Button>
              </div>
            </TabsContent>
            <TabsContent value="reset" className="mt-3">
              <div className="space-y-3">
                {adminEmail&&<div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"><Mail className="h-4 w-4 text-primary flex-shrink-0"/><span className="text-sm font-medium truncate">{adminEmail}</span></div>}
                {!adminEmail&&<p className="text-xs text-destructive">Admin email not found. Please log in again.</p>}
                {smtpConfigured?(
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600"/><span className="text-xs text-green-600 font-medium">OTP shown on screen + sent to your email</span>
                  </div>
                ):(
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <Mail className="h-4 w-4 text-amber-600"/><span className="text-xs text-amber-600 font-medium">OTP always shown on screen for instant access. Configure SMTP in Dashboard → Settings for email delivery too.</span>
                  </div>
                )}
                {adminResetStep==='request'?(
                  <div className="space-y-2">
                    <Button onClick={handleAdminResetRequest} disabled={!adminEmail} className="w-full"><Mail className="h-4 w-4 mr-2"/>Send OTP to Email</Button>
                  </div>
                ):(
                  <div className="space-y-2">
                    {generatedOtp&&<div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30"><span className="text-xs font-medium">Your OTP:</span><code className="text-lg font-bold text-primary tracking-widest">{generatedOtp}</code></div>}
                    {smtpConfigured&&<p className="text-xs text-muted-foreground">OTP also sent to {adminEmail} (may take a few minutes).</p>}
                    <div><Label>OTP</Label><Input value={adminResetOtp} onChange={e=>setAdminResetOtp(e.target.value)} placeholder="Enter OTP from above"/></div>
                    <div><Label>New Password</Label><Input value={adminResetNewPass} onChange={e=>setAdminResetNewPass(e.target.value)} type="password"/></div>
                    <Button onClick={handleAdminResetVerify} disabled={!adminResetOtp.trim()||!adminResetNewPass.trim()} className="w-full">Verify & Reset</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteRequests} onOpenChange={setShowDeleteRequests}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>Deletion Requests</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {deleteRequests.length===0?<p className="text-sm text-muted-foreground">No pending requests</p>:
            deleteRequests.map(req=>(
              <div key={req.id} className="p-3 rounded-lg border space-y-2">
                <div className="flex items-center justify-between"><span className="font-medium text-sm">{req.targetName}</span><Badge variant="outline" className="text-[9px]">{req.type}</Badge></div>
                <p className="text-xs text-muted-foreground">By: {req.requestedBy} • Reason: {req.reason}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={async()=>{const r=await fetch(`/api/delete-requests/${req.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'approve',reviewedBy:'admin'})});if(r.ok){fetchDeleteRequests();fetchProjects();fetchDirectChats();fetchBusinessChats();fetchProjectLocks();toast({title:'Approved & Deleted'});}else toast({title:'Error',variant:'destructive'});}}><CheckCircle2 className="h-3 w-3"/>Approve</Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1 text-destructive" onClick={async()=>{const r=await fetch(`/api/delete-requests/${req.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reject',reviewedBy:'admin'})});if(r.ok){fetchDeleteRequests();toast({title:'Rejected'});}else toast({title:'Error',variant:'destructive'});}}><XCircle className="h-3 w-3"/>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showBulkHide} onOpenChange={v=>{setShowBulkHide(v);if(!v)setBulkHideSelection(new Set());}}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bulk Hide {bulkHideType==='direct_chats'?'Direct Chats':'Projects'}</DialogTitle>
          <DialogDescription>Uncheck items you want to keep visible. Checked items will be hidden from employees.</DialogDescription></DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(bulkHideType==='direct_chats'?visibleDirectChats:visibleProjects).map((item:any)=>(
              <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${bulkHideSelection.has(item.id)?'bg-primary/10 border-primary':'hover:bg-muted'}`}
                onClick={()=>setBulkHideSelection(prev=>{const n=new Set(prev);if(n.has(item.id))n.delete(item.id);else n.add(item.id);return n;})}>
                <div className={`h-4 w-4 rounded border ${bulkHideSelection.has(item.id)?'bg-primary border-primary':'border-border'} flex items-center justify-center`}>
                  {bulkHideSelection.has(item.id)&&<Check className="h-3 w-3 text-primary-foreground"/>}
                </div>
                <span className="text-sm truncate">{item.title||item.name}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowBulkHide(false)}>Cancel</Button>
            <Button onClick={handleBulkHide} disabled={bulkHideSelection.size===0}>
              <EyeOff className="h-4 w-4 mr-2"/>Hide {bulkHideSelection.size} Item{bulkHideSelection.size!==1?'s':''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
