import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { saveChecklistItemOffline, getOfflineChecklist } from '../services/db';
import { CheckCircle, Circle, XCircle, MinusCircle, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { motion } from 'framer-motion';
import { useToast } from '../components/Toast';

export function Checklist() {
  const { t } = useTranslation();
  const { id: assignmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  const { addToast } = useToast();

  const { data: items, isLoading } = useQuery({
    queryKey: ['checklist', assignmentId],
    queryFn: async () => {
      try {
        const response = await api.checklist.get(assignmentId!);
        return response.data || response;
      } catch {
        return getOfflineChecklist(assignmentId!);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      if (isOnline) return api.checklist.updateItem(id, { status, notes });
      await saveChecklistItemOffline({ id, assignmentId: assignmentId!, templateItemId: id, label: '', status, notes, synced: false, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist', assignmentId] }),
  });

  const checklistItems = Array.isArray(items) ? items : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-success" />;
      case 'failed': return <XCircle className="w-6 h-6 text-error" />;
      case 'na': return <MinusCircle className="w-6 h-6 text-gray-400 dark:text-slate-500" />;
      default: return <Circle className="w-6 h-6 text-gray-300 dark:text-slate-600" />;
    }
  };

  const nextStatus = (current: string): string => {
    const order = ['pending', 'completed', 'failed', 'na'];
    const idx = order.indexOf(current);
    return order[(idx + 1) % order.length];
  };

  const { data: photos } = useQuery({
    queryKey: ['photos-count', assignmentId],
    queryFn: async () => {
      try {
        const res = await api.photos.getByAssignment(assignmentId!);
        return { count: (res.data || res || []).length };
      } catch { return { count: 0 }; }
    },
    enabled: isOnline && !!assignmentId,
  });

  const photoCount = photos?.count ?? 0;

  const handleToggle = (item: any) => {
    const newStatus = nextStatus(item.status);
    const requiresPhoto = item.templateItem?.required || item.required;
    if (newStatus === 'completed' && requiresPhoto && photoCount === 0) {
      addToast(t('checklist.photoRequired'), 'info');
      return;
    }
    updateMutation.mutate({ id: item.id, status: newStatus });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <button onClick={() => navigate(`/assignment/${assignmentId}`)} className="font-display text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-gold transition-colors">← {t('assignment.back')}</button>

      <h2 className="font-display font-bold text-[22px] text-slate-800 dark:text-white">{t('checklist.title')}</h2>

      {!isOnline && (
        <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-body text-[11px] p-4 rounded-[24px] border border-amber-200 dark:border-amber-500/20">{t('checklist.offlineBanner')}</div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-100 dark:bg-navy-light rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : checklistItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-body text-slate-500 dark:text-slate-400">{t('checklist.noItems')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {checklistItems.map((item: any, index: number) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleToggle(item)}
              className="w-full bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 flex items-center gap-3 active:bg-slate-50 dark:active:bg-navy-light transition-colors text-left shadow-sm"
            >
              {getStatusIcon(item.status)}
              <div className="flex-1 min-w-0">
                <p className="font-body text-[13px] font-medium text-slate-800 dark:text-slate-200">{item.templateItem?.label || item.label}</p>
                {item.notes && <p className="font-body text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.notes}</p>}
              </div>
              {item.templateItem?.required && (
                <span className="font-display text-[9px] font-bold uppercase tracking-wider text-error dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{t('checklist.required')}</span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-3 text-[11px] font-body text-slate-500 dark:text-slate-400 flex-wrap">
        <span className="flex items-center gap-1"><Circle className="w-4 h-4" />{t('checklist.pending')}</span>
        <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-success" />{t('checklist.done')}</span>
        <span className="flex items-center gap-1"><XCircle className="w-4 h-4 text-error" />{t('checklist.failed')}</span>
        <span className="flex items-center gap-1"><MinusCircle className="w-4 h-4" />{t('checklist.na')}</span>
      </div>
    </motion.div>
  );
}
