'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import SecurePdfViewer from '@/components/SecurePdfViewer';
import { 
  ArrowLeft, 
  Bot, 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  FileText, 
  Sparkles, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface NoteDTO {
  id: number;
  title: string;
  description: string;
  courseId: number;
  courseTitle: string;
  lessonTitle: string | null;
  aiEnabled: boolean;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export default function NoteViewPage() {
  const { noteId } = useParams();
  const router = useRouter();
  
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hi! I am your AI Study Assistant. I have analyzed this note and can explain topics, summarize chapters, or generate key study points. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch note details with correct endpoint
  const { data: noteMetadata, isLoading: metaLoading } = useQuery<NoteDTO>({
    queryKey: ['note-metadata', noteId],
    queryFn: async () => {
      const response = await api.get(`/student/notes/${noteId}`);
      return response.data.success ? response.data.data : null;
    }
  });

  // 3. Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  // 4. Handle text selection inside the window
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection) {
        const text = selection.toString().trim();
        if (text.length > 0 && text.length < 500) {
          setSelectedText(text);
        }
      }
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const handleSend = async (textToSend: string, mode: string = 'ASK') => {
    if (!textToSend.trim() && !selectedText) return;
    
    const userMessage = textToSend.trim() || `Explain selected text: "${selectedText}"`;
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setAiLoading(true);

    try {
      const response = await api.post(`/student/notes/${noteId}/ask-ai`, {
        question: userMessage,
        selectedText: selectedText,
        mode: mode
      });

      const reply = response.data.success ? response.data.data.answer : 'Sorry, I failed to generate an answer.';
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      setSelectedText('');
    } catch (err: any) {
      console.warn('AI chat failed:', err.message || err);
      const errMsg = err.response?.data?.message || 'The AI assistant is currently offline or the provider keys are missing. AI notes assistant will be available soon.';
      setMessages(prev => [...prev, { sender: 'ai', text: errMsg }]);
    } finally {
      setAiLoading(false);
    }
  };

  const triggerQuickAction = (actionType: 'SUMMARY' | 'KEY_POINTS' | 'VIVA') => {
    let question = '';
    if (actionType === 'SUMMARY') question = 'Provide a comprehensive summary of this note chapter.';
    if (actionType === 'KEY_POINTS') question = 'Generate the top 5 key study points and takeaways from these notes.';
    if (actionType === 'VIVA') question = 'Act as an examiner. Generate 3 technical viva / interview prep questions based on this note, along with short model answers.';

    handleSend(question, actionType);
  };

  if (metaLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="mt-4 text-slate-405 font-medium text-sm">Loading secure PDF container...</p>
      </div>
    );
  }

  const title = noteMetadata?.title || 'Lecture Note';
  const courseTitle = noteMetadata?.courseTitle || 'Classroom Folder';

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative min-h-[80vh]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => {
              if (noteMetadata?.courseId) {
                router.push(`/dashboard/notes/course/${noteMetadata.courseId}`);
              } else {
                router.push('/dashboard/notes');
              }
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-450 hover:text-slate-900 dark:hover:text-slate-205 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Course Folder
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500 shrink-0" />
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Course: <strong className="text-slate-700 dark:text-slate-300">{courseTitle}</strong>
            {noteMetadata?.lessonTitle && ` | Lesson: ${noteMetadata.lessonTitle}`}
          </p>
        </div>
      </div>

      {/* Grid: PDF Viewer + Chat Sidebar drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        
        {/* Left 2 Cols: Secure PDF Viewer */}
        <div className="lg:col-span-2">
          <SecurePdfViewer 
            noteId={Number(noteId)} 
            courseTitle={courseTitle} 
            noteTitle={title} 
          />
        </div>

        {/* Right Col: Inline/Drawer Chat Panel */}
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[75vh] transition-all duration-300 ${
          chatOpen ? 'opacity-100 scale-100 relative' : 'hidden lg:flex lg:opacity-100 lg:scale-100'
        }`}>
          {/* Panel Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">AI Notes Assistant</h3>
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</span>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="lg:hidden p-1.5 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="p-3 bg-slate-50/50 dark:bg-slate-850/20 border-b border-slate-200/60 dark:border-slate-800/40 flex flex-wrap gap-2">
            <button
              onClick={() => triggerQuickAction('SUMMARY')}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Summarize Note
            </button>
            <button
              onClick={() => triggerQuickAction('KEY_POINTS')}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3 h-3 text-teal-500" />
              Key Points
            </button>
            <button
              onClick={() => triggerQuickAction('VIVA')}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <HelpCircle className="w-3 h-3 text-amber-500" />
              Generate Viva
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-750 dark:text-slate-200 border border-slate-200/40 dark:border-slate-850 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-250/20 dark:border-slate-850 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-xs font-medium">AI is reviewing note context...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Highlight Notification */}
          {selectedText && (
            <div className="p-2.5 bg-indigo-500/10 border-t border-indigo-500/20 px-4 flex items-center justify-between text-[10px] text-indigo-400 font-bold select-none animate-in slide-in-from-bottom-2 duration-150">
              <span className="truncate max-w-[80%]">Selected: &ldquo;{selectedText}&rdquo;</span>
              <button 
                onClick={() => setSelectedText('')}
                className="text-slate-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          )}

          {/* Input Panel */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder={selectedText ? "Ask about selected text..." : "Ask a question about this note..."}
                disabled={aiLoading}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={aiLoading || (!input.trim() && !selectedText)}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white rounded-xl transition-all shadow-md shadow-indigo-650/10 cursor-pointer flex items-center justify-center disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 6. Floating AI Assistant Bubble (Desktop & Mobile trigger) */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-40 lg:hidden w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-650/25 border-2 border-indigo-400/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="AI Notes Assistant"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
        </span>
      </button>

    </div>
  );
}
