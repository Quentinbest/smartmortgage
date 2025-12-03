import React, { useState } from 'react';
import { Home, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from '../services/i18n';

const CITIES = ['Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou', 'Hangzhou', 'Suzhou'];
const CITY_NAMES: Record<string, Record<string, string>> = {
  'Shanghai': { 'zh-CN': '上海', 'zh-TW': '上海' },
  'Beijing': { 'zh-CN': '北京', 'zh-TW': '北京' },
  'Shenzhen': { 'zh-CN': '深圳', 'zh-TW': '深圳' },
  'Guangzhou': { 'zh-CN': '广州', 'zh-TW': '廣州' },
  'Hangzhou': { 'zh-CN': '杭州', 'zh-TW': '杭州' },
  'Suzhou': { 'zh-CN': '苏州', 'zh-TW': '蘇州' }
};

const EligibilityDecoder: React.FC = () => {
  const { t, language } = useTranslation();
  const [step, setStep] = useState(1);
  const [city, setCity] = useState('Shanghai');
  const [ownedProperties, setOwnedProperties] = useState<number | null>(null);
  const [hasLoanHistory, setHasLoanHistory] = useState<boolean | null>(null);

  const getCityName = (city: string) => {
    if (language === 'en') return city;
    return CITY_NAMES[city]?.[language] || city;
  };

  const reset = () => {
    setStep(1);
    setOwnedProperties(null);
    setHasLoanHistory(null);
  };

  const getResult = () => {
    // "Recognize Home, Not Loan" Logic
    const isFirstHome = (ownedProperties === 0);
    return {
      status: isFirstHome ? t('policy.status.first') : t('policy.status.second'),
      downPayment: isFirstHome ? "15%" : "25%", // Illustrative standard new rates
      rateFloor: isFirstHome ? "LPR - 45bps" : "LPR - 5bps",
      color: isFirstHome ? "text-green-600" : "text-blue-600",
      bg: isFirstHome ? "bg-green-50" : "bg-blue-50"
    };
  };

  const result = getResult();
  const displayedCity = getCityName(city);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Home className="w-6 h-6 text-brand-blue" />
        <h2 className="text-xl font-bold text-slate-800">{t('policy.title')}</h2>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('policy.city.label')}</label>
            <select 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
            >
              {CITIES.map(c => <option key={c} value={c}>{getCityName(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('policy.prop.label', { city: displayedCity })}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((num) => (
                <button
                  key={num}
                  onClick={() => { setOwnedProperties(num); setStep(2); }}
                  className="p-4 border rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-all font-medium text-lg"
                >
                  {num} {num === 2 ? '+' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
             <h3 className="text-lg font-medium text-slate-800 mb-4">{t('policy.hist.title')}</h3>
             <p className="text-slate-600 mb-6">{t('policy.hist.desc')}</p>
             <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => { setHasLoanHistory(true); setStep(3); }}
                className="p-4 border rounded-lg hover:border-brand-blue hover:bg-blue-50 font-medium"
               >
                 {t('policy.hist.yes')}
               </button>
               <button 
                onClick={() => { setHasLoanHistory(false); setStep(3); }}
                className="p-4 border rounded-lg hover:border-brand-blue hover:bg-blue-50 font-medium"
               >
                 {t('policy.hist.no')}
               </button>
             </div>
          </div>
          <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm mt-4">{t('policy.back')}</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
           <div className={`p-6 rounded-lg border ${result.bg} border-opacity-50 text-center`}>
              <div className="flex justify-center mb-3">
                {result.status.includes(t('policy.status.first')) ? <CheckCircle className="w-12 h-12 text-green-500" /> : <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">2</div>}
              </div>
              <h3 className={`text-2xl font-bold ${result.color} mb-2`}>{result.status}</h3>
              <p className="text-slate-600 mb-4">
                {t('policy.result.desc', { city: displayedCity })}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-left bg-white bg-opacity-60 p-4 rounded-lg">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{t('policy.down_payment')}</div>
                  <div className="text-xl font-bold text-slate-800">{result.downPayment}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{t('policy.rate_floor')}</div>
                  <div className="text-xl font-bold text-slate-800">{result.rateFloor}</div>
                </div>
              </div>
           </div>

           <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
             <p><strong>{t('policy.analysis')}</strong> {t('policy.analysis.text', { 
               count: ownedProperties || 0, 
               city: displayedCity, 
               historyStatus: ownedProperties === 0 ? t('policy.analysis.ignored') : t('policy.analysis.secondary')
             })} 
             {ownedProperties === 0 && hasLoanHistory && ` ${t('policy.analysis.bonus')}`}
             </p>
           </div>

           <button 
             onClick={reset}
             className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
           >
             {t('policy.check_another')}
           </button>
        </div>
      )}
    </div>
  );
};

export default EligibilityDecoder;