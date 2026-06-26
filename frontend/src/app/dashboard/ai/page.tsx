'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Sparkles, 
  MessageSquare, 
  Compass, 
  HelpCircle, 
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
        // Clean up markdown code fences if present
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
    if (quizSelected) return; // Prevent double selection
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
    <div className="space-y-6">
      
      {/* Premium Gradient Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white p-6 rounded-2xl border border-indigo-700 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/10 text-indigo-200 border border-white/25 rounded-xl flex items-center justify-center text-xl shrink-0">
            🤖
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold tracking-tight">AI Assistant Hub</h3>
            <p className="text-indigo-200 text-xs max-w-md">
              Powered by Google Gemini. Doubt solver, course recommender, and live interactive quiz generator at your service.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('doubt')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'doubt'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-550 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Doubt Solver
        </button>
        <button
          onClick={() => setActiveTab('recommend')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'recommend'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-550 hover:text-slate-700'
          }`}
        >
          <Compass className="w-4 h-4" /> Course Recommender
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'quiz'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-550 hover:text-slate-700'
          }`}
        >
          <QuizIcon className="w-4 h-4" /> Live Quiz Generator
        </button>
      </div>

      {/* --- Tab Content: Doubt Solver --- */}
      {activeTab === 'doubt' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h4 className="font-bold text-slate-900">Ask Your Doubt</h4>
            <p className="text-xs text-slate-500 mt-1">
              Ask any programming or conceptual question — get explanations instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject / Course Name</label>
              <input
                type="text"
                value={doubtCourse}
                onChange={(e) => setDoubtCourse(e.target.value)}
                placeholder="e.g. React.js, SQL, AWS"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Question</label>
              <div className="relative">
                <input
                  type="text"
                  value={doubtQuestion}
                  onChange={(e) => setDoubtQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskDoubt()}
                  placeholder="e.g. Explain how useEffect dependency array works"
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  onClick={handleAskDoubt}
                  disabled={doubtLoading || !doubtQuestion.trim()}
                  className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-all cursor-pointer"
                >
                  {doubtLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {doubtAnswer && (
            <div className="p-5 bg-indigo-50/40 border border-indigo-100/70 rounded-xl space-y-3">
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI doubt Solver Answer:
              </span>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{doubtAnswer}</p>
            </div>
          )}
        </div>
      )}

      {/* --- Tab Content: Recommender --- */}
      {activeTab === 'recommend' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h4 className="font-bold text-slate-900">Personalized Course Recommender</h4>
            <p className="text-xs text-slate-500 mt-1">
              Gemini will analyze your active course enrollments and recommend next paths to study.
            </p>
          </div>

          <div>
            <button
              onClick={handleGetRecommendations}
              disabled={recLoading}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl shadow-lg shadow-indigo-600/10 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              {recLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing paths...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Get My Recommendations
                </>
              )}
            </button>
          </div>

          {recRecommendations && (
            <div className="p-5 bg-indigo-50/40 border border-indigo-100/70 rounded-xl space-y-3">
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Recommended Pathways:
              </span>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{recRecommendations}</p>
            </div>
          )}
        </div>
      )}

      {/* --- Tab Content: Quiz Generator --- */}
      {activeTab === 'quiz' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          
          {/* Setup Screen */}
          {quizQuestions.length === 0 && !quizLoading && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-slate-900">AI Live Quiz Generator</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Enter a topic and Gemini will build a customized 5-question multiple choice test.
                </p>
              </div>

              <div className="max-w-md flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
                  placeholder="e.g. React Hooks, SQL Joins, Docker Basics"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
                <button
                  onClick={() => handleGenerateQuiz()}
                  disabled={!quizTopic.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Generate
                </button>
              </div>

              {quizError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{quizError}</div>}

              {/* Quick Topics */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Popular Topics</span>
                <div className="flex flex-wrap gap-2">
                  {['React Hooks', 'SQL Joins', 'Docker Containers', 'Spring Boot REST', 'AWS IAM'].map(top => (
                    <button
                      key={top}
                      onClick={() => handleGenerateQuiz(top)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-all cursor-pointer"
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
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Generating Quiz Questions...</p>
                <p className="text-xs text-slate-400">Gemini is creating a custom multiple-choice test on {quizTopic}.</p>
              </div>
            </div>
          )}

          {/* Live Quiz Screen */}
          {quizQuestions.length > 0 && !quizFinished && (
            <div className="space-y-6">
              {/* Quiz Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Live Challenge
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 mt-1">{quizTopic} Quiz</h4>
                </div>
                <span className="text-xs font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {quizIndex + 1} / {quizQuestions.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${((quizIndex) / quizQuestions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <p className="text-base font-bold text-slate-800">
                Q{quizIndex + 1}. {quizQuestions[quizIndex].question}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3 max-w-2xl">
                {Object.entries(quizQuestions[quizIndex].options).map(([key, val]) => {
                  const isChosen = quizSelected === key;
                  const isCorrect = key === quizQuestions[quizIndex].answer;
                  const showFeedback = quizSelected !== null;

                  return (
                    <button
                      key={key}
                      disabled={showFeedback}
                      onClick={() => handleSelectAnswer(key)}
                      className={`p-4 rounded-xl border text-left text-sm font-medium flex items-center gap-3 transition-all ${
                        showFeedback
                          ? isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : isChosen
                              ? 'bg-red-50 border-red-300 text-red-800'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          : 'bg-white hover:bg-indigo-50/40 border-slate-200 hover:border-indigo-300 text-slate-700 cursor-pointer'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase shrink-0 ${
                        showFeedback
                          ? isCorrect
                            ? 'bg-emerald-500 text-white'
                            : isChosen
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-100 text-slate-400'
                          : 'bg-slate-50 text-slate-500'
                      }`}>
                        {key}
                      </span>
                      <span>{val}</span>
                    </button>
                  );
                })}
              </div>

              {/* Next navigation */}
              {quizSelected && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 max-w-2xl">
                  <div className="text-xs font-semibold">
                    {quizSelected === quizQuestions[quizIndex].answer ? (
                      <span className="text-emerald-600 flex items-center gap-1">🎉 Correct answer!</span>
                    ) : (
                      <span className="text-red-600">
                        Incorrect. Correct: <strong>{quizQuestions[quizIndex].answer}) {quizQuestions[quizIndex].options[quizQuestions[quizIndex].answer]}</strong>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    {quizIndex + 1 < quizQuestions.length ? 'Next Question' : 'See Results'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Screen */}
          {quizFinished && (
            <div className="text-center max-w-lg mx-auto py-8 space-y-6">
              {/* Score circle */}
              <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto border-4 ${
                (quizScore / quizQuestions.length) >= 0.8
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : (quizScore / quizQuestions.length) >= 0.5
                    ? 'bg-amber-50 border-amber-500 text-amber-700'
                    : 'bg-red-50 border-red-500 text-red-700'
              }`}>
                <span className="text-3xl font-extrabold">{quizScore}</span>
                <span className="text-[10px] font-bold opacity-60">out of {quizQuestions.length}</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900">
                  {(quizScore / quizQuestions.length) >= 0.8 
                    ? 'Excellent job! 🌟' 
                    : (quizScore / quizQuestions.length) >= 0.5
                      ? 'Good effort! 👍' 
                      : 'Keep practicing! 💪'}
                </h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  You scored {quizScore}/{quizQuestions.length} on your custom generated {quizTopic} test.
                </p>
              </div>

              {/* Review area */}
              <div className="text-left space-y-3 pt-6 border-t border-slate-150">
                <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Review Questions</p>
                <div className="space-y-3.5">
                  {quizQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 space-y-2 text-sm bg-slate-50/50">
                      <p className="font-bold text-slate-800">Q{idx + 1}. {q.question}</p>
                      <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Correct: {q.answer}) {q.options[q.answer]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retry actions */}
              <div className="flex gap-3 justify-center pt-6 border-t border-slate-150">
                <button
                  onClick={() => handleGenerateQuiz(quizTopic)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry Topic
                </button>
                <button
                  onClick={handleResetQuiz}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-450" />
                  New Topic
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
