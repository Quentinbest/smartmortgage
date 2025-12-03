import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Calculator, AlertCircle, Plus, Trash2, X } from 'lucide-react';
import { Loan, SimulationResult, LoanType, RepaymentMethod } from '../types';
import { simulateRepayment } from '../services/mortgageCalculator';
import { useTranslation } from '../services/i18n';

interface StrategySimulatorProps {
  loans: Loan[];
}

const StrategySimulator: React.FC<StrategySimulatorProps> = ({ loans }) => {
  const { t } = useTranslation();
  const [cashOnHand, setCashOnHand] = useState(500000);
  const [safetyBuffer, setSafetyBuffer] = useState(100000);

  // Simulation-only loans
  const [simLoans, setSimLoans] = useState<Loan[]>([]);
  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [newLoanParams, setNewLoanParams] = useState({
    balance: 500000,
    rate: 3.5,
    months: 360,
    method: RepaymentMethod.EQUAL_PAYMENT
  });

  const allLoans = useMemo(() => [...loans, ...simLoans], [loans, simLoans]);
  const repayAmount = Math.max(0, cashOnHand - safetyBuffer);

  const simulationResults = useMemo(() => {
    const strategyA = simulateRepayment(allLoans, repayAmount, 'SHORTEN_TERM');
    const strategyB = simulateRepayment(allLoans, repayAmount, 'REDUCE_PAYMENT');
    
    // Baseline (No Repayment)
    const baseline = simulateRepayment(allLoans, 0, 'SHORTEN_TERM'); 

    return { baseline, strategyA, strategyB };
  }, [allLoans, repayAmount]);

  const { baseline, strategyA, strategyB } = simulationResults;

  const chartData = [
    { name: t('strat.chart.current'), interest: baseline.totalInterest },
    { name: t('strat.chart.option_a'), interest: strategyA.totalInterest },
    { name: t('strat.chart.option_b'), interest: strategyB.totalInterest },
  ];

  const handleAddSimLoan = () => {
    const loan: Loan = {
      id: `sim-${Date.now()}`,
      type: LoanType.COMMERCIAL, // Default to Commercial for simulation
      balance: newLoanParams.balance,
      rate: newLoanParams.rate,
      remainingMonths: newLoanParams.months,
      method: newLoanParams.method
    };
    setSimLoans([...simLoans, loan]);
    setIsAddingLoan(false);
  };

  const removeSimLoan = (id: string) => {
    setSimLoans(simLoans.filter(l => l.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Calculator className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-800">{t('strat.title')}</h2>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('strat.cash_on_hand')}</label>
                <div className="relative">
                   <span className="absolute left-3 top-3 text-slate-400">¥</span>
                   <input 
                     type="number"
                     value={cashOnHand}
                     onChange={(e) => setCashOnHand(Number(e.target.value))}
                     className="w-full pl-8 p-3 border border-slate-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
             </div>
             
             <div className="p-4 bg-slate-50 rounded-lg">
               <div className="flex justify-between mb-2">
                   <label className="text-sm font-medium text-slate-700">{t('strat.safety_buffer')}</label>
                   <span className="text-sm font-bold text-slate-900">¥{safetyBuffer.toLocaleString()}</span>
               </div>
               <input 
                 type="range"
                 min="0"
                 max={cashOnHand}
                 step="10000"
                 value={safetyBuffer}
                 onChange={(e) => setSafetyBuffer(Number(e.target.value))}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
               />
               <p className="text-xs text-slate-500 mt-2">
                 {t('strat.safety_desc')} <span className="font-bold text-indigo-600">¥{repayAmount.toLocaleString()}</span>
               </p>
             </div>
          </div>

          {/* Simulation Loans Section */}
          <div className="border-t border-slate-100 pt-4">
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-700">{t('strat.sim_loan.title')}</h3>
                {!isAddingLoan && (
                  <button 
                    onClick={() => setIsAddingLoan(true)}
                    className="flex items-center gap-1 text-xs text-brand-blue hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-3 h-3" /> {t('strat.sim_loan.add_btn')}
                  </button>
                )}
             </div>

             {/* Add Loan Form */}
             {isAddingLoan && (
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-sm font-bold text-slate-800">{t('strat.sim_loan.add_title')}</span>
                     <button onClick={() => setIsAddingLoan(false)} className="text-slate-400 hover:text-slate-600">
                       <X className="w-4 h-4" />
                     </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                     <div>
                       <label className="text-xs text-slate-500 block mb-1">{t('loan.label.balance')}</label>
                       <input 
                         type="number" 
                         value={newLoanParams.balance}
                         onChange={(e) => setNewLoanParams({...newLoanParams, balance: parseFloat(e.target.value)})}
                         className="w-full p-2 text-sm border rounded"
                       />
                     </div>
                     <div>
                       <label className="text-xs text-slate-500 block mb-1">{t('loan.label.rate')}</label>
                       <input 
                         type="number" step="0.01"
                         value={newLoanParams.rate}
                         onChange={(e) => setNewLoanParams({...newLoanParams, rate: parseFloat(e.target.value)})}
                         className="w-full p-2 text-sm border rounded"
                       />
                     </div>
                     <div>
                       <label className="text-xs text-slate-500 block mb-1">{t('loan.label.months')}</label>
                       <input 
                         type="number" 
                         value={newLoanParams.months}
                         onChange={(e) => setNewLoanParams({...newLoanParams, months: parseInt(e.target.value)})}
                         className="w-full p-2 text-sm border rounded"
                       />
                     </div>
                     <div>
                       <label className="text-xs text-slate-500 block mb-1">{t('loan.label.method')}</label>
                       <select 
                         value={newLoanParams.method}
                         onChange={(e) => setNewLoanParams({...newLoanParams, method: e.target.value as RepaymentMethod})}
                         className="w-full p-2 text-sm border rounded"
                       >
                         <option value={RepaymentMethod.EQUAL_PAYMENT}>{t('loan.method.equal_payment')}</option>
                         <option value={RepaymentMethod.EQUAL_PRINCIPAL}>{t('loan.method.equal_principal')}</option>
                       </select>
                     </div>
                  </div>
                  <div className="flex justify-end gap-2">
                     <button 
                       onClick={() => setIsAddingLoan(false)} 
                       className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                     >
                       {t('strat.sim_loan.cancel')}
                     </button>
                     <button 
                       onClick={handleAddSimLoan} 
                       className="px-3 py-1.5 text-xs bg-slate-900 text-white rounded hover:bg-slate-800"
                     >
                       {t('strat.sim_loan.add')}
                     </button>
                  </div>
               </div>
             )}

             {/* List of Sim Loans */}
             <div className="space-y-2">
                {simLoans.map(loan => (
                  <div key={loan.id} className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-100 rounded-md text-sm">
                     <div className="flex-1">
                        <div className="font-bold text-indigo-900">Hypothetical Loan</div>
                        <div className="text-xs text-indigo-700">
                          ¥{loan.balance.toLocaleString()} @ {loan.rate}% • {loan.remainingMonths}mo
                        </div>
                     </div>
                     <button onClick={() => removeSimLoan(loan.id)} className="text-indigo-400 hover:text-red-500 p-1">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
                {simLoans.length === 0 && !isAddingLoan && (
                   <p className="text-xs text-slate-400 italic">No additional simulation loans.</p>
                )}
             </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 w-full">
           <h3 className="text-sm font-medium text-slate-500 mb-2 text-center">{t('strat.chart.title')}</h3>
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis hide />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                <Bar dataKey="interest" radius={[4, 4, 0, 0]}>
                   {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#94a3b8' : index === 1 ? '#10b981' : '#6366f1'} />
                   ))}
                </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option A */}
        <div className="border-2 border-brand-green bg-green-50 bg-opacity-30 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            {t('strat.opt_a.tag')}
          </div>
          <h3 className="font-bold text-slate-800 mb-4">{t('strat.opt_a.title')}</h3>
          <div className="space-y-3">
             <div className="flex justify-between items-end border-b border-green-200 pb-2">
                <span className="text-sm text-slate-600">{t('strat.opt_a.saved')}</span>
                <span className="text-xl font-bold text-green-700">¥{strategyA.totalSaved.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{t('strat.opt_a.new_monthly')}</span>
                <span className="font-medium">≈ ¥{strategyA.monthlyPayment.toFixed(0)}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-600">{t('strat.opt_a.term_reduced')}</span>
                 <span className="font-medium">{t('strat.opt_a.significantly')}</span>
             </div>
          </div>
        </div>

        {/* Option B */}
        <div className="border border-slate-300 bg-white rounded-xl p-5 relative">
          <div className="absolute top-0 right-0 bg-slate-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            {t('strat.opt_b.tag')}
          </div>
          <h3 className="font-bold text-slate-800 mb-4">{t('strat.opt_b.title')}</h3>
           <div className="space-y-3">
             <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-600">{t('strat.opt_b.reduction')}</span>
                <span className="text-xl font-bold text-indigo-600">
                   -¥{(baseline.monthlyPayment - strategyB.monthlyPayment).toFixed(0)}
                </span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{t('strat.opt_a.saved')}</span>
                <span className="font-medium text-slate-500">¥{strategyB.totalSaved.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-600">{t('strat.opt_a.new_monthly')}</span>
                 <span className="font-medium">¥{strategyB.monthlyPayment.toFixed(0)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategySimulator;