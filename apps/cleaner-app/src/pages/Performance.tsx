import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Award, Clock, TrendingUp, AlertTriangle, CheckCircle, Star } from 'lucide-react';

export function Performance() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['my-performance'],
    queryFn: () => api.rendimiento.getMyDashboard(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const d = data as any;
  if (!d) return null;

  const s = d.summary;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-[20px] text-navy dark:text-white">{t('performance.title')}</h1>
        <p className="font-body text-[12px] text-gray-400">{t('performance.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-white dark:bg-navy border border-gray-100 dark:border-slate-800 shadow-sm">
          <Award className="w-5 h-5 text-gold-dark dark:text-gold mb-2" />
          <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest">{t('performance.qualityScore')}</p>
          <p className="font-display font-bold text-[28px] text-navy dark:text-white">{s.qualityScore.toFixed(1)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-white dark:bg-navy border border-gray-100 dark:border-slate-800 shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-500 mb-2" />
          <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest">{t('performance.completed')}</p>
          <p className="font-display font-bold text-[28px] text-navy dark:text-white">{s.servicesCompleted}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-white dark:bg-navy border border-gray-100 dark:border-slate-800 shadow-sm">
          <Clock className="w-5 h-5 text-blue-500 mb-2" />
          <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest">{t('performance.hours')}</p>
          <p className="font-display font-bold text-[28px] text-navy dark:text-white">{s.totalHours}h</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-white dark:bg-navy border border-gray-100 dark:border-slate-800 shadow-sm">
          <TrendingUp className="w-5 h-5 text-purple-500 mb-2" />
          <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest">{t('performance.attendance')}</p>
          <p className="font-display font-bold text-[28px] text-emerald-600 dark:text-emerald-400">{s.attendanceRate.toFixed(0)}%</p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="p-4 rounded-2xl bg-white dark:bg-navy border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-gold-dark dark:text-gold" />
          <h2 className="font-display font-bold text-[14px] text-navy dark:text-white">{t('performance.punctualityAttendance')}</h2>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[11px] font-body mb-1">
              <span className="text-gray-500">{t('performance.attendanceRate')}</span>
              <span className="font-bold text-navy dark:text-white">{d.attendance.attendanceRate.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${d.attendance.attendanceRate}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-body mb-1">
              <span className="text-gray-500">{t('performance.punctualityRate')}</span>
              <span className="font-bold text-navy dark:text-white">{d.attendance.punctualityRate.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${d.attendance.punctualityRate}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] font-body">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-light/30">
              <p className="font-bold text-navy dark:text-white">{d.attendance.totalAssigned}</p>
              <p className="text-gray-400">{t('performance.assigned')}</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-light/30">
              <p className="font-bold text-emerald-600">{d.attendance.totalAttended}</p>
              <p className="text-gray-400">{t('performance.attended')}</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-light/30">
              <p className="font-bold text-amber-600">{d.attendance.totalLateArrivals}</p>
              <p className="text-gray-400">{t('performance.late')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {d.serviceTimeBreakdown?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="p-4 rounded-2xl bg-white dark:bg-navy border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gold-dark dark:text-gold" />
            <h2 className="font-display font-bold text-[14px] text-navy dark:text-white">{t('performance.serviceTimeBreakdown')}</h2>
          </div>
          <div className="space-y-2">
            {d.serviceTimeBreakdown.map((st: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-light/30">
                <div>
                  <p className="font-display font-bold text-[12px] text-navy dark:text-white capitalize">{st.serviceType.replace(/_/g, ' ')}</p>
                  <p className="font-body text-[9px] text-gray-400">{st.totalServices} {t('performance.services')}</p>
                </div>
                <div className="text-right">
                  <p className="font-body text-[11px]"><span className="text-gray-400">{t('performance.actual')}:</span> {st.avgActualMinutes}m</p>
                  <p className="font-body text-[10px]"><span className="text-gray-400">{t('performance.est')}:</span> {st.avgEstimatedMinutes}m</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {d.recentEvaluations?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="p-4 rounded-2xl bg-white dark:bg-navy border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-gold-dark dark:text-gold" />
            <h2 className="font-display font-bold text-[14px] text-navy dark:text-white">{t('performance.recentEvaluations')}</h2>
          </div>
          <div className="space-y-2">
            {d.recentEvaluations.map((ev: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-navy-light/30">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-display font-bold text-[12px] text-navy dark:text-white">{ev.evaluatorName || t('performance.supervisor')}</p>
                    <p className="font-body text-[9px] text-gray-400">{ev.serviceType?.replace(/_/g, ' ') || '—'}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className={`w-2 h-2 rounded-full ${j < ev.score ? 'bg-gold' : 'bg-gray-200 dark:bg-slate-700'}`} />
                    ))}
                  </div>
                </div>
                {ev.comment && <p className="font-body text-[10px] text-gray-500 mt-1 italic">"{ev.comment}"</p>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {d.recentIncidents?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="p-4 rounded-2xl bg-white dark:bg-navy border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-display font-bold text-[14px] text-navy dark:text-white">{t('performance.incidents')}</h2>
          </div>
          <div className="space-y-2">
            {d.recentIncidents.map((inc: any, i: number) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-light/30">
                <div className="flex justify-between items-start">
                  <span className="font-display font-bold text-[11px] text-navy dark:text-white">{inc.type}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    inc.severity === 'high' || inc.severity === 'critical'
                      ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}>{inc.severity}</span>
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                  <span>{new Date(inc.date).toLocaleDateString()}</span>
                  <span className={inc.status === 'resolved' || inc.status === 'closed' ? 'text-emerald-500' : 'text-amber-500'}>{inc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
