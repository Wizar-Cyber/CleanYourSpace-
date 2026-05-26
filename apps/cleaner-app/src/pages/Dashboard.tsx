import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { saveAssignmentOffline, getOfflineAssignments } from '../services/db';
import { Calendar, MapPin, Clock, ArrowRight, Timer } from 'lucide-react';
import { StatusBadge } from '@corecon/ui';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

export function Dashboard() {
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['cleaner-today'],
    queryFn: async () => {
      try {
        const response = await api.assignments.today();
        const assignments = response.data || response;
        if (Array.isArray(assignments)) {
          await Promise.all(assignments.map((a: any) => {
            const clientName = a.service?.clientName || a.clientName;
            const clientAddress = a.service?.address || a.clientAddress;
            return saveAssignmentOffline({
              id: a.id, serviceId: a.serviceId, cleanerId: a.cleanerId,
              scheduledDate: a.scheduledDate, scheduledStartTime: a.scheduledStartTime,
              scheduledEndTime: a.scheduledEndTime, status: a.status,
              clientName, clientAddress, notes: a.notes, serviceName: a.service?.name,
              timerStart: a.timerStart, timerEnd: a.timerEnd, totalMinutes: a.totalMinutes,
              synced: true, updatedAt: new Date().toISOString(),
            });
          }));
        }
        return assignments;
      } catch {
        return getOfflineAssignments();
      }
    },
    refetchInterval: isOnline ? 30000 : false,
  });

  const assignments = Array.isArray(data) ? data : [];

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const getClientName = (a: any) => a.service?.clientName || a.clientName || 'Client';
  const getClientAddress = (a: any) => a.service?.address || a.clientAddress || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-[22px] text-slate-800 dark:text-white">{t('dashboard.today')}</h2>
          <p className="font-body text-[11px] text-slate-500 dark:text-slate-400">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
        </div>
        {!isOnline && (
          <span className="bg-warning/10 text-warning font-display text-[9px] px-3 py-1.5 rounded-xl border border-warning/20">{t('common.offline')}</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-navy rounded-[24px] p-4 border border-slate-200 dark:border-slate-800 shadow-card">
              <div className="h-5 bg-slate-100 dark:bg-navy-light rounded-lg w-3/4 mb-3" />
              <div className="h-4 bg-slate-100 dark:bg-navy-light rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 shadow-soft flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-500" />
          </div>
          <p className="font-display font-bold text-[16px] text-slate-800 dark:text-white mb-1">{t('dashboard.allClear')}</p>
          <p className="font-body text-[11px] text-slate-500 dark:text-slate-400">{t('dashboard.noAssignments')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment: any, index: number) => (
            <motion.div
              key={assignment.id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
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
                {getClientAddress(assignment) && (
                  <span className="flex items-center gap-1.5 font-body text-[10px]">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {getClientAddress(assignment)?.split(',')[0]}
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
                    {assignment.totalMinutes}m
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1 font-display text-[9px] text-slate-800 dark:text-gold font-bold uppercase tracking-wider">{t('dashboard.viewDetails')}<ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
