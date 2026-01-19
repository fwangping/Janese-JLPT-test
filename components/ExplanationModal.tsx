
import React from 'react';
import { Question } from '../types';

interface ExplanationModalProps {
  question: Question;
  isCorrect: boolean;
  onNext: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({ question, isCorrect, onNext }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Header Section */}
        <div className={`p-6 flex items-center justify-between ${isCorrect ? 'bg-green-50' : 'bg-rose-50'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
              <i className={`fa-solid ${isCorrect ? 'fa-circle-check' : 'fa-circle-xmark'} text-2xl`}></i>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isCorrect ? 'text-green-800' : 'text-rose-800'}`}>
                {isCorrect ? '正解です！' : '違います'}
              </h3>
              <p className="text-sm font-medium opacity-70">正确选项：{question.options[question.correctIndex]}</p>
            </div>
          </div>
          <button onClick={onNext} className="text-gray-400 hover:text-gray-600">
             <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        {/* Content Section */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 no-scrollbar">
          {/* Translation */}
          <section>
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">题目翻译</h4>
            <p className="text-gray-700 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 italic">
              “ {question.translation} ”
            </p>
          </section>

          {/* Core Analysis */}
          <section>
            <h4 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2">核心解析</h4>
            <div className="text-gray-700 leading-relaxed font-medium">
              {question.coreAnalysis}
            </div>
          </section>

          {/* Wrong Options Analysis */}
          <section className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">干扰项排查</h4>
            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {question.wrongOptionsAnalysis}
            </div>
          </section>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t bg-gray-50/50">
          <button
            onClick={onNext}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>下一题 / 次へ</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
