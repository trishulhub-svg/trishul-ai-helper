'use client';

import { X, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ExtractedCodeBlock } from './types';
import { getLanguage } from './utils';
import { useState } from 'react';

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

export interface CodePanelProps {
  codePanelOpen: boolean;
  codePanelContent: {code:string;language:string}|null;
  codePanelTab: 'current'|'all';
  setCodePanelTab: (v: 'current'|'all') => void;
  setCodePanelOpen: (v: boolean) => void;
  allCodeBlocks: ExtractedCodeBlock[];
  isMobile: boolean;
}

export function CodePanel({ codePanelOpen, codePanelContent, codePanelTab, setCodePanelTab, setCodePanelOpen, allCodeBlocks, isMobile }: CodePanelProps) {
  if (!codePanelOpen || !codePanelContent) return null;

  return (
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
  );
}
