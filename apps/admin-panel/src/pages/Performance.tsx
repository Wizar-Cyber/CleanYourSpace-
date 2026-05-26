import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, TrendingUp, Award, Clock, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Performance() {
  const { t } = useTranslation();
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const { data: cleanersData } = useQuery({
    queryKey: ['cleaners'],
    queryFn: () => api.users.cleaners(),
  });

  const cleaners = useMemo(() => {
    const list = cleanersData?.data ?? [];
    return list.filter((c: any) =>
      c.role === 'contractor' &&
      (!search || c.firstName?.toLowerCase().includes(search.toLowerCase()) || c.lastName?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [cleanersData, search]);

  const { data: dashboard } = useQuery({
    queryKey: ['rendimiento-dashboard', selectedContractor],
    queryFn: () => selectedContractor ? api.rendimiento.getDashboard(selectedContractor) : null,
    enabled: !!selectedContractor,
  });

  const { data: comparative } = useQuery({
    queryKey: ['rendimiento-comparative', comparisonIds, dateFrom, dateTo],
    queryFn: () => comparisonIds.length > 0 ? api.rendimiento.getComparativeReport(comparisonIds, dateFrom, dateTo) : null,
    enabled: comparisonIds.length > 0,
  });

  const toggleComparison = (id: string) => {
    setComparisonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">{t('performance.title')}</h1>
        <p className="page-subtitle">{t('performance.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('performance.searchContractors')}
            className="w-full h-11 pl-11 pr-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold shadow-sm transition-all"
          />
        </div>
        <div className="flex gap-3">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gold-dark dark:text-gold" />
            <h2 className="font-display font-bold text-[15px] text-navy dark:text-white">{t('performance.contractors')}</h2>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {cleaners.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-colors">
                <input type="checkbox" checked={comparisonIds.includes(c.id)} onChange={() => toggleComparison(c.id)}
                  className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold/40" />
                <button onClick={() => setSelectedContractor(c.id)}
                  className="flex-1 text-left flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold-dark dark:text-gold flex items-center justify-center font-display font-bold text-[11px]">
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-display font-bold text-[13px] text-navy dark:text-white">{c.firstName} {c.lastName}</p>
                    <p className="font-body text-[10px] text-gray-400">{c.email}</p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {dashboard && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-gold-dark dark:text-gold" />
              <h2 className="font-display font-bold text-[15px] text-navy dark:text-white">{dashboard.contractor.firstName}'s Summary</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-light/30">
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('performance.qualityScore')}</p>
                <p className="font-display font-bold text-[24px] text-navy dark:text-white">{dashboard.summary.qualityScore.toFixed(1)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-light/30">
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('performance.attendance')}</p>
                <p className="font-display font-bold text-[24px] text-emerald-600 dark:text-emerald-400">{dashboard.summary.attendanceRate.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-light/30">
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('performance.punctuality')}</p>
                <p className="font-display font-bold text-[24px] text-blue-600 dark:text-blue-400">{dashboard.summary.punctualityRate.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-light/30">
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('performance.completed')}</p>
                <p className="font-display font-bold text-[24px] text-gold-dark dark:text-gold">{dashboard.summary.servicesCompleted}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {comparative && comparative.entries && comparative.entries.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-gold-dark dark:text-gold" />
            <h2 className="font-display font-bold text-[15px] text-navy dark:text-white">{t('performance.comparativeReport')}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-light/30 text-center">
              <p className="font-body text-[9px] text-gray-400 uppercase tracking-widest">{t('performance.avgAttendance')}</p>
              <p className="font-display font-bold text-[18px] text-emerald-600 dark:text-emerald-400">{comparative.averages.attendanceRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-light/30 text-center">
              <p className="font-body text-[9px] text-gray-400 uppercase tracking-widest">{t('performance.avgPunctuality')}</p>
              <p className="font-display font-bold text-[18px] text-blue-600 dark:text-blue-400">{comparative.averages.punctualityRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-light/30 text-center">
              <p className="font-body text-[9px] text-gray-400 uppercase tracking-widest">{t('performance.avgQuality')}</p>
              <p className="font-display font-bold text-[18px] text-gold-dark dark:text-gold">{comparative.averages.qualityScore.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-light/30 text-center">
              <p className="font-body text-[9px] text-gray-400 uppercase tracking-widest">{t('performance.avgServices')}</p>
              <p className="font-display font-bold text-[18px] text-navy dark:text-white">{comparative.averages.servicesCompleted.toFixed(1)}</p>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparative.entries.map((e: any) => ({
                name: e.contractorName.split(' ')[0],
                attendance: e.attendanceRate,
                punctuality: e.punctualityRate,
                quality: e.qualityScore,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="attendance" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="punctuality" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quality" fill="#B8860B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-[11px] font-body">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">{t('performance.contractor')}</th>
                  <th className="text-right py-3 font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">{t('performance.services')}</th>
                  <th className="text-right py-3 font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">{t('performance.hours')}</th>
                  <th className="text-right py-3 font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">{t('performance.attendance')}</th>
                  <th className="text-right py-3 font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">{t('performance.punctuality')}</th>
                  <th className="text-right py-3 font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">{t('performance.quality')}</th>
                  <th className="text-right py-3 font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">{t('performance.avgEval')}</th>
                  <th className="text-right py-3 font-display font-bold text-[10px] uppercase tracking-widest text-gray-400">{t('performance.incidents')}</th>
                </tr>
              </thead>
              <tbody>
                {comparative.entries.map((e: any) => (
                  <tr key={e.contractorId} className="border-b border-gray-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-navy-light/20">
                    <td className="py-3 font-display font-bold text-navy dark:text-white">{e.contractorName}</td>
                    <td className="text-right py-3">{e.servicesCompleted}</td>
                    <td className="text-right py-3">{e.totalHours}h</td>
                    <td className="text-right py-3 text-emerald-600 dark:text-emerald-400">{e.attendanceRate.toFixed(1)}%</td>
                    <td className="text-right py-3 text-blue-600 dark:text-blue-400">{e.punctualityRate.toFixed(1)}%</td>
                    <td className="text-right py-3 text-gold-dark dark:text-gold">{e.qualityScore.toFixed(1)}</td>
                    <td className="text-right py-3">{e.avgEvaluationScore?.toFixed(1) ?? '\u2014'}</td>
                    <td className="text-right py-3">
                      <span className={`${e.incidentCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>{e.incidentCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gold-dark dark:text-gold" />
              <h2 className="font-display font-bold text-[15px] text-navy dark:text-white">{t('performance.serviceTimeBreakdown')}</h2>
            </div>
            <div className="space-y-3">
              {dashboard.serviceTimeBreakdown?.length > 0 ? dashboard.serviceTimeBreakdown.map((st: any, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-light/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display font-bold text-[12px] text-navy dark:text-white capitalize">{st.serviceType.replace(/_/g, ' ')}</span>
                    <span className="font-body text-[11px] text-gray-400">{st.totalServices} {t('performance.services')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-body">
                    <span>{t('performance.avgActual')} <strong className="text-navy dark:text-white">{st.avgActualMinutes}min</strong></span>
                    <span>{t('performance.avgEstimated')} <strong className="text-navy dark:text-white">{st.avgEstimatedMinutes}min</strong></span>
                    <span className={st.variancePercent > 10 ? 'text-red-500' : 'text-emerald-500'}>
                      {st.variancePercent > 0 ? '+' : ''}{st.variancePercent}%
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-[13px] text-gray-400 text-center py-8">{t('performance.noTimeData')}</p>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-gold-dark dark:text-gold" />
              <h2 className="font-display font-bold text-[15px] text-navy dark:text-white">{t('performance.recentEvaluations')}</h2>
            </div>
            <div className="space-y-3">
              {dashboard.recentEvaluations?.length > 0 ? dashboard.recentEvaluations.map((ev: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-light/30">
                  <div>
                    <p className="font-display font-bold text-[12px] text-navy dark:text-white">{ev.evaluatorName || t('performance.supervisor')}</p>
                    <p className="font-body text-[10px] text-gray-400">{ev.serviceType ? ev.serviceType.replace(/_/g, ' ') : '\u2014'}</p>
                    {ev.comment && <p className="font-body text-[10px] text-gray-500 mt-1 italic">"{ev.comment}"</p>}
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className={`w-2.5 h-2.5 rounded-full ${j < ev.score ? 'bg-gold' : 'bg-gray-200 dark:bg-slate-700'}`} />
                    ))}
                  </div>
                </div>
              )) : (
                <p className="text-[13px] text-gray-400 text-center py-8">{t('performance.noEvaluations')}</p>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-gold-dark dark:text-gold" />
              <h2 className="font-display font-bold text-[15px] text-navy dark:text-white">{t('performance.recentIncidents')}</h2>
            </div>
            <div className="space-y-3">
              {dashboard.recentIncidents?.length > 0 ? dashboard.recentIncidents.map((inc: any, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-light/30">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-display font-bold text-[12px] text-navy dark:text-white">{inc.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-display font-bold uppercase tracking-wider ${
                      inc.severity === 'critical' || inc.severity === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>{inc.severity}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-body text-gray-400">
                    <span>{new Date(inc.date).toLocaleDateString()}</span>
                    <span className={inc.status === 'resolved' || inc.status === 'closed' ? 'text-emerald-500' : 'text-amber-500'}>{inc.status}</span>
                  </div>
                  {inc.resolution && <p className="text-[10px] text-gray-500 mt-1">{inc.resolution}</p>}
                </div>
              )) : (
                <p className="text-[13px] text-gray-400 text-center py-8">{t('performance.noIncidents')}</p>
              )}
            </div>
          </motion.div>

          {dashboard.scoreHistory?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-gold-dark dark:text-gold" />
                <h2 className="font-display font-bold text-[15px] text-navy dark:text-white">{t('performance.scoreHistory')}</h2>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.scoreHistory.map((s: any) => ({
                    period: new Date(s.periodStart).toLocaleDateString('en', { month: 'short' }),
                    quality: s.qualityScore,
                    attendance: s.attendanceRate,
                    punctuality: s.punctualityRate,
                  })).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="quality" fill="#B8860B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attendance" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="punctuality" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
