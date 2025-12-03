import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, Info, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from '../services/i18n';

interface LPRData {
  date: string;
  lpr1: number;
  lpr5: number;
}

const LPRTrends: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<LPRData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    
    try {
      // Simulation of API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock Data
      // In a real scenario, this would be a fetch call to a financial data API
      const mockData: LPRData[] = [
        { date: '2022-01', lpr1: 3.70, lpr5: 4.60 },
        { date: '2022-05', lpr1: 3.70, lpr5: 4.45 },
        { date: '2022-08', lpr1: 3.65, lpr5: 4.30 },
        { date: '2023-01', lpr1: 3.65, lpr5: 4.30 },
        { date: '2023-06', lpr1: 3.55, lpr5: 4.20 },
        { date: '2023-08', lpr1: 3.45, lpr5: 4.20 },
        { date: '2024-02', lpr1: 3.45, lpr5: 3.95 },
        { date: '2024-07', lpr1: 3.35, lpr5: 3.85 },
        { date: '2024-10', lpr1: 3.10, lpr5: 3.60 },
        { date: '2025-01', lpr1: 3.10, lpr5: 3.60 }, 
      ];

      setData(mockData);
    } catch (err) {
      console.error("Failed to fetch LPR data", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative min-h-[300px]">
      <div className="flex items-center gap-2 mb-2 border-b pb-4">
        <TrendingDown className="w-6 h-6 text-brand-blue" />
        <div>
           <h2 className="text-xl font-bold text-slate-800">{t('lpr.title')}</h2>
           <p className="text-sm text-slate-500">{t('lpr.subtitle')}</p>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue mb-2" />
          <p className="text-sm text-slate-500">{t('lpr.loading')}</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 rounded-xl">
          <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
          <p className="text-slate-700 font-medium mb-4">{t('lpr.error')}</p>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('lpr.retry')}
          </button>
        </div>
      )}

      <div className={`h-64 w-full mt-4 transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{fontSize: 12}} />
            <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} tick={{fontSize: 12}} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            <Line type="monotone" dataKey="lpr5" name={t('lpr.legend.5y')} stroke="#1e40af" strokeWidth={3} activeDot={{ r: 6 }} isAnimationActive={!loading} />
            <Line type="monotone" dataKey="lpr1" name={t('lpr.legend.1y')} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" isAnimationActive={!loading} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3" /> {t('lpr.source')}
        </span>
        <span className="hidden md:inline">•</span>
        <span>{t('lpr.updated')}</span>
      </div>
    </div>
  );
};

export default LPRTrends;