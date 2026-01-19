
import React, { useState, useEffect, useRef } from 'react';
import { JLPTLevel, Category, TestState, Question, ViewType, AppData } from './types';
import { generateQuestionsBatch } from './services/geminiService';
import { loadData, updateScore, addWrongQuestion, removeWrongQuestion } from './services/storageService';
import { audioService } from './services/audioService';
import { Loading } from './components/Loading';
import { ExplanationModal } from './components/ExplanationModal';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [appData, setAppData] = useState<AppData>(loadData());
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [showMasteryModal, setShowMasteryModal] = useState<{lvl: string, cat: string} | null>(null);
  
  const [testState, setTestState] = useState<TestState>({
    level: JLPTLevel.N5,
    category: Category.VOCABULARY,
    queue: [],
    currentIndex: 0,
    showExplanation: false,
    isCorrect: null,
    loading: false,
    isBatchLoading: false,
    isReviewMode: false
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<any[]>([]);

  useEffect(() => {
    canvasRef.current = document.getElementById('fireworks') as HTMLCanvasElement;
    if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
    }
  }, []);

  const spawnFireworks = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = canvas.width / 2;
    const y = canvas.height / 3;

    for (let i = 0; i < 60; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        color: `hsl(${Math.random() * 360}, 100%, 60%)`,
        life: 1,
        size: Math.random() * 3 + 2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(p => p.life > 0);
      particles.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.012;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      if (particles.current.length > 0) requestAnimationFrame(animate);
    };
    animate();
  };

  const categoriesForLevel = (lvl: JLPTLevel) => {
    if (lvl === JLPTLevel.FIFTY_ON) return [Category.KANA];
    return [Category.VOCABULARY, Category.GRAMMAR, Category.LISTENING];
  };

  const resetTestState = () => {
    setTestState({
      level: JLPTLevel.N5,
      category: Category.VOCABULARY,
      queue: [],
      currentIndex: 0,
      showExplanation: false,
      isCorrect: null,
      loading: false,
      isBatchLoading: false,
      isReviewMode: false
    });
  };

  const startTest = async (level: JLPTLevel, category: Category, questions?: Question[]) => {
    setView('test');
    setTestState(prev => ({ 
      ...prev, 
      level, 
      category, 
      loading: !questions, 
      queue: questions || [], 
      currentIndex: 0, 
      showExplanation: false,
      isReviewMode: !!questions
    }));
    
    if (!questions) {
      try {
        const batch = await generateQuestionsBatch(level, category, 10);
        setTestState(prev => ({ ...prev, queue: batch, loading: false }));
      } catch (e) {
        setTestState(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const handleAnswer = (idx: number) => {
    const currentQ = testState.queue[testState.currentIndex];
    if (!currentQ) return;
    
    const correct = idx === currentQ.correctIndex;
    
    if (correct) {
      audioService.playCorrect();
    } else {
      audioService.playWrong();
      addWrongQuestion(currentQ);
    }

    if (!testState.isReviewMode) {
      const key = `${testState.level}_${testState.category}`;
      const oldScore = appData.scores[key] || 0;
      const newData = updateScore(testState.level, testState.category, correct ? 10 : -5);
      const newScore = newData.scores[key] || 0;
      
      setAppData(newData);
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), 500);

      // 只有在从未达成100分，且现在达成时触发庆祝
      if (oldScore < 100 && newScore >= 100) {
        setShowMasteryModal({ lvl: testState.level, cat: testState.category });
        spawnFireworks();
      }
    }

    setTestState(prev => ({ ...prev, isCorrect: correct, showExplanation: true }));
  };

  const nextQuestion = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const nextIdx = testState.currentIndex + 1;
    
    if (nextIdx < testState.queue.length) {
      setTestState(prev => ({ ...prev, currentIndex: nextIdx, showExplanation: false, isCorrect: null }));
    } else if (testState.isReviewMode) {
      setView('dashboard');
      resetTestState();
    } else {
      setTestState(prev => ({ ...prev, loading: true }));
      try {
        const more = await generateQuestionsBatch(testState.level, testState.category, 10);
        setTestState(prev => ({ 
          ...prev, 
          queue: [...prev.queue, ...more], 
          currentIndex: nextIdx, 
          showExplanation: false, 
          isCorrect: null,
          loading: false
        }));
      } catch (e) {
        setView('dashboard');
        resetTestState();
      }
    }
  };

  const currentScore = appData.scores[`${testState.level}_${testState.category}`] || 0;
  const masteryPercent = Math.min(currentScore, 100);
  const progressColor = masteryPercent <= 60 ? 'bg-orange-500' : (masteryPercent <= 90 ? 'bg-blue-500' : 'bg-green-500');

  const renderProgressHeader = () => (
    <div className={`fixed-header px-4 py-3 flex flex-col shadow-md ${masteryPercent >= 100 ? 'mastery-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => { setView('dashboard'); resetTestState(); }}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 active:scale-90 transition-transform"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="flex flex-col items-center flex-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
            {testState.level} · {testState.category}
          </span>
          <span className={`text-xs font-bold transition-all ${scoreAnimation ? 'scale-125 text-pink-500' : 'text-gray-700'}`}>
            {masteryPercent >= 100 ? '精通度 100%' : `模块精通度: ${currentScore}%`}
          </span>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-700 ease-out ${progressColor}`} style={{ width: `${masteryPercent}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fffcfd]">
      
      {view === 'dashboard' && (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-lg mx-auto w-full">
          <header className="flex justify-between items-end pt-6">
            <div>
              <h1 className="text-4xl font-black text-gray-800 japanese-serif tracking-tighter">日检达人</h1>
              <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest mt-1">Japanese Mastery Pro</p>
            </div>
            <button onClick={() => setView('review')} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-pink-50 text-rose-500 active:scale-90 transition-all">
              <i className="fa-solid fa-ghost text-xl"></i>
              <span className="ml-2 text-sm font-black">{appData.wrongQuestions.length}</span>
            </button>
          </header>

          <div className="grid gap-6 pb-16">
            {Object.values(JLPTLevel).map(level => {
              const isUnlocked = appData.unlockedLevels.includes(level);
              const cats = categoriesForLevel(level);
              return (
                <div key={level} className={`bg-white rounded-[2.5rem] p-7 border-2 transition-all duration-500 ${isUnlocked ? 'border-pink-50 shadow-2xl shadow-gray-100' : 'opacity-40 grayscale pointer-events-none border-dashed'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black">{level}</h3>
                    {!isUnlocked && <i className="fa-solid fa-lock text-gray-300"></i>}
                  </div>
                  <div className="grid gap-3">
                    {cats.map(cat => {
                      const score = appData.scores[`${level}_${cat}`] || 0;
                      const isMastered = score >= 100;
                      return (
                        <button key={cat} onClick={() => startTest(level, cat)} className="flex justify-between items-center p-5 bg-gray-50/50 rounded-2xl border border-transparent hover:border-pink-200 hover:bg-white active:scale-95 transition-all group">
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-gray-500 group-hover:text-pink-500 transition-colors">{cat}</span>
                            <span className="text-[9px] text-gray-400 font-medium">精通度: {Math.min(score, 100)}%</span>
                          </div>
                          <div className="flex items-center">
                            {isMastered ? (
                              <div className="flex items-center bg-green-50 px-2 py-1 rounded-lg text-green-600 font-black text-[10px]">
                                <i className="fa-solid fa-check-circle mr-1"></i>
                                MASTERED
                              </div>
                            ) : (
                              <span className="text-sm font-black text-gray-700">{score}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'test' && (
        <div className="flex-1 flex flex-col content-pt px-6 max-w-lg mx-auto w-full">
          {renderProgressHeader()}

          <main className="flex-1 flex flex-col py-6 space-y-10 animate-in slide-in-from-bottom-6 duration-500">
            {testState.loading ? <Loading /> : testState.queue[testState.currentIndex] ? (
              <div className="flex-1 flex flex-col space-y-8">
                <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-pink-50 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500"></div>
                  <p className="text-3xl font-bold text-gray-800 japanese-serif leading-tight">
                    {testState.queue[testState.currentIndex].text}
                  </p>
                </div>

                <div className="grid gap-4 pb-12">
                  {testState.queue[testState.currentIndex].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className="option-btn w-full p-6 bg-white border border-gray-100 rounded-[2rem] text-left shadow-sm flex items-center space-x-5 hover:border-pink-300 hover:shadow-lg active:scale-95"
                    >
                      <span className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-gray-300 text-xs shadow-inner">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="font-bold text-gray-700 text-lg">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </main>
        </div>
      )}

      {view === 'review' && (
        <div className="p-6 animate-in slide-in-from-right-10 duration-500 pt-10 max-w-lg mx-auto w-full">
          <div className="flex items-center space-x-4 mb-10">
            <button onClick={() => setView('dashboard')} className="w-12 h-12 rounded-full bg-white border flex items-center justify-center shadow-lg text-gray-400 active:scale-90 transition-all">
              <i className="fa-solid fa-arrow-left text-lg"></i>
            </button>
            <h2 className="text-3xl font-black tracking-tight">错题消灭库</h2>
          </div>
          {appData.wrongQuestions.length === 0 ? (
            <div className="text-center py-32 space-y-4">
              <i className="fa-solid fa-trophy text-6xl text-yellow-400 animate-bounce"></i>
              <p className="text-gray-400 font-bold text-xl">全部斩杀！你是日语达人</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appData.wrongQuestions.map(q => (
                <div key={q.id} className="bg-white p-7 rounded-[2.5rem] border-2 border-gray-50 flex justify-between items-center shadow-md">
                  <div className="flex-1 pr-6">
                    <p className="text-[10px] font-black text-pink-400 mb-1 uppercase">{q.level} · {q.category}</p>
                    <p className="font-bold text-gray-700 line-clamp-1 text-lg">{q.text}</p>
                  </div>
                  <button onClick={() => startTest(q.level, q.category, [q])} className="bg-rose-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-rose-200 active:scale-90 transition-all">挑战</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {testState.showExplanation && testState.queue[testState.currentIndex] && (
        <ExplanationModal
          question={testState.queue[testState.currentIndex]}
          isCorrect={testState.isCorrect || false}
          onNext={() => {
            if (testState.isReviewMode && testState.isCorrect) {
              const newData = removeWrongQuestion(testState.queue[testState.currentIndex].id);
              setAppData(newData);
            }
            nextQuestion();
          }}
        />
      )}

      {showMasteryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-pink-500/20 backdrop-blur-xl p-6">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 text-center shadow-2xl border-4 border-pink-50 animate-in zoom-in duration-500">
            <div className="relative mb-8">
              <i className="fa-solid fa-crown text-7xl text-yellow-400 drop-shadow-xl animate-bounce"></i>
              <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-black px-2 py-1 rounded-full">NEW!</div>
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-3">模块精通！</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-10">
              太棒了！你已达成【{showMasteryModal.lvl} {showMasteryModal.cat}】100% 精通。
              新的挑战已为您开启，请继续保持！
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => setShowMasteryModal(null)} 
                className="w-full bg-pink-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-pink-200 active:scale-95 transition-all"
              >
                继续强化
              </button>
              <button 
                onClick={() => { setShowMasteryModal(null); setView('dashboard'); resetTestState(); }} 
                className="w-full bg-gray-100 text-gray-500 font-bold py-5 rounded-3xl active:scale-95 transition-all"
              >
                返回主页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
