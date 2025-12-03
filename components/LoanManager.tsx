
import React, { useState } from 'react';
import { Plus, Trash2, Wallet, Building2, TrendingDown, ChevronDown, ChevronUp, BarChart2, Filter, AlertCircle, Info as InfoIcon, CalendarClock, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loan, LoanType, RepaymentMethod, PaymentFrequency } from '../types';
import { useTranslation } from '../services/i18n';

interface LoanManagerProps {
  loans: Loan[];
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
}

// Approximate historical benchmark data
const historicalRates = [
  { date: '2021-Q1', commercial: 4.65, provident: 3.25 },
  { date: '2021-Q3', commercial: 4.65, provident: 3.25 },
  { date: '2022-Q1', commercial: 4.60, provident: 3.25 },
  { date: '2022-Q3', commercial: 4.30, provident: 3.25 },
  { date: '2022-Q4', commercial: 4.30, provident: 3.10 },
  { date: '2023-Q2', commercial: 4.20, provident: 3.10 },
  { date: '2024-Q1', commercial: 3.95, provident: 3.10 },
  { date: '2024-Q2', commercial: 3.85, provident: 2.85 },
  { date: '2024-Q4', commercial: 3.60, provident: 2.85 },
  { date: '2025-Q1', commercial: 3.50, provident: 2.85 },
];

