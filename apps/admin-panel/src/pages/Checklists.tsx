import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, CheckSquare, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../components/Toast';
import { CreateChecklistModal } from '../components/modals/CreateChecklistModal';
import { useTranslation } from 'react-i18next';

export function Checklists() {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => api.checklists.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.checklists.delete?.(id) ?? Promise.reject(new Error('Delete not supported')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      addToast(t('checklists.templateDeleted'), 'success');
    },
    onError: () => addToast(t('checklists.deleteFailed'), 'error'),
  });

  const templates = data?.data ?? data ?? [];

  return (
    <div className="page-container">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="page-title">{t('checklists.title')}</h1>
          <p className="page-subtitle">{t('checklists.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-navy-dark px-5 py-3 rounded-2xl text-[11px] font-display font-bold transition-all shadow-md shadow-gold/20 dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          {t('checklists.createTemplate')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 font-body text-[13px] text-gray-400 animate-pulse">{t('checklists.loading')}</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="font-display font-bold text-[16px] text-slate-800 dark:text-white mb-1">{t('checklists.noTemplates')}</p>
          <p className="font-body text-[11px] text-slate-500 dark:text-slate-400">{t('checklists.noTemplatesSubtitle')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map((template: any, index: number) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col transition-colors duration-200"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                    <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-display font-bold text-[18px] text-navy dark:text-white truncate">{template.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addToast(t('checklists.editComingSoon'), 'info')}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${template.name}"?`)) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                    className="p-2 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {(template.items || []).map((item: any) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-5 h-5 rounded border-2 border-gray-200 dark:border-slate-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-[13px] font-medium text-gray-700 dark:text-slate-300">{item.description || item.label}</p>
                      {item.requiresPhoto && (
                        <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-display font-bold text-[10px] tracking-widest uppercase">
                          <AlertCircle className="w-3 h-3" /> {t('checklists.photoRequired')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                <p className="font-display font-bold text-[11px] text-gray-500 dark:text-slate-400 text-center uppercase tracking-widest">
                  {t('checklists.itemsTotal', { count: template.items?.length || 0 })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <CreateChecklistModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
