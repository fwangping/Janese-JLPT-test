
export enum JLPTLevel {
  FIFTY_ON = '50音',
  N5 = 'N5',
  N4 = 'N4',
  N3 = 'N3',
  N2 = 'N2'
}

export enum Category {
  KANA = '假名识别',
  VOCABULARY = '文字・词汇',
  GRAMMAR = '语法',
  LISTENING = '听力'
}

export interface Question {
  id: string;
  level: JLPTLevel;
  category: Category;
  text: string;
  options: string[];
  correctIndex: number;
  translation: string;
  coreAnalysis: string;
  wrongOptionsAnalysis: string;
  listeningText?: string;
}

export interface AppData {
  scores: Record<string, number>;
  wrongQuestions: Question[];
  unlockedLevels: JLPTLevel[];
}

export type ViewType = 'dashboard' | 'test' | 'review' | 'review_detail';

export interface TestState {
  level: JLPTLevel;
  category: Category;
  queue: Question[];
  currentIndex: number;
  showExplanation: boolean;
  isCorrect: boolean | null;
  loading: boolean;
  isBatchLoading: boolean;
  isReviewMode: boolean; // 是否处于复习挑战模式
}
