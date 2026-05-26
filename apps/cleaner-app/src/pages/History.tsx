import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Calendar, Clock, ArrowRight, Timer, CheckCircle } from 'lucide-react';
import { StatusBadge } from '@corecon/ui';
import { motion } from 'framer-motion';
export function History() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['cleaner-history'],
    queryFn: async () => {
      const response = await api.assignments.my();
      const assignments = response.data || response;
      return Array.isArray(assignments)
        ? assignments.filter((a: any) =>
            a.status === 'completed' || a.status === 'pending_verification' || a.status === 'returned'
          )
        : [];
    },
  });

  const assignments = Array.isArray(data) ? data : [];

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const getClientName = (a: any) => a.service?.clientName || a.clientName || 'Client';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-[22px] text-slate-800 dark:text-white">{t('history.title')}</h2>
        <p className="font-body text-[11px] text-slate-500 dark:text-slate-400">{assignments.length} {t('history.completed')}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-navy rounded-[24px] p-4 border border-slate-200 dark:border-slate-800">
              <div className="h-5 bg-slate-100 dark:bg-navy-light rounded-lg w-3/4 mb-3" />
              <div className="h-4 bg-slate-100 dark:bg-navy-light rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
          <p className="font-display font-bold text-[16px] text-slate-800 dark:text-white mb-1">{t('history.noHistory')}</p>
          <p className="font-body text-[11px] text-slate-500 dark:text-slate-400">{t('history.noHistoryDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment: any, index: number) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-navy rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-4 active:scale-[0.99] transition-all duration-150 cursor-pointer"
              onClick={() => navigate(`/assignment/${assignment.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/assignment/${assignment.id}`); }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-[16px] text-slate-800 dark:text-white truncate">
                    {getClientName(assignment)}
                  </h3>
                  <p className="font-body text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {assignment.serviceName || assignment.service?.name || 'Cleaning Service'}
                  </p>
                </div>
                <StatusBadge status={assignment.status} />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
                {assignment.scheduledDate && (
                  <span className="flex items-center gap-1.5 font-body text-[10px]">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {new Date(assignment.scheduledDate).toLocaleDateString()}
                  </span>
                )}
                {assignment.scheduledStartTime && (
                  <span className="flex items-center gap-1.5 font-body text-[10px]">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {formatTime(assignment.scheduledStartTime)}
                  </span>
                )}
                {assignment.totalMinutes && (
                  <span className="flex items-center gap-1.5 font-body text-[10px] text-gold-dark dark:text-gold">
                    <Timer className="w-3.5 h-3.5 shrink-0" />
                    {Math.floor(assignment.totalMinutes / 60)}h {assignment.totalMinutes % 60}m
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1 font-display text-[9px] text-slate-800 dark:text-gold font-bold uppercase tracking-wider">{t('history.viewDetails')}<ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
