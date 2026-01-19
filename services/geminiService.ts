
import { GoogleGenAI, Type } from "@google/genai";
import { JLPTLevel, Category, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// 内置初始题库 (演示用)
const INITIAL_BANK: Question[] = [
  // 50音
  { id: 'k1', level: JLPTLevel.FIFTY_ON, category: Category.KANA, text: '「あ」的片假名是？', options: ['ア', 'イ', 'ウ', 'エ'], correctIndex: 0, translation: '“あ”对应的片假名是什么？', coreAnalysis: 'あ(平假名)对应ア(片假名)。', wrongOptionsAnalysis: 'イ是い；ウ是う；エ是え。' },
  { id: 'k2', level: JLPTLevel.FIFTY_ON, category: Category.KANA, text: '「サ」的平假名是？', options: ['き', 'さ', 'ち', 'ら'], correctIndex: 1, translation: '“サ”对应的平假名是什么？', coreAnalysis: 'サ(片假名)对应さ(平假名)。', wrongOptionsAnalysis: 'き对应キ；ち对应チ；ら对应ラ。' },
  // N5 词汇
  { id: 'n5v1', level: JLPTLevel.N5, category: Category.VOCABULARY, text: 'あした、いっしょにえいがを（　）。', options: ['みます', 'みました', 'みましょう', 'みてください'], correctIndex: 2, translation: '明天一起去看电影吧。', coreAnalysis: '「～ましょう」表示提议、建议。', wrongOptionsAnalysis: 'みます是陈述语气；みました是过去式；みてください是祈使语气。' },
  // N2 语法 (高难度解析)
  { id: 'n2g1', level: JLPTLevel.N2, category: Category.GRAMMAR, text: '合格できたのは、皆さんの応援が（　）のことです。', options: ['あって', 'ありながら', 'あるがゆえ', 'あってこそ'], correctIndex: 3, translation: '之所以能合格，正因为有了大家的支撑。', coreAnalysis: '「～あってこそ」强调该条件是唯一且必要的，“正因为有了...才...”。', wrongOptionsAnalysis: '1. あって仅表示并列；2. ありながら表示逆接，“虽然有...”；3. あるがゆえ表示因果，“因为有...”，语感偏正式但不如あってこそ强调唯一性。' },
  { id: 'n2g2', level: JLPTLevel.N2, category: Category.GRAMMAR, text: 'あの有名料理人は、味はもちろん（　）、見た目にもこだわる。', options: ['ともかく', 'かかわらず', 'さておき', 'もとより'], correctIndex: 3, translation: '那位名厨不仅对味道，对外观也十分讲究。', coreAnalysis: '「AはもとよりBも」表示A是理所当然的，B也一样，相当于“はもちろん”。', wrongOptionsAnalysis: '1. ともかく表示暂且不谈；2. かかわらず表示无论如何；3. さておき表示抛开不谈。' }
];

export const generateQuestionsBatch = async (level: JLPTLevel, category: Category, count: number = 10): Promise<Question[]> => {
  // 优先从本地提取匹配题目
  const localMatch = INITIAL_BANK.filter(q => q.level === level && q.category === category);
  if (localMatch.length >= count) {
    return [...localMatch].sort(() => Math.random() - 0.5).slice(0, count);
  }

  // 否则调用 AI
  const prompt = `生成 ${count} 道日语测试题。等级：${level}，类别：${category}。要求 JSON 格式。`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            translation: { type: Type.STRING },
            coreAnalysis: { type: Type.STRING },
            wrongOptionsAnalysis: { type: Type.STRING },
            listeningText: { type: Type.STRING }
          },
          required: ["text", "options", "correctIndex", "translation", "coreAnalysis", "wrongOptionsAnalysis"]
        }
      }
    }
  });

  const rawData = JSON.parse(response.text || "[]");
  return rawData.map((d: any) => ({
    ...d,
    id: Math.random().toString(36).substr(2, 9),
    level,
    category
  }));
};
