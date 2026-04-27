'use client';

import {
  Plus, FolderOpen, FileCode2, Trash2, ChevronRight, ChevronDown,
  MessageSquare, Pencil, FolderPlus, FilePlus, X, Sparkles,
  Shield, User, LogOut, KeyRound, ClipboardList, CheckCircle2,
  Unlock, GraduationCap, Settings, EyeOff, Eye, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Project, Conversation, CodeFile, DeleteRequest } from './types';

export interface SidebarProps {
  isAdmin: boolean;
  employeeName: string;
  // Data
  projects: Project[];
  visibleProjects: Project[];
  directChats: Conversation[];
  businessChats: Conversation[];
  visibleDirectChats: Conversation[];
  currentProject: Project | null;
  projectFiles: CodeFile[];
  projectLocks: Record<string,{lockedBy:string;lockedAt:string}>;
  directChatLocks: Record<string,{lockedBy:string;lockedAt:string}>;
  // Selections
  selectedProjectId: string | null;
  selectedConversationId: string | null;
  selectedDirectChatId: string | null;
  selectedBusinessChatId: string | null;
  expandedProjects: Set<string>;
  // Auth state
  lockedProjectId: string | null;
  lockedDirectChatId: string | null;
  deleteRequests: DeleteRequest[];
  dueTrainingsCount: number;
  retakeRequestedCount: number;
  // Editing
  editingId: string | null;
  editingType: 'project'|'chat'|null;
  editingValue: string;
  setEditingValue: (v: string) => void;
  // Handlers
  setActiveView: (v: 'chat'|'training'|'dashboard') => void;
  fetchAuditLogs: () => void;
  setShowDeleteRequests: (v: boolean) => void;
  setShowChangePassword: (v: boolean) => void;
  handleEndDirectChat: () => void;
  handleEndAndSave: () => void;
  handleLogout: () => void;
  handleNewDirectChat: () => void;
  handleNewBusinessChat: () => void;
  handleNewChat: () => void;
  setShowNewProject: (v: boolean) => void;
  setShowNewFile: (v: boolean) => void;
  setShowAddCode: (v: boolean) => void;
  wrappedSetSelectedProjectId: (id: string|null) => void;
  setSelectedDirectChatId: (id: string|null) => void;
  setSelectedBusinessChatId: (id: string|null) => void;
  setSelectedConversationId: (id: string|null) => void;
  setChatMode: (v: 'none'|'direct'|'business'|'project') => void;
  toggleProjectExpand: (id: string) => void;
  handleSelectDirectChat: (id: string) => void;
  handleToggleChatHide: (id: string) => void;
  handleStartRename: (id: string, type: 'project'|'chat', currentName: string) => void;
  handleSaveRename: () => void;
  handleDeleteProject: (id: string) => void;
  handleDeleteConversation: (id: string) => void;
  handleDeleteDirectChat: (id: string) => void;
  handleDeleteFile: (id: string) => void;
  handleViewFile: (file: CodeFile) => void;
  handleToggleProjectLock: (id: string) => void;
  // Bulk hide
  setBulkHideType: (v: 'direct_chats'|'projects') => void;
  setBulkHideSelection: (v: Set<string>) => void;
  setShowBulkHide: (v: boolean) => void;
  // Mobile
  isMobile: boolean;
  setMobileSheetOpen: (v: boolean) => void;
  setEditingId: (v: string|null) => void;
}

