'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Save, Eye, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Message } from './types';
import { getLanguage } from './utils';

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
export function ChatMessage({ message, projectId, onFilesUpdated, onViewCode }: {
  message: Message; projectId: string | null; onFilesUpdated: () => void;
  onViewCode: (code: string, language: string) => void;
}) {
  const isUser = message.role === 'user';
  const attachments = message.attachments || [];

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-lg bg-card">
          <img src="/trishul-logo.png" alt="AI" className="h-full w-full object-contain p-0.5" />
        </div>
      )}
      <div className="max-w-[92%] sm:max-w-[85%] min-w-0">
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1.5">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative">
                {att.type === 'image' ? (
                  <a href={att.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={att.url}
                      alt={att.name}
                      className="max-h-48 max-w-[280px] rounded-lg border border-border object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <a href={att.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 transition-colors text-xs">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate max-w-[160px]">{att.name}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
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
