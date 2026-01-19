
import { AppData, JLPTLevel, Category, Question } from "../types";

const STORAGE_KEY = 'jp_master_pro_v4_master';

const DEFAULT_DATA: AppData = {
  scores: {},
  wrongQuestions: [],
  unlockedLevels: [JLPTLevel.FIFTY_ON, JLPTLevel.N5]
};

export const loadData = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_DATA;
  try {
      const parsed = JSON.parse(saved);
      // Ensure unlockedLevels has at least 50音 and N5
      if (!parsed.unlockedLevels) parsed.unlockedLevels = DEFAULT_DATA.unlockedLevels;
      return parsed;
  } catch(e) {
      return DEFAULT_DATA;
  }
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const updateScore = (level: JLPTLevel, category: Category, points: number) => {
  const data = loadData();
  const key = `${level}_${category}`;
  const current = data.scores[key] || 0;
  data.scores[key] = Math.max(0, current + points);
  
  // 检查解锁逻辑
  if (data.scores[key] >= 100) {
    const levels = Object.values(JLPTLevel);
    const currentIndex = levels.indexOf(level);
    if (currentIndex < levels.length - 1) {
      const nextLevel = levels[currentIndex + 1];
      if (!data.unlockedLevels.includes(nextLevel)) {
        data.unlockedLevels.push(nextLevel);
      }
    }
  }
  saveData(data);
  return data;
};

export const addWrongQuestion = (question: Question) => {
  const data = loadData();
  if (!data.wrongQuestions.find(q => q.id === question.id)) {
    data.wrongQuestions.push(question);
    saveData(data);
  }
};

export const removeWrongQuestion = (id: string) => {
  const data = loadData();
  data.wrongQuestions = data.wrongQuestions.filter(q => q.id !== id);
  saveData(data);
  return data;
};