export function Sidebar(props: SidebarProps) {
  const {
    isAdmin, employeeName, projects, visibleProjects, directChats, businessChats,
    visibleDirectChats, currentProject, projectFiles, projectLocks, directChatLocks,
    selectedProjectId, selectedConversationId, selectedDirectChatId, selectedBusinessChatId,
    expandedProjects, lockedProjectId, lockedDirectChatId, deleteRequests, dueTrainingsCount,
    retakeRequestedCount, editingId, editingType, editingValue, setEditingValue,
    setActiveView, fetchAuditLogs, setShowDeleteRequests, setShowChangePassword,
    handleEndDirectChat, handleEndAndSave, handleLogout, handleNewDirectChat,
    handleNewBusinessChat, handleNewChat, setShowNewProject, setShowNewFile, setShowAddCode,
    wrappedSetSelectedProjectId, setSelectedDirectChatId, setSelectedBusinessChatId,
    setSelectedConversationId, setChatMode, toggleProjectExpand, handleSelectDirectChat,
    handleToggleChatHide, handleStartRename, handleSaveRename, handleDeleteProject,
    handleDeleteConversation, handleDeleteDirectChat, handleDeleteFile, handleViewFile,
    handleToggleProjectLock, setBulkHideType, setBulkHideSelection, setShowBulkHide,
    isMobile, setMobileSheetOpen, setEditingId,
  } = props;

  return (
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
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 relative" onClick={()=>{setActiveView('dashboard');fetchAuditLogs();}}>
              <Settings className="h-3 w-3"/>Dashboard
              {(retakeRequestedCount>0||deleteRequests.length>0)&&<Badge variant="destructive" className="h-4 min-w-4 px-1 text-[8px] absolute -top-1 -right-1">{retakeRequestedCount+deleteRequests.length}</Badge>}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 relative" onClick={()=>setShowDeleteRequests(true)}>
              <ClipboardList className="h-3 w-3"/>Requests
              {deleteRequests.length>0&&<Badge variant="destructive" className="h-4 min-w-4 px-1 text-[8px] absolute -top-1 -right-1">{deleteRequests.length}</Badge>}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={()=>setShowChangePassword(true)}><KeyRound className="h-3 w-3"/>Pass</Button>
            {lockedDirectChatId&&<Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 border-amber-500/50 text-amber-600" onClick={handleEndDirectChat}><Unlock className="h-3 w-3"/>End Chat</Button>}
            <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-destructive hover:text-destructive" onClick={handleLogout}><LogOut className="h-3 w-3"/></Button>
          </div>
        )}

        {!isAdmin && (
          <div className="space-y-1.5 mb-2">
            {(lockedProjectId||lockedDirectChatId) && (
              <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1.5 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10" onClick={lockedProjectId?handleEndAndSave:handleEndDirectChat}><Unlock className="h-3 w-3"/>End & Save</Button>
            )}
            <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1.5 relative" onClick={()=>setActiveView('training')}>
              <GraduationCap className="h-3 w-3"/>My Training
              {dueTrainingsCount>0&&<Badge variant="destructive" className="h-4 min-w-4 px-1 text-[8px] absolute -top-1 -right-1">{dueTrainingsCount}</Badge>}
            </Button>
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
              <div className="flex items-center justify-between px-2 mb-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Business Agent</p>
              </div>
              {businessChats.map(c=>(
                <div key={c.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group ${selectedBusinessChatId===c.id?'bg-primary/10 text-primary font-medium':c.isHidden?'opacity-50':'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={()=>{setSelectedBusinessChatId(c.id);setSelectedDirectChatId(null);setSelectedProjectId(null);setSelectedConversationId(null);setChatMode('business');if(isMobile)setMobileSheetOpen(false);}}>
                  <Briefcase className="h-3 w-3 flex-shrink-0 text-amber-500"/>
                  {editingId===c.id&&editingType==='chat'?(
                    <input className="flex-1 bg-background border rounded px-1 py-0 text-xs min-w-0" value={editingValue} onChange={e=>setEditingValue(e.target.value)} onBlur={handleSaveRename} onKeyDown={e=>{if(e.key==='Enter')handleSaveRename();if(e.key==='Escape')setEditingId(null);}} autoFocus/>
                  ):(
                    <span className="truncate flex-1" onDoubleClick={e=>{e.stopPropagation();handleStartRename(c.id,'chat',c.title);}}>{c.title}</span>
                  )}
                  <Badge className="h-4 px-1 text-[8px] bg-amber-500/20 text-amber-600 border-amber-500/30 flex-shrink-0">BA</Badge>
                  {isAdmin&&<Button variant="ghost" size="icon" className={`h-5 w-5 opacity-0 group-hover:opacity-100 ${c.isHidden?'text-red-500':'text-muted-foreground'}`} onClick={e=>{e.stopPropagation();handleToggleChatHide(c.id);}} title={c.isHidden?'Unhide':'Hide'}><EyeOff className="h-2.5 w-2.5"/></Button>}
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={e=>{e.stopPropagation();handleStartRename(c.id,'chat',c.title);}}><Pencil className="h-2.5 w-2.5"/></Button>
                  {isAdmin?(
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 group-hover:opacity-100 text-destructive hover:text-destructive" title="Delete chat" onClick={e=>e.stopPropagation()}><Trash2 className="h-2.5 w-2.5"/></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Business Chat?</AlertDialogTitle><AlertDialogDescription>Delete &quot;{c.title}&quot;? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteDirectChat(c.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  ):(
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 group-hover:opacity-100 text-orange-500 hover:text-orange-600" title="Request deletion" onClick={e=>{e.stopPropagation();handleDeleteDirectChat(c.id);}}><Trash2 className="h-2.5 w-2.5"/></Button>
                  )}
                </div>
              ))}
              <div className="border-t my-2"/>
            </div>
          )}

          {/* Direct Chats */}
          {visibleDirectChats.length>0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between px-2 mb-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Direct Chats</p>
                {isAdmin&&<Button variant="ghost" size="icon" className="h-4 w-4" onClick={()=>{setBulkHideType('direct_chats');setBulkHideSelection(new Set(visibleDirectChats.map(c=>c.id)));setShowBulkHide(true);}} title="Bulk hide"><EyeOff className="h-2.5 w-2.5"/></Button>}
              </div>
              {visibleDirectChats.map(c=>{
                const lockInfo=directChatLocks[c.id];const isLockedByOther=lockInfo&&lockInfo.lockedBy!==employeeName&&!isAdmin;
                return(
                <div key={c.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group ${selectedDirectChatId===c.id?'bg-primary/10 text-primary font-medium':c.isHidden?'opacity-50':isLockedByOther?'opacity-60':'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={()=>handleSelectDirectChat(c.id)}>
                  <Sparkles className="h-3 w-3 flex-shrink-0 text-emerald-500"/>
                  {editingId===c.id&&editingType==='chat'?(
                    <input className="flex-1 bg-background border rounded px-1 py-0 text-xs min-w-0" value={editingValue} onChange={e=>setEditingValue(e.target.value)} onBlur={handleSaveRename} onKeyDown={e=>{if(e.key==='Enter')handleSaveRename();if(e.key==='Escape')setEditingId(null);}} autoFocus/>
                  ):(
                    <span className="truncate flex-1" onDoubleClick={e=>{e.stopPropagation();handleStartRename(c.id,'chat',c.title);}}>{c.title}</span>
                  )}
                  <Badge className="h-4 px-1 text-[8px] bg-emerald-500/20 text-emerald-600 border-emerald-500/30 flex-shrink-0">Direct</Badge>
                  {lockInfo&&<Badge variant="outline" className="h-4 px-1 text-[8px] gap-0.5 border-green-500/50 text-green-600 flex-shrink-0 bg-green-500/10"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"/>{lockInfo.lockedBy}</Badge>}
                  {c.isHidden&&isAdmin&&<Badge variant="outline" className="h-4 px-1 text-[8px] border-red-500/50 text-red-500 bg-red-500/10">Hidden</Badge>}
                  {isAdmin&&<Button variant="ghost" size="icon" className={`h-5 w-5 opacity-0 group-hover:opacity-100 ${c.isHidden?'text-red-500':'text-muted-foreground'}`} onClick={e=>{e.stopPropagation();handleToggleChatHide(c.id);}} title={c.isHidden?'Unhide':'Hide'}><EyeOff className="h-2.5 w-2.5"/></Button>}
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={e=>{e.stopPropagation();handleStartRename(c.id,'chat',c.title);}}><Pencil className="h-2.5 w-2.5"/></Button>
                  {isAdmin?(
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 group-hover:opacity-100 text-destructive hover:text-destructive" title="Delete chat" onClick={e=>e.stopPropagation()}><Trash2 className="h-2.5 w-2.5"/></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Direct Chat?</AlertDialogTitle><AlertDialogDescription>Delete &quot;{c.title}&quot;? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteDirectChat(c.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  ):(
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 group-hover:opacity-100 text-orange-500 hover:text-orange-600" title="Request deletion" onClick={e=>{e.stopPropagation();handleDeleteDirectChat(c.id);}}><Trash2 className="h-2.5 w-2.5"/></Button>
                  )}
                </div>
              );})}
              <div className="border-t my-2"/>
            </div>
          )}

          {/* Projects */}
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Projects</p>
            {isAdmin&&<Button variant="ghost" size="icon" className="h-4 w-4" onClick={()=>{setBulkHideType('projects');setBulkHideSelection(new Set(visibleProjects.map(p=>p.id)));setShowBulkHide(true);}} title="Bulk hide"><EyeOff className="h-2.5 w-2.5"/></Button>}
          </div>
          {visibleProjects.length===0?(
            <div className="text-center py-4 text-muted-foreground text-sm"><FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30"/><p className="text-xs">No projects yet</p></div>
          ):visibleProjects.map(project=>{
            const lockInfo=projectLocks[project.id];const isLocked=!!lockInfo;const isLockedByMe=lockInfo?.lockedBy===employeeName&&!isAdmin;const isLockedByOther=isLocked&&!isLockedByMe&&!isAdmin;
            return(
              <div key={project.id} className="mb-0.5">
                <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${selectedProjectId===project.id?'bg-primary/10 text-primary':'hover:bg-muted'} ${isLockedByOther?'opacity-70':''}`}
                  onClick={()=>{wrappedSetSelectedProjectId(project.id);setSelectedDirectChatId(null);setSelectedBusinessChatId(null);setChatMode('project');toggleProjectExpand(project.id);if(isMobile)setMobileSheetOpen(false);}}>
                  {expandedProjects.has(project.id)&&selectedProjectId===project.id?<ChevronDown className="h-3.5 w-3.5 flex-shrink-0"/>:<ChevronRight className="h-3.5 w-3.5 flex-shrink-0"/>}
                  <FolderOpen className="h-4 w-4 flex-shrink-0"/>
                  {editingId===project.id&&editingType==='project'?(
                    <input className="flex-1 bg-background border rounded px-1 py-0 text-xs min-w-0" value={editingValue} onChange={e=>setEditingValue(e.target.value)} onBlur={handleSaveRename} onKeyDown={e=>{if(e.key==='Enter')handleSaveRename();if(e.key==='Escape')setEditingId(null);}} autoFocus/>
                  ):(
                    <span className="text-xs sm:text-sm font-medium truncate flex-1" onDoubleClick={e=>{e.stopPropagation();handleStartRename(project.id,'project',project.name);}}>{project.name}</span>
                  )}
                  {/* Admin lock toggle */}
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className={`h-5 w-5 ${project.isLocked?'text-red-500':'text-muted-foreground'}`} onClick={e=>{e.stopPropagation();handleToggleProjectLock(project.id);}} title={project.isLocked?'Hidden from employees':'Visible to employees'}>
                      {project.isLocked?<EyeOff className="h-3 w-3"/>:<Eye className="h-3 w-3"/>}
                    </Button>
                  )}
                  {/* Rename button */}
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground" onClick={e=>{e.stopPropagation();handleStartRename(project.id,'project',project.name);}} title="Rename"><Pencil className="h-2.5 w-2.5"/></Button>
                  {/* Live indicator */}
                  {isLocked && <Badge variant="outline" className="h-4 px-1 text-[8px] gap-0.5 border-green-500/50 text-green-600 flex-shrink-0 bg-green-500/10"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"/>{lockInfo.lockedBy}</Badge>}
                  {/* Admin locked badge */}
                  {project.isLocked && isAdmin && <Badge variant="outline" className="h-4 px-1 text-[8px] border-red-500/50 text-red-500 bg-red-500/10">Hidden</Badge>}
                  {/* Delete */}
                  {isAdmin?(
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-40 group-hover:opacity-100 transition-opacity" title="Delete project" onClick={e=>e.stopPropagation()}><Trash2 className="h-3 w-3 text-destructive"/></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Project?</AlertDialogTitle><AlertDialogDescription>Delete &quot;{project.name}&quot; and all its data.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteProject(project.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  ):(
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-40 group-hover:opacity-100 transition-opacity text-orange-500 hover:text-orange-600" title="Request deletion" onClick={e=>{e.stopPropagation();handleDeleteProject(project.id);}}><Trash2 className="h-3 w-3"/></Button>
                  )}
                </div>
                {expandedProjects.has(project.id)&&selectedProjectId===project.id&&(
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {currentProject?.conversations?.map(conv=>(
                      <div key={conv.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group ${selectedConversationId===conv.id?'bg-primary/10 text-primary font-medium':'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        onClick={()=>{setSelectedConversationId(conv.id);if(isMobile)setMobileSheetOpen(false);}}>
                        <MessageSquare className="h-3 w-3 flex-shrink-0"/><span className="truncate flex-1">{conv.title}</span>
                        {isAdmin?(
                          <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 group-hover:opacity-100 text-destructive hover:text-destructive" title="Delete chat" onClick={e=>e.stopPropagation()}><Trash2 className="h-2.5 w-2.5"/></Button></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Chat?</AlertDialogTitle><AlertDialogDescription>Delete &quot;{conv.title}&quot;? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteConversation(conv.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                        ):(
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 group-hover:opacity-100 text-orange-500 hover:text-orange-600" title="Request deletion" onClick={e=>{e.stopPropagation();handleDeleteConversation(conv.id);}}><Trash2 className="h-2.5 w-2.5"/></Button>
                        )}
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
}
