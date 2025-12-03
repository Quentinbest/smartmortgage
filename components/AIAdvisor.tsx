import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Loan, SimulationResult } from '../types';
import { simulateRepayment } from '../services/mortgageCalculator';
import { getFinancialAdvice } from '../services/geminiService';
import { useTranslation } from '../services/i18n';

interface AIAdvisorProps {
  loans: Loan[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ loans }) => {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);

  // Simplified default state capture for the demo
  // In a real app, these would come from the centralized state or context
  const cashOnHand = 500000;
  const safetyBuffer = 100000;
  const investmentYield = 2.5;

  const handleConsult = async () => {
    setLoading(true);
    const repayAmount = cashOnHand - safetyBuffer;
    const simA = simulateRepayment(loans, repayAmount, 'SHORTEN_TERM');
    const simB = simulateRepayment(loans, repayAmount, 'REDUCE_PAYMENT');

    const result = await getFinancialAdvice(
      loans,
      cashOnHand,
      safetyBuffer,
      investmentYield,
      simA,
      simB,
      language
    );
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-32 bg-purple-500 opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-bold">{t('ai.title')}</h2>
        </div>
        
        {!advice && !loading && (
          <div className="space-y-4">
            <p className="text-indigo-200">
              {t('ai.desc')}
            </p>
            <button 
              onClick={handleConsult}
              className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              {t('ai.btn.generate')}
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-300 mb-3" />
            <p className="text-indigo-200 animate-pulse">{t('ai.loading')}</p>
          </div>
        )}

        {advice && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{advice}</ReactMarkdown>
            </div>
            <button 
              onClick={() => setAdvice(null)}
              className="mt-4 text-xs text-indigo-300 hover:text-white underline"
            >
              {t('ai.clear')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAdvisor;