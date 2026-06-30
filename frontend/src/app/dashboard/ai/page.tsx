'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  MessageSquare, 
  Compass, 
  Send, 
  Loader2, 
  ChevronRight, 
  Check, 
  X,
  RotateCcw, 
  PlusCircle,
  HelpCircle as QuizIcon
} from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: { [key: string]: string };
  answer: string;
}

export default function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState<'doubt' | 'recommend' | 'quiz'>('doubt');

  // --- Doubt Solver State ---
  const [doubtCourse, setDoubtCourse] = useState('');
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');
  const [doubtLoading, setDoubtLoading] = useState(false);

  // --- Recommender State ---
  const [recRecommendations, setRecRecommendations] = useState('');
  const [recLoading, setRecLoading] = useState(false);

  // --- Quiz State ---
  const [quizTopic, setQuizTopic] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizError, setQuizError] = useState('');
  const [quizFinished, setQuizFinished] = useState(false);

  // Fetch enrolled courses to feed to the recommender
  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments-for-recommender'],
    queryFn: async () => {
      const response = await api.get('/enrollments/my');
      return response.data.success ? response.data.data : [];
    },
  });

  // --- Doubt Solver Action ---
  const handleAskDoubt = async () => {
    if (!doubtQuestion.trim()) return;
    setDoubtAnswer('');
    setDoubtLoading(true);

    try {
      const response = await api.post('/ai/doubt', {
        question: doubtQuestion,
        courseName: doubtCourse || 'Programming',
        model: 'gemini',
      });
      if (response.data.success && response.data.data?.answer) {
        setDoubtAnswer(response.data.data.answer);
      } else {
        setDoubtAnswer('Failed to get answer.');
      }
    } catch (e) {
      setDoubtAnswer('Error connecting to backend. Verify your Spring Boot server is running.');
    } finally {
      setDoubtLoading(false);
    }
  };

  // --- Recommender Action ---
  const handleGetRecommendations = async () => {
    setRecLoading(true);
    setRecRecommendations('');

    try {
      const courseTitles = enrollments ? enrollments.map((e: any) => e.courseTitle) : [];
      const response = await api.post('/ai/recommend', {
        enrolledCourses: courseTitles,
        model: 'gemini',
      });
      if (response.data.success && response.data.data?.recommendations) {
        setRecRecommendations(response.data.data.recommendations);
      } else {
        setRecRecommendations('No recommendations could be generated at this time.');
      }
    } catch (e) {
      setRecRecommendations('Failed to fetch recommendations. Ensure backend is running.');
    } finally {
      setRecLoading(false);
    }
  };

  // --- Quiz Action ---
  const handleGenerateQuiz = async (topicString?: string) => {
    const topic = topicString || quizTopic;
    if (!topic.trim()) return;

    setQuizTopic(topic);
    setQuizLoading(true);
    setQuizError('');
    setQuizQuestions([]);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizSelected(null);
    setQuizFinished(false);

    try {
      const response = await api.post('/ai/quiz', {
        topic,
        model: 'gemini',
      });

      if (response.data.success && response.data.data?.quiz) {
        const rawJson = response.data.data.quiz;
        const json = rawJson.replace(/```json|```/g, '').trim();
        const parsed: QuizQuestion[] = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuizQuestions(parsed);
        } else {
          setQuizError('AI returned invalid quiz structure. Try again.');
        }
      } else {
        setQuizError('Failed to generate quiz.');
      }
    } catch (e: any) {
      console.warn('Error generating quiz:', e.message || e);
      setQuizError('Error generating quiz. Please verify backend is running.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectAnswer = (key: string) => {
    if (quizSelected) return;
    setQuizSelected(key);

    const currentQuestion = quizQuestions[quizIndex];
    if (key === currentQuestion.answer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    setQuizSelected(null);
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
      try {
        await api.post('/ai/quiz/attempt', {
          topic: quizTopic,
          score: quizScore,
          totalQuestions: quizQuestions.length
        });
      } catch (e: any) {
        console.warn('Failed to save quiz attempt:', e.message || e);
      }
    }
  };

  const handleResetQuiz = () => {
    setQuizQuestions([]);
    setQuizTopic('');
    setQuizFinished(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-5xl mx-auto text-foreground"
    >
      
      {/* Premium Gradient Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-bg-secondary-dark via-card-dark to-surface-dark p-6 rounded-3xl border border-border-color shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-72 h-72 bg-accent-grape/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-grape to-primary-blue rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-lg shadow-accent-grape/20">
              🤖
            </div>
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-accent-blue bg-accent-blue/10 px-2.5 py-0.5 rounded-full border border-accent-blue/20 uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-accent-blue animate-ping"></span>
                Google Gemini Core Active
              </span>
              <h3 className="text-xl font-black tracking-tight text-white">AI Assistant Hub</h3>
              <p className="text-text-secondary text-xs max-w-md leading-relaxed">
                Unlock instant doubt solvers, paths recommendations, and custom test builders powered by state-of-the-art model structures.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border-color gap-6 select-none">
        <button
          onClick={() => setActiveTab('doubt')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'doubt'
              ? 'border-accent-grape text-accent-grape'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Doubt Solver
        </button>
        <button
          onClick={() => setActiveTab('recommend')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'recommend'
              ? 'border-accent-grape text-accent-grape'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" /> Course Recommender
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'quiz'
              ? 'border-accent-grape text-accent-grape'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <QuizIcon className="w-4 h-4" /> Live Quiz Generator
        </button>
      </div>

      {/* WORKSPACE VIEW WITH FRAMER MOTION */}
      <div className="min-h-[45vh]">
        <AnimatePresence mode="wait">
          
          {/* 1. Tab Content: Doubt Solver */}
          {activeTab === 'doubt' && (
            <motion.div
              key="doubt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6 rounded-3xl space-y-6"
            >
              <div>
                <h4 className="font-black text-white text-base">Ask Your Doubt</h4>
                <p className="text-xs text-text-secondary mt-1">
                  Ask any programming or conceptual question and receive interactive explanations immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-2">Subject / Course Name</label>
                  <input
                    type="text"
                    value={doubtCourse}
                    onChange={(e) => setDoubtCourse(e.target.value)}
                    placeholder="e.g. React.js, SQL, AWS."
                    className="w-full px-4 py-3 bg-white/5 border border-border-color rounded-xl text-xs text-white placeholder-text-muted focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-2">Your Question</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={doubtQuestion}
                      onChange={(e) => setDoubtQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskDoubt()}
                      placeholder="e.g. Explain how useEffect dependency array works."
                      className="w-full pl-4 pr-12 py-3 bg-white/5 border border-border-color rounded-xl text-xs text-white placeholder-text-muted focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape transition-all"
                    />
                    <button
                      onClick={handleAskDoubt}
                      disabled={doubtLoading || !doubtQuestion.trim()}
                      className="absolute right-2 top-2 p-1.5 bg-gradient-to-r from-accent-grape to-primary-blue disabled:from-slate-800 disabled:to-slate-800 text-white rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center"
                    >
                      {doubtLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {doubtAnswer && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-5 bg-accent-grape/5 border border-accent-grape/20 rounded-2xl space-y-3 shadow-inner"
                >
                  <span className="text-xs font-bold text-accent-grape flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 animate-pulse" /> AI Doubt Solver Answer:
                  </span>
                  <p className="text-text-secondary text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{doubtAnswer}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 2. Tab Content: Recommender */}
          {activeTab === 'recommend' && (
            <motion.div
              key="recommend"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6 rounded-3xl space-y-6"
            >
              <div>
                <h4 className="font-black text-white text-base">Personalized Course Recommender</h4>
                <p className="text-xs text-text-secondary mt-1">
                  Gemini will analyze your active course enrollments and recommend professional paths to study next.
                </p>
              </div>

              <div>
                <button
                  onClick={handleGetRecommendations}
                  disabled={recLoading}
                  className="px-6 py-3.5 bg-gradient-to-r from-accent-grape to-primary-blue text-white rounded-xl shadow-lg shadow-accent-grape/10 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {recLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing learning paths...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Get My Recommendations
                    </>
                  )}
                </button>
              </div>

              {recRecommendations && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-5 bg-accent-grape/5 border border-accent-grape/20 rounded-2xl space-y-3 shadow-inner"
                >
                  <span className="text-xs font-bold text-accent-grape flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 animate-pulse" /> Recommended Pathways:
                  </span>
                  <p className="text-text-secondary text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{recRecommendations}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 3. Tab Content: Quiz Generator */}
          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6 rounded-3xl space-y-6"
            >
              
              {/* Setup Screen */}
              {quizQuestions.length === 0 && !quizLoading && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-black text-white text-base">AI Live Quiz Generator</h4>
                    <p className="text-xs text-text-secondary mt-1">
                      Enter a tech topic and Gemini will compile a customized 5-question multiple choice test.
                    </p>
                  </div>

                  <div className="max-w-md flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
                      placeholder="e.g. React Hooks, SQL Joins, Docker Basics."
                      className="flex-1 px-4 py-3 bg-white/5 border border-border-color rounded-xl text-xs text-white placeholder-text-muted focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape transition-all"
                    />
                    <button
                      onClick={() => handleGenerateQuiz()}
                      disabled={!quizTopic.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-accent-grape to-primary-blue hover:from-accent-grape/95 hover:to-primary-blue/95 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      Generate
                    </button>
                  </div>

                  {quizError && (
                    <div className="p-3 bg-error/5 border border-error/20 rounded-xl text-xs text-error">
                      {quizError}
                    </div>
                  )}

                  {/* Popular Topics */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-extrabold text-text-muted uppercase block tracking-wider">Popular Topics</span>
                    <div className="flex flex-wrap gap-2.5">
                      {['React Hooks', 'SQL Joins', 'Docker Containers', 'Spring Boot REST', 'AWS IAM'].map(top => (
                        <button
                          key={top}
                          onClick={() => handleGenerateQuiz(top)}
                          className="px-3.5 py-2 bg-white/5 hover:bg-gradient-to-r hover:from-accent-grape hover:to-primary-blue border border-border-color hover:border-accent-grape text-text-secondary hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-[1.01]"
                        >
                          {top}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Loading Screen */}
              {quizLoading && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-grape" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-black text-white">Generating Quiz Questions.</p>
                    <p className="text-xs text-text-secondary">Gemini is creating a custom multiple-choice test on {quizTopic}.</p>
                  </div>
                </div>
              )}

              {/* Live Quiz Screen - Upgraded to match visual mockup perfectly */}
              {quizQuestions.length > 0 && !quizFinished && (
                <div className="space-y-6">
                  {/* Quiz Header */}
                  <div className="flex justify-between items-center border-b border-border-color pb-4">
                    <div>
                      <span className="text-[9px] bg-accent-grape/10 text-accent-grape border border-accent-grape/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Live Challenge
                      </span>
                      <h4 className="text-lg font-black text-white mt-1.5">{quizTopic} Quiz</h4>
                    </div>
                    <span className="text-xs font-extrabold text-white bg-white/5 border border-border-color px-3 py-1.5 rounded-xl">
                      {quizIndex + 1} / {quizQuestions.length}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-bg-secondary-dark h-1.5 rounded-full overflow-hidden border border-border-color">
                    <div 
                      className="bg-gradient-to-r from-accent-grape to-primary-blue h-full transition-all duration-300"
                      style={{ width: `${((quizIndex) / quizQuestions.length) * 100}%` }}
                    />
                  </div>

                  {/* Question */}
                  <p className="text-sm sm:text-base font-black text-white leading-snug">
                    Q{quizIndex + 1}. {quizQuestions[quizIndex].question}
                  </p>

                  {/* Options (Matching "IMPROVED QUIZ FEEDBACK" Mockup) */}
                  <div className="grid grid-cols-1 gap-3.5 max-w-2xl select-none">
                    {Object.entries(quizQuestions[quizIndex].options).map(([key, val]) => {
                      const isChosen = quizSelected === key;
                      const isCorrect = key === quizQuestions[quizIndex].answer;
                      const showFeedback = quizSelected !== null;

                      // Determine colors and layouts exactly matching the visual mockup
                      let cardStyle = 'bg-white/5 border-border-color hover:bg-white/10 hover:border-accent-grape/40 text-text-secondary';
                      let letterStyle = 'bg-white/10 text-white';
                      
                      if (showFeedback) {
                        if (isCorrect) {
                          // Correct Option (Outlined in solid green with a checkmark on the right)
                          cardStyle = 'bg-success/10 border-success text-success shadow-[0_0_15px_rgba(34,197,94,0.1)]';
                          letterStyle = 'bg-success text-white';
                        } else if (isChosen) {
                          // Chosen Wrong Option (Outlined in solid red with a crossmark on the right)
                          cardStyle = 'bg-error/10 border-error text-error shadow-[0_0_15px_rgba(239,68,68,0.1)]';
                          letterStyle = 'bg-error text-white';
                        } else {
                          // Other Unchosen Options (Semi-translucent / faded)
                          cardStyle = 'opacity-40 bg-white/5 border-border-color text-text-muted cursor-default';
                          letterStyle = 'bg-white/5 text-text-muted';
                        }
                      }

                      return (
                        <button
                          key={key}
                          disabled={showFeedback}
                          onClick={() => handleSelectAnswer(key)}
                          className={`p-4 rounded-xl border text-left text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${cardStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold uppercase shrink-0 ${letterStyle}`}>
                              {key}
                            </span>
                            <span>{val}</span>
                          </div>
                          
                          {/* Right Feedback Indicators */}
                          {showFeedback && (isCorrect || isChosen) && (
                            <div className="shrink-0 ml-2">
                              {isCorrect ? (
                                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center text-white shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                                  <Check className="w-3 h-3 stroke-[3px]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-error flex items-center justify-center text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                                  <X className="w-3 h-3 stroke-[3px]" />
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next navigation & Custom Bottom Feedback (Matching Mockup) */}
                  {quizSelected && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-border-color max-w-2xl"
                    >
                      {/* Left Feedback Banner */}
                      <div className="flex-1">
                        {quizSelected === quizQuestions[quizIndex].answer ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-success/10 border border-success/20 rounded-xl text-success font-bold text-xs">
                            <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center text-white">
                              <Check className="w-2.5 h-2.5 stroke-[3px]" />
                            </div>
                            <span>Correct! Well done.</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-error/10 border border-error/20 rounded-xl text-error font-bold text-xs">
                            <div className="w-4 h-4 rounded-full bg-error flex items-center justify-center text-white">
                              <X className="w-2.5 h-2.5 stroke-[3px]" />
                            </div>
                            <span className="line-clamp-1">Incorrect. Correct: {quizQuestions[quizIndex].answer}) {quizQuestions[quizIndex].options[quizQuestions[quizIndex].answer]}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Right Next Button */}
                      <button
                        onClick={handleNextQuestion}
                        className="px-6 py-3.5 bg-gradient-to-r from-accent-grape to-primary-blue text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {quizIndex + 1 < quizQuestions.length ? 'Next Question' : 'See Results'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Results Screen */}
              {quizFinished && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center max-w-lg mx-auto py-8 space-y-6"
                >
                  <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto border-4 ${
                    (quizScore / quizQuestions.length) >= 0.8
                      ? 'bg-success/5 border-success text-success shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                      : (quizScore / quizQuestions.length) >= 0.5
                        ? 'bg-warning/5 border-warning text-warning shadow-[0_0_15px_rgba(250,204,21,0.15)]'
                        : 'bg-error/5 border-error text-error shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                  }`}>
                    <span className="text-3xl font-black">{quizScore}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">out of {quizQuestions.length}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white">
                      {(quizScore / quizQuestions.length) >= 0.8 
                        ? 'Excellent job. 🌟' 
                        : (quizScore / quizQuestions.length) >= 0.5
                          ? 'Good effort. 👍' 
                          : 'Keep practicing. 💪'}
                    </h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                      You scored {quizScore}/{quizQuestions.length} on your custom generated {quizTopic} test.
                    </p>
                  </div>

                  {/* Review area */}
                  <div className="text-left space-y-3.5 pt-6 border-t border-border-color">
                    <p className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">Review Questions</p>
                    <div className="space-y-4">
                      {quizQuestions.map((q, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-border-color space-y-2 text-xs leading-relaxed">
                          <p className="font-black text-white">Q{idx + 1}. {q.question}</p>
                          <p className="text-[10px] text-success font-bold uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-4 h-4" /> Correct: {q.answer}) {q.options[q.answer]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Retry actions */}
                  <div className="flex gap-3 justify-center pt-6 border-t border-border-color">
                    <button
                      onClick={() => handleGenerateQuiz(quizTopic)}
                      className="px-5 py-3 bg-gradient-to-r from-accent-grape to-primary-blue text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry Topic
                    </button>
                    <button
                      onClick={handleResetQuiz}
                      className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-border-color text-text-secondary hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-text-muted mr-1 inline-block" />
                      New Topic
                    </button>
                  </div>
                </motion.div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </motion.div>
  );
}
