import React, { useState } from 'react';
import { LayoutDashboard, WalletCards, BookOpen, Percent, Globe } from 'lucide-react';
import LoanManager from './components/LoanManager';
import StrategySimulator from './components/StrategySimulator';
import EligibilityDecoder from './components/EligibilityDecoder';
import OpportunityAnalyzer from './components/OpportunityAnalyzer';
import AIAdvisor from './components/AIAdvisor';
import LPRTrends from './components/LPRTrends';
import { Loan, LoanType, RepaymentMethod } from './types';
import { useTranslation } from './services/i18n';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const { t, language, setLanguage } = useTranslation();
  
  // Initial Mock Data
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: '1',
      type: LoanType.COMMERCIAL,
      balance: 1200000,
      rate: 3.85,
      remainingMonths: 300,
      method: RepaymentMethod.EQUAL_PAYMENT
    },
    {
      id: '2',
      type: LoanType.PROVIDENT,
      balance: 600000,
      rate: 2.85,
      remainingMonths: 300,
      method: RepaymentMethod.EQUAL_PRINCIPAL
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Sticky Header / LPR Ticker - Made Draggable for Tauri */}
      <div data-tauri-drag-region className="bg-slate-900 text-white sticky top-0 z-50 shadow-md cursor-default select-none">
        <div className="max-w-6xl mx-auto px-4 h-10 flex items-center justify-between text-xs md:text-sm">
           <div className="flex items-center gap-2 pointer-events-none">
             <span className="bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">{t('ticker.live')}</span>
             <span className="animate-pulse">{t('ticker.update')}</span>
           </div>
           <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 bg-slate-800 rounded-md p-0.5">
               <button 
                 onClick={() => setLanguage('en')}
                 className={`px-2 py-0.5 rounded text-xs transition-colors ${language === 'en' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 EN
               </button>
               <button 
                 onClick={() => setLanguage('zh-CN')}
                 className={`px-2 py-0.5 rounded text-xs transition-colors ${language === 'zh-CN' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 简
               </button>
               <button 
                 onClick={() => setLanguage('zh-TW')}
                 className={`px-2 py-0.5 rounded text-xs transition-colors ${language === 'zh-TW' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 繁
               </button>
             </div>
             <div className="opacity-70 pointer-events-none">SmartMortgage CN v1.0</div>
           </div>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {t('app.title')} <span className="text-brand-blue">CN</span>
          </h1>
          <p className="text-slate-500 max-w-2xl">
            {t('app.subtitle')}
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto gap-6 border-b border-slate-200 no-scrollbar">
          {[
            { id: 'DASHBOARD', label: t('nav.dashboard'), icon: LayoutDashboard },
            { id: 'LOANS', label: t('nav.loans'), icon: WalletCards },
            { id: 'POLICY', label: t('nav.policy'), icon: BookOpen },
            { id: 'OPPORTUNITY', label: t('nav.opportunity'), icon: Percent },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-brand-blue text-brand-blue' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {activeTab === 'DASHBOARD' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <StrategySimulator loans={loans} />
              <LPRTrends />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <OpportunityAnalyzer loans={loans} />
                 <AIAdvisor loans={loans} />
              </div>
           </div>
        )}

        {activeTab === 'LOANS' && (
           <div className="animate-in fade-in duration-500">
             <LoanManager loans={loans} setLoans={setLoans} />
           </div>
        )}

        {activeTab === 'POLICY' && (
           <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
             <EligibilityDecoder />
           </div>
        )}

        {activeTab === 'OPPORTUNITY' && (
           <div className="animate-in fade-in duration-500 space-y-8">
             <OpportunityAnalyzer loans={loans} />
             <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-sm text-slate-700">
                <h3 className="font-bold text-lg mb-2 text-blue-800">{t('opp.why.title')}</h3>
                <p>
                  {t('opp.why.desc')}
                </p>
             </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;