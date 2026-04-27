'use client';

import { useState, useEffect, useRef } from 'react';
import { Award, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QuizQuestion } from './types';

// ===================== QUIZ COMPONENT =====================
export function QuizView({ questions, onComplete }: { questions: QuizQuestion[]; onComplete: (answers: Record<string,string>, score: number) => void }) {
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
    questions.forEach((q, i) => { if (answers[i] === q.correctAnswer) correct++; });
    return (
      <div className="space-y-3">
        <div className="text-center p-4">
          <Award className="h-10 w-10 mx-auto mb-2 text-amber-500" />
          <h3 className="text-xl font-bold">Quiz Complete!</h3>
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
