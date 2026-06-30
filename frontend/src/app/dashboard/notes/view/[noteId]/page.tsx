'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import SecurePdfViewer from '@/components/SecurePdfViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Bot, 
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
    { sender: 'ai', text: 'Hi. I am your AI Study Assistant. I have analyzed this note and can explain complex topics, summarize chapters, or generate key study points. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch note details
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
      <div className="h-[70vh] flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-300">
        <Loader2 className="w-12 h-12 animate-spin text-accent-grape" />
        <p className="mt-4 text-text-secondary font-medium text-sm">Loading secure PDF container.</p>
      </div>
    );
  }

  const title = noteMetadata?.title || 'Lecture Note';
  const courseTitle = noteMetadata?.courseTitle || 'Classroom Folder';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-6xl mx-auto relative min-h-[80vh] text-foreground"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <button 
            onClick={() => {
              if (noteMetadata?.courseId) {
                router.push(`/dashboard/notes/course/${noteMetadata.courseId}`);
              } else {
                router.push('/dashboard/notes');
              }
            }}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Folder
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-accent-grape shrink-0" />
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Course: <strong className="text-white font-bold">{courseTitle}</strong>
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
        <div className={`glass-card rounded-3xl overflow-hidden flex flex-col h-[75vh] transition-all duration-300 ${
          chatOpen ? 'opacity-100 scale-100 relative z-30' : 'hidden lg:flex lg:opacity-100 lg:scale-100'
        }`}>
          {/* Panel Header */}
          <div className="p-4 bg-gradient-to-r from-accent-grape/20 via-primary-blue/5 to-white/0 border-b border-border-color flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-accent-grape/15 rounded-xl flex items-center justify-center text-accent-grape border border-accent-grape/20">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">AI Notes Assistant</h3>
                <span className="text-[9px] text-success font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-success absolute"></span>
                  <span className="pl-2">Active Node</span>
                </span>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="lg:hidden p-1.5 hover:bg-white/5 rounded-xl text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="p-3 bg-white/5 border-b border-border-color flex flex-wrap gap-2">
            <button
              onClick={() => triggerQuickAction('SUMMARY')}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-gradient-to-r hover:from-accent-grape hover:to-primary-blue border border-border-color hover:border-accent-grape rounded-xl text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-accent-grape" />
              Summarize Note
            </button>
            <button
              onClick={() => triggerQuickAction('KEY_POINTS')}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-gradient-to-r hover:from-accent-grape hover:to-primary-blue border border-border-color hover:border-accent-grape rounded-xl text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3 h-3 text-secondary-blue" />
              Key Points
            </button>
            <button
              onClick={() => triggerQuickAction('VIVA')}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-gradient-to-r hover:from-accent-grape hover:to-primary-blue border border-border-color hover:border-accent-grape rounded-xl text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <HelpCircle className="w-3 h-3 text-warning" />
              Generate Viva
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-accent-grape to-primary-blue text-white rounded-br-none'
                      : 'bg-white/5 border border-border-color text-text-secondary rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {aiLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/5 border border-border-color px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2.5 text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-accent-grape" />
                  <span className="text-xs font-semibold">AI is analyzing note context.</span>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Highlight Notification */}
          {selectedText && (
            <div className="p-2.5 bg-accent-grape/10 border-t border-accent-grape/20 px-4 flex items-center justify-between text-[10px] text-accent-grape font-bold select-none animate-in slide-in-from-bottom-2 duration-150">
              <span className="truncate max-w-[80%]">Selected: &ldquo;{selectedText}&rdquo;</span>
              <button 
                onClick={() => setSelectedText('')}
                className="text-text-muted hover:text-white"
              >
                Clear
              </button>
            </div>
          )}

          {/* Input Panel */}
          <div className="p-4 border-t border-border-color bg-bg-secondary">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder={selectedText ? "Ask about selected text." : "Ask a question about this note."}
                disabled={aiLoading}
                className="flex-1 px-4 py-3 bg-background border border-border-color rounded-xl text-xs text-white placeholder-text-muted focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape disabled:opacity-50"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={aiLoading || (!input.trim() && !selectedText)}
                className="p-3 bg-gradient-to-r from-accent-grape to-primary-blue hover:from-accent-grape/90 hover:to-primary-blue/90 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl transition-all shadow-md shadow-accent-grape/15 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center disabled:opacity-50 shrink-0"
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
        className="fixed bottom-6 right-6 z-40 lg:hidden w-14 h-14 bg-gradient-to-br from-accent-grape to-primary-blue text-white rounded-full flex items-center justify-center shadow-xl shadow-accent-grape/35 border border-accent-grape/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="AI Notes Assistant"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-success"></span>
        </span>
      </button>

    </motion.div>
  );
}
