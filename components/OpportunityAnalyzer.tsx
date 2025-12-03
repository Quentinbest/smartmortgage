import React, { useState } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { Loan } from '../types';
import { useTranslation } from '../services/i18n';

interface OpportunityAnalyzerProps {
  loans: Loan[];
}

const OpportunityAnalyzer: React.FC<OpportunityAnalyzerProps> = ({ loans }) => {
  const { t } = useTranslation();
  const [investmentYield, setInvestmentYield] = useState(2.8);
  
  const totalBalance = loans.reduce((acc, l) => acc + l.balance, 0);
  const weightedRate = totalBalance > 0 
    ? loans.reduce((acc, l) => acc + (l.rate * l.balance), 0) / totalBalance 
    : 0;

  const rateDiff = weightedRate - investmentYield;
  const isLoss = rateDiff > 0;
  
  // Simple 10-year projection on 500k hypothetical principal to show magnitude
  const hypotheticalPrincipal = 500000; 
  const projectedLoss = (hypotheticalPrincipal * (rateDiff / 100)) * 10; 

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <TrendingUp className="w-6 h-6 text-brand-red" />
        <h2 className="text-xl font-bold text-slate-800">{t('opp.title')}</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center">
         {/* Left: Inputs & Data */}
         <div className="flex-1 w-full space-y-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
               <div className="text-sm text-red-600 font-medium mb-1">{t('opp.cost_debt')}</div>
               <div className="text-3xl font-bold text-red-700">{weightedRate.toFixed(2)}%</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
               <label className="text-sm text-blue-600 font-medium mb-1 block">{t('opp.invest_return')}</label>
               <input 
                 type="number"
                 step="0.1"
                 value={investmentYield}
                 onChange={(e) => setInvestmentYield(Number(e.target.value))}
                 className="w-full bg-white border border-blue-200 rounded p-2 text-2xl font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-400"
               />
               <p className="text-xs text-blue-400 mt-1">{t('opp.invest_desc')}</p>
            </div>
         </div>

         {/* Middle: VS */}
         <div className="text-slate-300 font-bold text-2xl">VS</div>

         {/* Right: Verdict */}
         <div className="flex-1 w-full">
            {isLoss ? (
               <div className="border-l-4 border-red-500 pl-6 py-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{t('opp.repay.title')}</h3>
                  <p className="text-slate-600 text-sm mb-4">
                    {t('opp.repay.desc')}
                  </p>
                  <div className="bg-slate-100 p-3 rounded text-sm text-slate-700">
                     <AlertTriangle className="w-4 h-4 inline mr-1 text-orange-500" />
                     {t('opp.repay.loss')} <span className="font-bold text-red-600">-¥{Math.abs(projectedLoss).toFixed(0)}</span>
                  </div>
               </div>
            ) : (
               <div className="border-l-4 border-blue-500 pl-6 py-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{t('opp.hold.title')}</h3>
                  <p className="text-slate-600 text-sm mb-4">
                    {t('opp.hold.desc')}
                  </p>
                  <div className="bg-green-50 p-3 rounded text-sm text-green-800 border border-green-100">
                     <TrendingUp className="w-4 h-4 inline mr-1" />
                     {t('opp.hold.gain')} <span className="font-bold">+¥{Math.abs(projectedLoss).toFixed(0)}</span>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default OpportunityAnalyzer;