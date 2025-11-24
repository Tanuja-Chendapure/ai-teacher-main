
import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { AppState, Course, Module, QuizQuestion } from './types';
import { generateSyllabus, streamLessonContent } from './services/gemini';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  BrainCircuit, 
  ArrowLeft,
  Loader2,
  GraduationCap,
  Trash2,
  Plus,
  LayoutGrid,
  Home,
  Sun,
  Moon
} from './components/icons';

// --- Sub-Components ---

const ThemeToggle: React.FC<{ isDark: boolean; toggle: () => void }> = ({ isDark, toggle }) => (
  <button 
    onClick={toggle} 
    className="p-2 rounded-full bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors backdrop-blur-sm"
    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
  >
    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
  </button>
);

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="markdown-body leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-4 animate-pulse text-sky-600 dark:text-sky-400">
    <Loader2 className="w-6 h-6 animate-spin mr-2" />
    <span>AI is thinking...</span>
  </div>
);

interface QuizProps {
    questions: QuizQuestion[];
    onComplete: (score: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
    const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleOptionSelect = (qIndex: number, oIndex: number) => {
        if (submitted) return;
        const newAnswers = [...answers];
        newAnswers[qIndex] = oIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        if (answers.includes(-1)) {
            alert("Please answer all questions before submitting.");
            return;
        }
        
        let correctCount = 0;
        answers.forEach((ans, idx) => {
            if (ans === questions[idx].correctAnswer) correctCount++;
        });
        
        setScore(correctCount);
        setSubmitted(true);
        onComplete((correctCount / questions.length) * 100);
    };

    const handleRetry = () => {
        setAnswers(new Array(questions.length).fill(-1));
        setSubmitted(false);
        setScore(0);
    };

    return (
        <div className="mt-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500 dark:text-yellow-400" /> 
                Knowledge Check
            </h3>

            <div className="space-y-8">
                {questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-lg font-medium text-slate-800 dark:text-white mb-4">{qIdx + 1}. {q.question}</p>
                        <div className="space-y-3">
                            {q.options.map((opt, oIdx) => {
                                let optionClass = "w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between ";
                                const isSelected = answers[qIdx] === oIdx;
                                const isCorrect = q.correctAnswer === oIdx;

                                if (submitted) {
                                    if (isCorrect) optionClass += "bg-green-100 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200";
                                    else if (isSelected && !isCorrect) optionClass += "bg-red-100 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200 opacity-70";
                                    else optionClass += "bg-slate-50 dark:bg-slate-800 border-transparent opacity-50";
                                } else {
                                    if (isSelected) optionClass += "bg-sky-100 dark:bg-sky-500/20 border-sky-500 text-sky-900 dark:text-sky-100";
                                    else optionClass += "bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300";
                                }

                                return (
                                    <button 
                                        key={oIdx}
                                        onClick={() => handleOptionSelect(qIdx, oIdx)}
                                        className={optionClass}
                                        disabled={submitted}
                                    >
                                        <span>{opt}</span>
                                        {submitted && isCorrect && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    </button>
                                );
                            })}
                        </div>
                        {submitted && q.explanation && (
                            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-400 italic border-l-2 border-slate-400 dark:border-slate-600">
                                💡 {q.explanation}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {submitted ? (
                    <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            Score: <span className={score === questions.length ? "text-green-600 dark:text-green-400" : "text-sky-600 dark:text-sky-400"}>{score}/{questions.length}</span>
                        </div>
                        <button 
                            onClick={handleRetry} 
                            className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="text-slate-500 text-sm">Select all answers to submit</div>
                )}
                
                {!submitted && (
                    <button 
                        onClick={handleSubmit}
                        className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-sky-900/20 dark:shadow-black/40"
                    >
                        Submit Quiz
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main App ---

const QUIZ_SEPARATOR = "---QUIZ_START---";

type Tab = 'lesson' | 'quiz';

const App: React.FC = () => {
  // --- Global State ---
  const [courses, setCourses] = useState<Course[]>(() => {
      const saved = localStorage.getItem('ai-teacher-courses');
      return saved ? JSON.parse(saved) : [];
  });

  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-teacher-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // --- Navigation State ---
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // --- Current Interaction State ---
  const [topicInput, setTopicInput] = useState('');
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('lesson');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingQuizJSON, setStreamingQuizJSON] = useState<string>('');

  // --- Refs ---
  const contentEndRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef<string>('');

  // --- Persistence Effect ---
  useEffect(() => {
    localStorage.setItem('ai-teacher-courses', JSON.stringify(courses));
  }, [courses]);

  // --- Theme Effect ---
  useEffect(() => {
    localStorage.setItem('ai-teacher-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Tab Effect ---
  useEffect(() => {
    if (activeModuleId) {
        setActiveTab('lesson');
    }
  }, [activeModuleId]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- Derived State ---
  const activeCourse = useMemo(() => 
    courses.find(c => c.id === activeCourseId) || null, 
  [courses, activeCourseId]);

  const activeModule = useMemo(() => 
    activeCourse?.modules.find(m => m.id === activeModuleId), 
  [activeCourse, activeModuleId]);

  // --- Scrolling Effect ---
  useEffect(() => {
    if (isStreaming && contentEndRef.current && activeTab === 'lesson') {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingContent, isStreaming, activeTab]);


  // --- Actions ---

  const handleGenerateSyllabus = async () => {
    if (!topicInput.trim()) return;
    
    setIsLoadingSyllabus(true);
    try {
      const newCourse = await generateSyllabus(topicInput);
      newCourse.createdAt = Date.now();
      
      setCourses(prev => [...prev, newCourse]);
      setActiveCourseId(newCourse.id);
      setIsCreating(false);
      setTopicInput('');
    } catch (error) {
      console.error(error);
      alert("Failed to generate course. Please check your API key or try again.");
    } finally {
        setIsLoadingSyllabus(false);
    }
  };

  const handleDeleteCourse = (e: React.MouseEvent, courseId: string) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this course? This cannot be undone.")) {
          setCourses(prev => prev.filter(c => c.id !== courseId));
          if (activeCourseId === courseId) {
              setActiveCourseId(null);
          }
      }
  };

  const handleStartModule = async (module: Module) => {
    if (isStreaming) return; 
    
    setActiveModuleId(module.id);
    
    // If content already exists, just show it
    if (module.content) {
        setStreamingContent(module.content);
        setStreamingQuizJSON('');
        return;
    }

    setStreamingContent('');
    setStreamingQuizJSON('');
    streamBufferRef.current = '';
    setIsStreaming(true);

    try {
      if (!activeCourse) return;
      const stream = streamLessonContent(activeCourse.title, module.title, module.description);
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        streamBufferRef.current = fullText;

        // Parse split logic
        const parts = fullText.split(QUIZ_SEPARATOR);
        if (parts.length > 0) {
            setStreamingContent(parts[0]);
        }
        if (parts.length > 1) {
            setStreamingQuizJSON(parts[1]);
        }
      }

      // Finalize
      const parts = streamBufferRef.current.split(QUIZ_SEPARATOR);
      const lessonText = parts[0];
      let quizData: QuizQuestion[] = [];
      
      if (parts[1]) {
          try {
              const jsonString = parts[1].replace(/```json/g, '').replace(/```/g, '').trim();
              quizData = JSON.parse(jsonString);
          } catch (e) {
              console.error("Failed to parse quiz JSON", e);
          }
      }

      // Update Course in Global State
      setCourses(prev => prev.map(c => {
          if (c.id === activeCourse?.id) {
              return {
                  ...c,
                  modules: c.modules.map(m => {
                      if (m.id === module.id) {
                          return {
                              ...m,
                              content: lessonText,
                              quiz: quizData
                          };
                      }
                      return m;
                  })
              };
          }
          return c;
      }));

    } catch (error) {
      console.error("Stream error", error);
      setStreamingContent((prev) => prev + "\n\n**Error loading lesson content. Please try again.**");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleQuizComplete = (moduleId: string, scorePercent: number) => {
      setCourses(prev => prev.map(c => {
          if (c.id === activeCourseId) {
              return {
                  ...c,
                  modules: c.modules.map(m => {
                      if (m.id === moduleId) {
                          return {
                              ...m,
                              isCompleted: scorePercent >= 60,
                              quizScore: scorePercent
                          };
                      }
                      return m;
                  })
              };
          }
          return c;
      }));
  };

  const navigateHome = () => {
    if (isStreaming) {
        if(!window.confirm("Stop current lesson generation?")) return;
    }
    setIsStreaming(false);
    setActiveCourseId(null);
    setIsCreating(false);
    setActiveModuleId(null);
  };

  // --- Views ---

  const renderLandingOrCreate = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="absolute top-4 right-4 z-50">
            <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
        </div>
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-sky-400/10 dark:bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-400/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Back button if we have courses but are creating a new one */}
        {courses.length > 0 && (
            <button 
                onClick={() => setIsCreating(false)}
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors z-20"
            >
                <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>
        )}

      <div className="max-w-2xl w-full z-10 text-center space-y-8">
        <div className="space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-800/50 rounded-2xl mb-4 ring-1 ring-slate-200 dark:ring-slate-700 shadow-lg backdrop-blur-sm">
                <BrainCircuit className="w-10 h-10 text-sky-500 dark:text-sky-400" />
            </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 dark:from-sky-400 dark:via-indigo-400 dark:to-purple-400 pb-2">
            AI Teacher
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl">
            Enter any topic to generate a full course with interactive lessons and quizzes.
          </p>
        </div>

        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-lg p-2 ring-1 ring-slate-200 dark:ring-slate-700 shadow-xl">
                <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="What do you want to learn today?"
                    className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 text-lg px-4 py-3 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateSyllabus()}
                    autoFocus
                />
                <button
                    onClick={handleGenerateSyllabus}
                    disabled={!topicInput.trim() || isLoadingSyllabus}
                    className="bg-sky-600 hover:bg-sky-500 text-white p-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                    {isLoadingSyllabus ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                    <Sparkles className="w-6 h-6" />
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors duration-500">
        <div className="absolute top-6 right-6 z-10">
             <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
        </div>
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8 md:pt-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <LayoutGrid className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                        Your Courses
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back. Continue learning where you left off.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-3 rounded-lg font-medium transition-all shadow-lg shadow-sky-900/20 dark:shadow-black/20"
                >
                    <Plus className="w-5 h-5" /> Create New Course
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => {
                    const completedModules = course.modules.filter(m => m.isCompleted).length;
                    const progress = Math.round((completedModules / course.modules.length) * 100);
                    
                    return (
                        <div 
                            key={course.id} 
                            onClick={() => setActiveCourseId(course.id)}
                            className="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-sky-500/30 rounded-2xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button 
                                    onClick={(e) => handleDeleteCourse(e, course.id)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                                    title="Delete Course"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-sky-100 dark:bg-sky-900/20 rounded-xl">
                                        <GraduationCap className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        {course.modules.length} Modules
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">{course.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-6 flex-1">{course.description}</p>
                                
                                <div className="mt-auto">
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-slate-500 dark:text-slate-400">Progress</span>
                                        <span className="text-sky-600 dark:text-sky-400 font-bold">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-500" 
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );

  const renderCourseView = () => {
    if (!activeCourse) return null;
    
    // Decide what to show in main content
    const currentContent = activeModule?.content || streamingContent;
    const currentQuiz = activeModule?.quiz || [];

    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-500">
        
        {/* Sidebar */}
        <aside className={`w-full md:w-80 bg-white dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 h-screen sticky top-0 z-20 transition-transform ${activeModuleId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center justify-between mb-4">
                     <button onClick={navigateHome} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                        <Home className="w-4 h-4" /> Dashboard
                     </button>
                     <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-4">{activeCourse.title}</h2>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-sky-500 h-full transition-all duration-500" 
                            style={{ width: `${(activeCourse.modules.filter(m => m.isCompleted).length / activeCourse.modules.length) * 100}%` }}
                        />
                    </div>
                    <span>{Math.round((activeCourse.modules.filter(m => m.isCompleted).length / activeCourse.modules.length) * 100)}%</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeCourse.modules.map((module, index) => {
                    const isActive = activeModuleId === module.id;
                    return (
                        <div 
                            key={module.id}
                            onClick={() => handleStartModule(module)}
                            className={`
                                group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border shadow-sm
                                ${isActive 
                                    ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/50' 
                                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`
                                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5
                                    ${module.isCompleted 
                                        ? 'bg-green-500 text-white' 
                                        : isActive ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}
                                `}>
                                    {module.isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-sm font-medium mb-1 truncate ${isActive ? 'text-sky-700 dark:text-sky-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {module.title}
                                    </h3>
                                    {module.quizScore !== undefined && (
                                        <p className="text-xs text-green-600 dark:text-green-400">Best Score: {Math.round(module.quizScore)}%</p>
                                    )}
                                </div>
                                {isActive && isStreaming && <Loader2 className="w-4 h-4 animate-spin text-sky-500 dark:text-sky-400" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 relative flex flex-col h-screen overflow-hidden ${!activeModuleId ? 'hidden md:flex' : 'flex'}`}>
            
            {activeModuleId && (
                 <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveModuleId(null)} className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="hidden md:inline text-sm font-medium text-slate-500 dark:text-slate-400">Current Module:</span>
                        <span className="text-sm font-bold text-sky-600 dark:text-sky-400 truncate max-w-[200px] md:max-w-md">
                            {activeModule?.title}
                        </span>
                    </div>
                </header>
            )}

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-12 scroll-smooth">
                {!activeModuleId ? (
                     <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <BookOpen className="w-24 h-24 text-slate-300 dark:text-slate-800 mb-4" />
                        <p className="text-xl text-slate-500 dark:text-slate-600">Select a module from the sidebar to start learning.</p>
                     </div>
                ) : (
                    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500">
                         <div className="mb-6">
                             <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{activeModule?.title}</h1>
                             <p className="text-lg text-slate-600 dark:text-slate-400">{activeModule?.description}</p>
                         </div>

                         {/* Tabs */}
                         <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 pt-2">
                             <button
                                 onClick={() => setActiveTab('lesson')}
                                 className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
                                     activeTab === 'lesson'
                                         ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                                         : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                 }`}
                             >
                                 <BookOpen className="w-4 h-4" />
                                 Lesson
                             </button>
                             <button
                                 onClick={() => setActiveTab('quiz')}
                                 className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
                                     activeTab === 'quiz'
                                         ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                                         : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                 }`}
                             >
                                 <BrainCircuit className="w-4 h-4" />
                                 Quiz
                                 {activeModule?.isCompleted && <CheckCircle className="w-3 h-3 text-green-500" />}
                             </button>
                         </div>

                         {activeTab === 'lesson' ? (
                             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                 {currentContent ? (
                                     <>
                                        <MarkdownRenderer content={currentContent} />
                                        {/* Streaming Indicator for Content */}
                                        {isStreaming && streamingContent && !streamingQuizJSON && (
                                            <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm animate-pulse">
                                                <span className="w-2 h-2 bg-sky-500 rounded-full"></span> Writing lesson...
                                            </div>
                                        )}
                                        
                                        {/* Next Step CTA */}
                                        {!isStreaming && (
                                            <div className="mt-12 p-8 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center shadow-sm">
                                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4">
                                                    <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to test your knowledge?</h3>
                                                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                                                    Complete the quiz to verify your understanding of this module and track your progress.
                                                </p>
                                                <button
                                                    onClick={() => setActiveTab('quiz')}
                                                    className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-sky-900/20 hover:scale-105 active:scale-95"
                                                >
                                                    Start Quiz
                                                </button>
                                            </div>
                                        )}
                                     </>
                                 ) : (
                                    <LoadingSpinner />
                                 )}
                             </div>
                         ) : (
                             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[300px]">
                                 {currentQuiz && currentQuiz.length > 0 ? (
                                    <Quiz 
                                        questions={currentQuiz} 
                                        onComplete={(score) => handleQuizComplete(activeModuleId, score)}
                                    />
                                 ) : isStreaming ? (
                                    <div className="flex flex-col items-center justify-center py-20 h-full">
                                        <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Generating Quiz...</h3>
                                        <p className="text-slate-500 mt-2 max-w-xs text-center">
                                            The AI is crafting questions based on the lesson content. This usually takes a few seconds.
                                        </p>
                                    </div>
                                 ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                         <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                            <BrainCircuit className="w-8 h-8 text-slate-400" />
                                         </div>
                                         <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Quiz Available</h3>
                                         <p className="text-slate-500 mt-2">This module doesn't have a quiz yet.</p>
                                    </div>
                                 )}
                             </div>
                         )}
                         
                         <div ref={contentEndRef} />
                    </div>
                )}
            </div>
        </main>
      </div>
    );
  };

  // --- Main Render Logic ---
  
  if (courses.length === 0 || isCreating) {
      return renderLandingOrCreate();
  }

  if (activeCourseId) {
      return renderCourseView();
  }

  return renderDashboard();
};

export default App;
