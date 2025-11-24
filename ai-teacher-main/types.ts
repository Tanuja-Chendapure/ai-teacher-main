
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option (0-3)
  explanation?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  content?: string; // Markdown lesson content
  quiz?: QuizQuestion[]; // Structured quiz
  isCompleted?: boolean;
  quizScore?: number; // Latest score percentage
}

export interface Course {
  id: string;
  topic: string;
  title: string;
  description: string;
  modules: Module[];
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_SYLLABUS = 'GENERATING_SYLLABUS',
  COURSE_READY = 'COURSE_READY',
  LEARNING_MODULE = 'LEARNING_MODULE'
}