const LoanManager: React.FC<LoanManagerProps> = ({ loans, setLoans }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'COMBINED' | 'COMMERCIAL' | 'PROVIDENT'>('COMBINED');
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [expandedRecurringId, setExpandedRecurringId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});

  const addLoan = (type: LoanType) => {
    const newLoan: Loan = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      balance: type === LoanType.COMMERCIAL ? 1000000 : 500000,
      rate: type === LoanType.COMMERCIAL ? 3.85 : 2.85,
      remainingMonths: 360,
      method: RepaymentMethod.EQUAL_PAYMENT,
      recurring: {
        amount: 0,
        frequency: PaymentFrequency.MONTHLY,
        enabled: false
      }
    };
    setLoans([...loans, newLoan]);
  };

  const updateLoan = (id: string, field: keyof Loan, value: any) => {
    setLoans(loans.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const updateRecurring = (id: string, field: string, value: any) => {
    setLoans(loans.map(l => {
      if (l.id !== id) return l;
      const current = l.recurring || { amount: 0, frequency: PaymentFrequency.MONTHLY, enabled: false };
      return {
        ...l,
        recurring: { ...current, [field]: value }
      };
    }));
  };

  const validateInput = (field: keyof Loan, value: number) => {
    if (isNaN(value)) return t('loan.error.required');
    if (field === 'balance' && value <= 0) return t('loan.error.balance');
    if (field === 'rate' && value < 0) return t('loan.error.rate');
    if (field === 'remainingMonths') {
      if (value <= 0) return t('loan.error.months');
      if (!Number.isInteger(value)) return t('loan.error.months');
    }
    return null;
  };

  const handleInputChange = (id: string, field: keyof Loan, valueStr: string) => {
    const value = parseFloat(valueStr);
    const error = validateInput(field, value);

    setErrors(prev => {
       const loanErrors = { ...(prev[id] || {}) };
       if (error) loanErrors[field as string] = error;
       else delete loanErrors[field as string];
       
       if (Object.keys(loanErrors).length === 0) {
          const { [id]: _, ...rest } = prev;
          return rest;
       }
       return { ...prev, [id]: loanErrors };
    });

    // Support clearing input by allowing NaN in state if needed, though strictly we keep state numeric
    // Using NaN allows the input value prop to interpret it as empty string
    updateLoan(id, field, isNaN(value) ? NaN : value); 
  };

  const getError = (id: string, field: string) => errors[id]?.[field];

  const removeLoan = (id: string) => {
    setLoans(loans.filter(l => l.id !== id));
    // Clean up errors for deleted loan
    setErrors(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
    });
  };

  const clearAllLoans = () => {
    if (loans.length === 0) return;
    if (window.confirm(t('loan.clear.confirm'))) {
      setLoans([]);
      setErrors({});
    }
  };

  const toggleSchedule = (id: string) => {
    if (expandedLoanId === id) setExpandedLoanId(null);
    else {
      setExpandedLoanId(id);
      setExpandedRecurringId(null);
    }
  };

  const toggleRecurring = (id: string) => {
    if (expandedRecurringId === id) setExpandedRecurringId(null);
    else {
      setExpandedRecurringId(id);
      setExpandedLoanId(null);
    }
  };

  const generateSchedule = (loan: Loan) => {
    // Graceful handling for invalid inputs during typing
    if (isNaN(loan.balance) || loan.balance <= 0) return [];
    if (isNaN(loan.rate) || loan.rate < 0) return [];
    if (isNaN(loan.remainingMonths) || loan.remainingMonths <= 0) return [];

    const r = loan.rate / 100 / 12;
    let balance = loan.balance;
    const schedule = [];
    const pointsToShow = Math.min(60, loan.remainingMonths); // Show first 5 years (60 months) or remaining

    // Pre-calculate monthly principal for equal principal method
    const fixedPrincipal = loan.balance / loan.remainingMonths;

    for (let i = 1; i <= pointsToShow; i++) {
        let interest = balance * r;
        let principal = 0;
        let payment = 0;

        if (loan.method === RepaymentMethod.EQUAL_PAYMENT) {
            const n = loan.remainingMonths - (i - 1);
            if (n <= 0) break;
            
            // Standard banking formula for the monthly payment
            payment = (balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            principal = payment - interest;
        } else {
            // Equal Principal
            principal = fixedPrincipal;
            payment = principal + interest;
        }

        schedule.push({
            month: i,
            principal: parseFloat(principal.toFixed(2)),
            interest: parseFloat(interest.toFixed(2)),
            balance: parseFloat((balance - principal).toFixed(2))
        });
        balance -= principal;
    }
    return schedule;
  };

  const filteredLoans = activeTab === 'COMBINED' ? loans : loans.filter(l => l.type === activeTab);

  const totalBalance = loans.reduce((acc, l) => acc + (isNaN(l.balance) ? 0 : l.balance), 0);
  const weightedRate = totalBalance > 0 
    ? loans.reduce((acc, l) => acc + ((isNaN(l.rate) ? 0 : l.rate) * (isNaN(l.balance) ? 0 : l.balance)), 0) / totalBalance 
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{t('loan.manager.title')}</h2>
            <p className="text-slate-500 text-sm">{t('loan.manager.subtitle')}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">{t('loan.total_outstanding')}</div>
            <div className="text-3xl font-bold text-slate-900">¥{totalBalance.toLocaleString()}</div>
            <div className="text-xs font-medium text-brand-blue bg-blue-50 px-2 py-1 rounded inline-block mt-1">
              {t('loan.weighted_rate')}: {isNaN(weightedRate) ? '0.00' : weightedRate.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Filter / Toggle Control & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Filter className="w-4 h-4" />
                <span>{t('loan.filter.label')}:</span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                {[
                  { id: 'COMBINED', label: t('loan.tab.combined') },
                  { id: 'COMMERCIAL', label: t('loan.tab.commercial') },
                  { id: 'PROVIDENT', label: t('loan.tab.provident') }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      activeTab === tab.id 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loans.length > 0 && (
                <button 
                  onClick={clearAllLoans}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors w-fit"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('loan.clear.button')}
                </button>
            )}
        </div>
      </div>

      <div className="p-6 space-y-4 bg-slate-50 min-h-[300px]">
        {filteredLoans.map((loan) => (
          <div 
            key={loan.id} 
            className={`rounded-lg border-l-4 shadow-sm bg-white transition-all hover:shadow-md ${
              loan.type === LoanType.COMMERCIAL ? 'border-brand-blue' : 'border-brand-green'
            }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {loan.type === LoanType.COMMERCIAL ? (
                    <Building2 className="w-5 h-5 text-brand-blue" />
                  ) : (
                    <Wallet className="w-5 h-5 text-brand-green" />
                  )}
                  <span className="font-bold text-slate-700">
                    {loan.type === LoanType.COMMERCIAL ? t('loan.type.commercial') : t('loan.type.provident')}
                  </span>
                </div>
                <button onClick={() => removeLoan(loan.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('loan.label.balance')}</label>
                  <input 
                    type="number" 
                    value={isNaN(loan.balance) ? '' : loan.balance}
                    onChange={(e) => handleInputChange(loan.id, 'balance', e.target.value)}
                    className={`w-full p-2 border rounded text-sm outline-none focus:ring-1 ${
                        getError(loan.id, 'balance') ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-brand-blue'
                    }`}
                  />
                  {getError(loan.id, 'balance') && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3 h-3" />
                        {getError(loan.id, 'balance')}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('loan.label.rate')}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={isNaN(loan.rate) ? '' : loan.rate}
                    onChange={(e) => handleInputChange(loan.id, 'rate', e.target.value)}
                    className={`w-full p-2 border rounded text-sm outline-none focus:ring-1 ${
                        getError(loan.id, 'rate') ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-brand-blue'
                    }`}
                  />
                   {getError(loan.id, 'rate') && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3 h-3" />
                        {getError(loan.id, 'rate')}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('loan.label.months')}</label>
                  <input 
                    type="number" 
                    value={isNaN(loan.remainingMonths) ? '' : loan.remainingMonths}
                    onChange={(e) => handleInputChange(loan.id, 'remainingMonths', e.target.value)}
                    className={`w-full p-2 border rounded text-sm outline-none focus:ring-1 ${
                        getError(loan.id, 'remainingMonths') ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-brand-blue'
                    }`}
                  />
                   {getError(loan.id, 'remainingMonths') && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3 h-3" />
                        {getError(loan.id, 'remainingMonths')}
                    </div>
                  )}
                </div>
                <div>
                   <label className="block text-xs text-slate-500 mb-1">{t('loan.label.method')}</label>
                   <select 
                      value={loan.method}
                      onChange={(e) => updateLoan(loan.id, 'method', e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-brand-blue outline-none"
                   >
                     <option value={RepaymentMethod.EQUAL_PAYMENT}>{t('loan.method.equal_payment')}</option>
                     <option value={RepaymentMethod.EQUAL_PRINCIPAL}>{t('loan.method.equal_principal')}</option>
                   </select>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-50">
                 <button 
                   onClick={() => toggleRecurring(loan.id)}
                   disabled={!!errors[loan.id]}
                   className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                       !!errors[loan.id] ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-brand-blue'
                   }`}
                 >
                    <CalendarClock className="w-3 h-3" />
                    {t('loan.recurring.btn')}
                    {expandedRecurringId === loan.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                 </button>
                 <div className="w-px bg-slate-200 h-4 self-center"></div>
                 <button 
                   onClick={() => toggleSchedule(loan.id)}
                   disabled={!!errors[loan.id]}
                   className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                       !!errors[loan.id] ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-brand-blue'
                   }`}
                 >
                    <BarChart2 className="w-3 h-3" />
                    {expandedLoanId === loan.id ? t('loan.schedule.hide') : t('loan.schedule.view')}
                    {expandedLoanId === loan.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                 </button>
              </div>
            </div>

            {/* Expandable Recurring Settings */}
            {expandedRecurringId === loan.id && (
              <div className="bg-gradient-to-br from-indigo-50 to-white border-t border-indigo-100 p-5 animate-in slide-in-from-top-2 duration-200">
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-indigo-600" />
                      {t('loan.recurring.title')}
                    </h4>
                    <div className="flex items-center gap-2">
                       <input 
                         type="checkbox" 
                         id={`rec-enable-${loan.id}`}
                         checked={loan.recurring?.enabled || false}
                         onChange={(e) => updateRecurring(loan.id, 'enabled', e.target.checked)}
                         className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                       />
                       <label htmlFor={`rec-enable-${loan.id}`} className="text-sm text-indigo-800 font-medium select-none cursor-pointer">
                         {t('loan.recurring.enable')}
                       </label>
                    </div>
                 </div>

                 {loan.recurring?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-2 duration-300">
                      {/* Amount Input */}
                      <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                        <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                          {t('loan.recurring.amount')}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-indigo-500 font-bold text-lg">¥</span>
                          </div>
                          <input 
                            type="number" 
                            min="0"
                            step="100"
                            value={loan.recurring?.amount || ''}
                            onChange={(e) => updateRecurring(loan.id, 'amount', parseFloat(e.target.value))}
                            className="block w-full pl-8 pr-12 py-2.5 border border-indigo-200 rounded-md leading-5 bg-slate-50 placeholder-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-bold text-indigo-900 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      {/* Frequency Selection */}
                      <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                        <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                          {t('loan.recurring.frequency')}
                        </label>
                        <div className="flex gap-2">
                          {[
                            { value: PaymentFrequency.WEEKLY, label: t('loan.freq.weekly') },
                            { value: PaymentFrequency.BI_WEEKLY, label: t('loan.freq.bi_weekly') },
                            { value: PaymentFrequency.MONTHLY, label: t('loan.freq.monthly') }
                          ].map((option) => {
                            const isSelected = loan.recurring?.frequency === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => updateRecurring(loan.id, 'frequency', option.value)}
                                className={`flex-1 py-2 px-2 text-xs font-bold rounded-md border transition-all flex flex-col items-center justify-center gap-1 ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' 
                                    : 'bg-slate-50 text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-300'
                                }`}
                              >
                                {option.label}
                                {isSelected && <Check className="w-3 h-3" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                 )}
              </div>
            )}

            {/* Expandable Schedule Chart */}
            {expandedLoanId === loan.id && (
                <div className="bg-slate-50 border-t border-slate-100 p-4 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-2">{t('loan.schedule.title')} (Next 5 Years)</h4>
                    <p className="text-xs text-slate-500 mb-4 bg-white p-2 rounded border border-slate-200">
                        <InfoIcon className="w-3 h-3 inline mr-1 text-brand-blue align-middle" />
                        {t('loan.schedule.desc')}
                    </p>
                    <div className="h-48 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={generateSchedule(loan)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barSize={10}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tick={{fontSize: 10}} label={{ value: t('loan.schedule.month'), position: 'insideBottom', offset: -5, fontSize: 10 }} />
                            <YAxis tick={{fontSize: 10}} />
                            <Tooltip 
                               formatter={(value: number) => [`¥${value.toFixed(2)}`, '']}
                               labelFormatter={(label) => `${t('loan.schedule.month')}: ${label}`}
                               contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{fontSize: '10px'}} />
                            <Bar dataKey="interest" name={t('loan.schedule.interest')} stackId="a" fill="#f87171" />
                            <Bar dataKey="principal" name={t('loan.schedule.principal')} stackId="a" fill="#4ade80" />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                </div>
            )}
          </div>
        ))}

        {filteredLoans.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            {t('loan.empty')}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button 
            onClick={() => addLoan(LoanType.COMMERCIAL)}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-brand-blue text-brand-blue rounded-lg hover:bg-blue-50 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('loan.add.commercial')}
          </button>
          <button 
            onClick={() => addLoan(LoanType.PROVIDENT)}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-brand-green text-brand-green rounded-lg hover:bg-green-50 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('loan.add.provident')}
          </button>
        </div>
      </div>
      
      {/* Historical Rates Chart Section */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-slate-600" />
          <div>
            <h3 className="text-base font-bold text-slate-800">{t('loan.history.title')}</h3>
            <p className="text-xs text-slate-500">{t('loan.history.subtitle')}</p>
          </div>
        </div>
        <div className="h-48 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={historicalRates} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="date" tick={{fontSize: 10}} />
               <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} tick={{fontSize: 10}} />
               <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
               />
               <Legend iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
               <Line type="stepAfter" dataKey="commercial" name={t('loan.type.commercial')} stroke="#1e40af" strokeWidth={2} dot={false} />
               <Line type="stepAfter" dataKey="provident" name={t('loan.type.provident')} stroke="#10b981" strokeWidth={2} dot={false} />
             </LineChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LoanManager;
