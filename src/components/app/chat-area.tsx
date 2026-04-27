'use client';

import { useRef } from 'react';
import {
  Send, Loader2, Sparkles, FolderPlus, Briefcase, Plus,
  FolderOpen, Menu, Lock, X, Paperclip, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatInput } from './chat-input';
import { ChatMessage } from './chat-message';
import { Message, MessageAttachment } from './types';

export interface ChatAreaProps {
  // Messages
  messages: Message[];
  isLoading: boolean;
  selectedProjectId: string | null;
  onFilesUpdated: () => void;
  onViewCode: (code: string, language: string) => void;
  // Send
  handleSendMessage: (msg?: string) => void;
  chatInputValueRef: React.MutableRefObject<string>;
  chatInputClearSignal: number;
  setChatInputClearSignal: (v: number | ((prev: number) => number)) => void;
  // Header
  chatHeader: string;
  currentChatMode: string;
  selectedBusinessChatId: string | null;
  selectedDirectChatId: string | null;
  isAdmin: boolean;
  // Locks
  lockedProjectId: string | null;
  lockedDirectChatId: string | null;
  isChatLockedForEmployee: boolean;
  // Scroll
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  handleChatScroll: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  // Chat state
  hasActiveChat: boolean;
  chatMode: string;
  selectedConversationId: string | null;
  // Actions
  handleNewDirectChat: () => void;
  handleNewBusinessChat: () => void;
  handleNewChat: () => void;
  setShowNewProject: (v: boolean) => void;
  // Sidebar toggle
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  setMobileSheetOpen: (v: boolean) => void;
  isMobile: boolean;
  // Code panel
  codePanelOpen: boolean;
  setCodePanelOpen: (v: boolean) => void;
  // Attachments
  pendingAttachments: MessageAttachment[];
  uploadingFile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePendingAttachment: (index: number) => void;
  // selectedBusinessChatId for placeholder
  selectedBusinessChatIdForPlaceholder: string | null;
}

export function ChatArea(props: ChatAreaProps) {
  const {
    messages, isLoading, selectedProjectId, onFilesUpdated, onViewCode,
    handleSendMessage, chatInputValueRef, chatInputClearSignal, setChatInputClearSignal,
    chatHeader, currentChatMode, selectedBusinessChatId, selectedDirectChatId, isAdmin,
    lockedProjectId, lockedDirectChatId, isChatLockedForEmployee,
    chatScrollRef, handleChatScroll, messagesEndRef,
    hasActiveChat, chatMode, selectedConversationId,
    handleNewDirectChat, handleNewBusinessChat, handleNewChat, setShowNewProject,
    sidebarOpen, setSidebarOpen, setMobileSheetOpen, isMobile,
    codePanelOpen, setCodePanelOpen,
    pendingAttachments, uploadingFile, fileInputRef, handleFileUpload, removePendingAttachment,
    selectedBusinessChatIdForPlaceholder,
  } = props;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className={`border-b p-2 sm:p-3 flex items-center gap-2 ${currentChatMode==='business'?'bg-amber-500/5 border-amber-500/20':currentChatMode==='direct'?'bg-emerald-500/5 border-emerald-500/20':''}`}>
        {isMobile && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setMobileSheetOpen(true)}><Menu className="h-4 w-4"/></Button>}
        {!isMobile && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setSidebarOpen(!sidebarOpen)}><Menu className="h-4 w-4"/></Button>}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate flex items-center gap-2">
            {currentChatMode==='business' && <><Briefcase className="h-4 w-4 text-amber-500 flex-shrink-0"/><Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px]">BA</Badge></>}
            {currentChatMode==='direct' && !selectedBusinessChatId && <><Sparkles className="h-4 w-4 text-emerald-500 flex-shrink-0"/><Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px]">Direct</Badge></>}
            {chatHeader}
          </h2>
        </div>
        {(lockedProjectId||lockedDirectChatId) && !isAdmin && <Badge variant="outline" className="text-[9px] gap-1 border-emerald-500/50 text-emerald-600"><Lock className="h-2.5 w-2.5"/>Locked</Badge>}
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
        {messages.map(msg=><ChatMessage key={msg.id} message={msg} projectId={selectedProjectId} onFilesUpdated={onFilesUpdated} onViewCode={onViewCode}/>)}
        {isLoading && <div className="flex gap-2 sm:gap-3 justify-start"><div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center bg-card"><img src="/trishul-logo.png" alt="AI" className="h-full w-full object-contain p-0.5"/></div><div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2.5 sm:px-4 sm:py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/></div></div>}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input */}
      <div className="border-t p-2 sm:p-3">
        {isChatLockedForEmployee ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
            <Lock className="h-4 w-4 text-amber-600"/><p className="text-sm text-amber-600">Admin is currently using this chat. You cannot send messages.</p>
          </div>
        ) : (
        <>
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 max-w-4xl mx-auto">
            {pendingAttachments.map((att, idx) => (
              <div key={idx} className="relative group">
                {att.type === 'image' ? (
                  <div className="relative">
                    <img src={att.url} alt={att.name} className="h-16 w-16 object-cover rounded-md border border-border" />
                    <button onClick={() => removePendingAttachment(idx)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-muted text-xs">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate max-w-[100px]">{att.name}</span>
                    <button onClick={() => removePendingAttachment(idx)} className="ml-1 text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 max-w-4xl mx-auto items-end">
          <input ref={fileInputRef} type="file" className="hidden" multiple
            accept="image/*,.pdf,.txt,.csv,.json,.doc,.docx,.xls,.xlsx,.md,.py,.js,.ts,.tsx,.jsx,.html,.css,.java,.cpp,.c,.h,.rb,.go,.rs,.php,.sql,.yaml,.yml,.xml,.sh,.bat"
            onChange={handleFileUpload} />
          <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()} disabled={isLoading || uploadingFile}
            title="Attach file or image">
            {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          <ChatInput
            onSend={(msg) => handleSendMessage(msg)}
            placeholder={selectedBusinessChatIdForPlaceholder?"Ask Trishul B.A. about business strategy...":"Ask anything about code..."}
            disabled={isLoading}
            valueRef={chatInputValueRef}
            clearSignal={chatInputClearSignal}
          />
          <Button onClick={() => { const v = chatInputValueRef.current.trim(); if(v){ handleSendMessage(v); chatInputValueRef.current=''; setChatInputClearSignal(s=>s+1); } }} disabled={isLoading} size="icon" className="h-10 w-10 flex-shrink-0"><Send className="h-4 w-4"/></Button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
