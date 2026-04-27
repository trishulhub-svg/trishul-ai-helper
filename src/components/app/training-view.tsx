'use client';

import { X, Award, CheckCircle2, XCircle, Video, Clock, Play, GraduationCap, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrainingAssignment } from './types';
import { QuizView } from './quiz-view';
import { parseQuestions, getYouTubeEmbedUrl } from './utils';

export interface TrainingViewProps {
  activeTraining: TrainingAssignment | null;
  setActiveTraining: (v: TrainingAssignment | null) => void;
  quizMode: boolean;
  setQuizMode: (v: boolean) => void;
  videoWatched: boolean;
  setVideoWatched: (v: boolean) => void;
  employeeTrainings: TrainingAssignment[];
  fetchEmployeeTrainings: () => void;
  handleStartTraining: (assignment: TrainingAssignment) => void;
  handleCompleteQuiz: (answers: Record<string,string>, score: number) => void;
  handleRequestRetake: (assignmentId: string) => void;
  setActiveView: (v: 'chat'|'training'|'dashboard') => void;
}

export function TrainingView({
  activeTraining, setActiveTraining, quizMode, setQuizMode, videoWatched,
  employeeTrainings, fetchEmployeeTrainings, handleStartTraining, handleCompleteQuiz,
  handleRequestRetake, setActiveView,
}: TrainingViewProps) {
  // Active training with video/quiz
  if (activeTraining && activeTraining.training) {
    const questions = parseQuestions(activeTraining.training.questions||'[]');
    const isFinished = activeTraining.status==='finished';
    const hasRetakeRequest = activeTraining.retakeRequested;
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
          {/* Finished training: show results only (no video) */}
          {isFinished && !quizMode ? (
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Award className="h-10 w-10 mx-auto mb-2 text-amber-500"/>
                <h3 className="text-xl font-bold">Training Completed!</h3>
                <p className="text-2xl font-bold mt-2">{activeTraining.score}%</p>
                <p className="text-sm text-muted-foreground">Score • Attempt {activeTraining.attempts} of {activeTraining.maxAttempts}</p>
                {activeTraining.dueDate && <p className="text-xs text-muted-foreground mt-1">Due: {new Date(activeTraining.dueDate).toLocaleDateString()}</p>}
              </div>
              {questions.length>0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Review Answers</h4>
                  {questions.map((q,i)=>{
                    const userAnswer = activeTraining.answers ? (JSON.parse(activeTraining.answers||'{}')[i]||'') : '';
                    const isCorrect = userAnswer===q.correctAnswer;
                    return(
                      <div key={i} className={`p-3 rounded-lg border ${isCorrect?'border-green-500/50 bg-green-500/5':'border-red-500/50 bg-red-500/5'}`}>
                        <div className="flex items-start gap-2">
                          {isCorrect?<CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5"/>:<XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5"/>}
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1">Q{i+1}: {q.question}</p>
                            <div className="space-y-0.5 text-xs">
                              <p>Your answer: <span className={isCorrect?'text-green-600 font-medium':'text-red-600 font-medium'}>{q.options[userAnswer as keyof typeof q.options]||'Not answered'}</span></p>
                              {!isCorrect&&<p className="text-green-600 font-medium">Correct answer: {q.options[q.correctAnswer as keyof typeof q.options]}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!hasRetakeRequest && (
                <Button variant="outline" className="w-full" onClick={()=>handleRequestRetake(activeTraining.id)}>
                  <ClipboardList className="h-4 w-4 mr-2"/>Request Retake
                </Button>
              )}
              {hasRetakeRequest && !activeTraining.retakeApproved && (
                <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <p className="text-sm text-amber-600">Retake requested — waiting for admin approval</p>
                </div>
              )}
            </div>
          ) : !quizMode ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-black aspect-video">
                {activeTraining.training.videoUrl ? (
                  <iframe src={getYouTubeEmbedUrl(activeTraining.training.videoUrl)} className="w-full h-full" allowFullScreen allow="autoplay" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground"><Video className="h-12 w-12 mb-2 opacity-30" /><p className="text-sm">No video available</p></div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{activeTraining.training.description}</p>
              {activeTraining.dueDate && <p className="text-xs text-muted-foreground"><Clock className="h-3 w-3 inline mr-1"/>Due: {new Date(activeTraining.dueDate).toLocaleDateString()}</p>}
              {questions.length > 0 && activeTraining.status !== 'finished' && (
                <Button onClick={()=>setQuizMode(true)} disabled={!activeTraining.training.videoUrl&&!videoWatched} className="w-full">
                  <Play className="h-4 w-4 mr-2"/>Start Quiz ({questions.length} questions, 10 min)
                </Button>
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
          ):employeeTrainings.map(a=>{
            const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && a.status!=='finished';
            return(
            <Card key={a.id} className={`cursor-pointer hover:border-primary/50 transition-colors ${isOverdue?'border-red-500/50':''}`} onClick={()=>handleStartTraining(a)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{a.training?.title||'Training'}</h3>
                  <Badge variant={isOverdue?'destructive':a.status==='due'?'secondary':a.status==='in_progress'?'default':'outline'} className="text-[10px]">
                    {isOverdue?'Overdue':a.status==='due'?'Due':a.status==='in_progress'?'In Progress':'Finished'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{a.training?.category}</span>
                  <span>{a.training?.difficulty}</span>
                  {a.dueDate&&<span className={isOverdue?'text-red-500 font-semibold':''}><Clock className="h-3 w-3 inline mr-0.5"/>Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                  {a.score!==null&&<span className="font-semibold text-foreground">Score: {a.score}%</span>}
                  {a.retakeRequested&&!a.retakeApproved&&<Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-600">Retake Pending</Badge>}
                </div>
              </CardContent>
            </Card>
          );})}
        </div>
      </ScrollArea>
    </div>
  );
}
