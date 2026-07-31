'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  MessageSquare, 
  Compass, 
  Send, 
  Loader2, 
  ChevronRight, 
  Check, 
  X,
  RotateCcw, 
  Plus,
  HelpCircle,
  Sparkles,
  BookOpen
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

  // Fetch student's assigned batch details
  const { data: studentBatch } = useQuery<any>({
    queryKey: ['student-batch-my-ai'],
    queryFn: async () => {
      const response = await api.get('/student/batch/my');
      return response.data.success ? response.data.data : null;
    },
  });

  // Fetch student's batch notes for note-specific topics
  const { data: studentNotes = [] } = useQuery<any[]>({
    queryKey: ['student-batch-notes-ai'],
    queryFn: async () => {
      const response = await api.get('/student/batch/notes');
      return response.data.success ? response.data.data : [];
    },
  });

  // Compute dynamic subjects and popular topics
  const batchSubjects = studentBatch?.subjects 
    ? Array.from(studentBatch.subjects) 
    : ['Science', 'Mathematics', 'English', 'Hindi', 'Social Science'];

  const getDynamicQuizTopics = (): string[] => {
    if (studentNotes && studentNotes.length > 0) {
      const noteTitles = studentNotes
        .map((n: any) => n.title)
        .filter(Boolean)
        .slice(0, 5);
      if (noteTitles.length >= 3) {
        return noteTitles;
      }
    }

    const level = studentBatch?.level || '';
    if (level.includes('Class V') || level.includes('Class 5')) {
      return ['Fractions & Decimals', 'Plants & Animals', 'English Grammar', 'EVS Basics'];
    }
    if (level.includes('Class VI') || level.includes('Class 6')) {
      return ['Whole Numbers', 'Food & Components', 'History: Early States', 'Earth & Climate'];
    }
    if (level.includes('Class VII') || level.includes('Class 7')) {
      return ['Integers & Equations', 'Nutrition in Plants', 'Mughal Empire', 'Weather & Climate'];
    }
    if (level.includes('Class VIII') || level.includes('Class 8')) {
      return ['Linear Equations', 'Cell Structure', 'Force & Pressure', 'Constitutional Rights'];
    }
    if (level.includes('Class IX') || level.includes('Class 9')) {
      return ['Number Systems', 'Matter in Surroundings', 'Force & Laws of Motion', 'French Revolution'];
    }
    if (level.includes('Class X') || level.includes('Class 10')) {
      return ['Quadratic Equations', 'Chemical Reactions', 'Life Processes', 'Light Reflection'];
    }

    return ['Force & Motion', 'Algebra Formulas', 'Organic Chemistry', 'Cell Biology'];
  };

  const popularTopics = getDynamicQuizTopics();

  // --- Doubt Solver Action ---
  const handleAskDoubt = async () => {
    if (!doubtQuestion.trim()) return;
    setDoubtAnswer('');
    setDoubtLoading(true);

    try {
      const response = await api.post('/ai/doubt', {
        question: doubtQuestion,
        courseName: doubtCourse || 'General Subject',
        model: 'gemini',
      });
      if (response.data.success && response.data.data?.answer) {
        setDoubtAnswer(response.data.data.answer);
      } else {
        setDoubtAnswer('Failed to retrieve an answer at this time.');
      }
    } catch (e) {
      setDoubtAnswer('Error connecting to backend server. Please verify the API is running.');
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
          setQuizError('Invalid quiz structure received. Please try again.');
        }
      } else {
        setQuizError('Failed to generate quiz questions.');
      }
    } catch (e: any) {
      setQuizError('Error connecting to backend server to generate quiz.');
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
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100 pb-20 px-2 sm:px-4 pt-2">
      
      {/* Clean Header */}
      <div className="pb-4 border-b border-slate-800/80">
        <h1 className="text-xl font-bold tracking-tight text-white">Charlie AI Study Assistant</h1>
        <p className="text-sm text-slate-400 mt-1">
          Resolve complex conceptual questions, receive tailored learning path recommendations, or practice with live generated quizzes.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('doubt')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'doubt'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Doubt Solver</span>
        </button>

        <button
          onClick={() => setActiveTab('recommend')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'recommend'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Course Recommender</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'quiz'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Quiz Generator</span>
        </button>
      </div>

      {/* WORKSPACE VIEW */}
      <div className="min-h-[400px]">
        
        {/* TAB 1: DOUBT SOLVER */}
        {activeTab === 'doubt' && (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div className="border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-semibold text-white">Ask a Study Question</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your academic subject and type your conceptual question for detailed explanations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Subject / Course</label>
                <select
                  value={doubtCourse}
                  onChange={(e) => setDoubtCourse(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-slate-700 cursor-pointer"
                >
                  <option value="">All Subjects</option>
                  {batchSubjects.map((sub: any) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-medium text-slate-300">Your Doubt or Question</label>
                <div className="relative">
                  <input
                    type="text"
                    value={doubtQuestion}
                    onChange={(e) => setDoubtQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskDoubt()}
                    placeholder="e.g. Explain Newton's First Law or quadratic formulas..."
                    className="w-full pl-4 pr-24 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
                  />
                  <button
                    onClick={handleAskDoubt}
                    disabled={doubtLoading || !doubtQuestion.trim()}
                    className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors disabled:text-slate-500 cursor-pointer flex items-center gap-1.5"
                  >
                    {doubtLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Ask</span>}
                  </button>
                </div>
              </div>
            </div>

            {doubtAnswer && (
              <div className="p-5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explanation & Answer</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {doubtAnswer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECOMMENDER */}
        {activeTab === 'recommend' && (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Tailored Study Recommender</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyze your enrolled coursework and receive structured learning pathways to study next.
                </p>
              </div>

              <button
                onClick={handleGetRecommendations}
                disabled={recLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {recLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" />
                    <span>Analyze Courses</span>
                  </>
                )}
              </button>
            </div>

            {recRecommendations ? (
              <div className="p-5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Recommended Study Pathway</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {recRecommendations}
                </p>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800/50">
                Click "Analyze Courses" above to generate your customized learning roadmap.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUIZ GENERATOR */}
        {activeTab === 'quiz' && (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
            
            {/* Quiz Setup Screen */}
            {quizQuestions.length === 0 && !quizLoading && (
              <div className="space-y-6">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-semibold text-white">Interactive Quiz Generator</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter a specific topic or select from your uploaded batch study notes to create a 5-question test.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
                    placeholder="Enter topic name (e.g. Thermodynamics, Trigonometry, Linear Algebra)..."
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
                  />
                  <button
                    onClick={() => handleGenerateQuiz()}
                    disabled={!quizTopic.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Generate Quiz
                  </button>
                </div>

                {quizError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                    {quizError}
                  </div>
                )}

                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {studentNotes && studentNotes.length > 0 ? "Topics from Your Study Notes" : "Suggested Academic Topics"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {popularTopics.map(top => (
                      <button
                        key={top}
                        onClick={() => handleGenerateQuiz(top)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        {top}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Loading Screen */}
            {quizLoading && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-sm font-medium text-slate-300">Generating quiz questions for &ldquo;{quizTopic}&rdquo;...</p>
              </div>
            )}

            {/* Live Quiz Screen */}
            {quizQuestions.length > 0 && !quizFinished && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-medium text-indigo-400 block">Topic Challenge</span>
                    <h4 className="text-base font-semibold text-white mt-0.5">{quizTopic}</h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                    Question {quizIndex + 1} of {quizQuestions.length}
                  </span>
                </div>

                {/* Subtle Progress bar */}
                <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${((quizIndex) / quizQuestions.length) * 100}%` }}
                  />
                </div>

                <p className="text-sm font-semibold text-slate-200 leading-normal">
                  Q{quizIndex + 1}. {quizQuestions[quizIndex].question}
                </p>

                <div className="space-y-3 select-none">
                  {Object.entries(quizQuestions[quizIndex].options).map(([key, val]) => {
                    const isChosen = quizSelected === key;
                    const isCorrect = key === quizQuestions[quizIndex].answer;
                    const showFeedback = quizSelected !== null;

                    let cardStyle = 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300';
                    let letterStyle = 'bg-slate-900 border border-slate-700 text-slate-400';
                    
                    if (showFeedback) {
                      if (isCorrect) {
                        cardStyle = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300';
                        letterStyle = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                      } else if (isChosen) {
                        cardStyle = 'bg-red-950/40 border-red-500/40 text-red-300';
                        letterStyle = 'bg-red-500/20 text-red-400 border-red-500/30';
                      } else {
                        cardStyle = 'opacity-40 bg-slate-950 border-slate-800 text-slate-500 cursor-default';
                        letterStyle = 'bg-slate-900 border-slate-800 text-slate-600';
                      }
                    }

                    return (
                      <button
                        key={key}
                        disabled={showFeedback}
                        onClick={() => handleSelectAnswer(key)}
                        className={`w-full p-4 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer ${cardStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs shrink-0 ${letterStyle}`}>
                            {key}
                          </span>
                          <span>{val}</span>
                        </div>
                        
                        {showFeedback && (isCorrect || isChosen) && (
                          <div className="shrink-0">
                            {isCorrect ? (
                              <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                            ) : (
                              <X className="w-4 h-4 text-red-400 stroke-[2.5]" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Feedback Bar */}
                {quizSelected && (
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
                    <div className="text-xs">
                      {quizSelected === quizQuestions[quizIndex].answer ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Correct answer!
                        </span>
                      ) : (
                        <span className="text-red-400 font-medium flex items-center gap-1.5">
                          <X className="w-4 h-4" /> Incorrect. Correct option is {quizQuestions[quizIndex].answer}.
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <span>{quizIndex + 1 < quizQuestions.length ? 'Next Question' : 'View Results'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quiz Results Screen */}
            {quizFinished && (
              <div className="text-center max-w-md mx-auto py-8 space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center mx-auto text-white">
                  <span className="text-2xl font-bold font-mono">{quizScore}</span>
                  <span className="text-[10px] font-medium text-slate-500">of {quizQuestions.length}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">
                    {(quizScore / quizQuestions.length) >= 0.8 
                      ? 'Great completion score!' 
                      : 'Quiz evaluation finished.'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    You scored {quizScore} out of {quizQuestions.length} on your {quizTopic} evaluation.
                  </p>
                </div>

                {/* Review Answer Key */}
                <div className="text-left space-y-3 pt-6 border-t border-slate-800/80">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Answer Review</p>
                  <div className="space-y-3">
                    {quizQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                        <p className="font-medium text-slate-200">Q{idx + 1}. {q.question}</p>
                        <p className="text-emerald-400 font-mono">
                          Correct Option ({q.answer}): {q.options[q.answer]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center pt-4">
                  <button
                    onClick={() => handleGenerateQuiz(quizTopic)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Topic</span>
                  </button>
                  <button
                    onClick={handleResetQuiz}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Quiz</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
