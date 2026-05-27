import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Mail, DollarSign, Clock, User, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../components/Toast';
import { useState } from 'react';
import { CreateCleanerModal } from '../components/modals/CreateCleanerModal';
import { EditCleanerModal } from '../components/modals/EditCleanerModal';
import { useTranslation } from 'react-i18next';

export function Cleaners() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editCleaner, setEditCleaner] = useState<any>(null);
  const [detailCleaner, setDetailCleaner] = useState<any>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cleaners'],
    queryFn: () => api.users.list(1, 50),
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { id: string; isActive: boolean }) =>
      api.users.update(data.id, { isActive: data.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  const cleaners = (data?.data ?? []).filter((u: any) => u.role === 'cleaner').filter((c: any) =>
    !search || c.firstName?.toLowerCase().includes(search.toLowerCase()) || c.lastName?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="page-title">{t('cleaners.subtitle')}</h1>
          <p className="page-subtitle">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-navy-dark px-5 py-3 rounded-2xl text-[11px] font-display font-bold transition-all shadow-md shadow-gold/20 dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          {t('cleaners.inviteMember')}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('cleaners.search')}
            className="w-full h-11 pl-11 pr-4 font-body text-[13px] font-bold border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center font-body text-[13px] text-gray-400">
            <div className="animate-pulse">{t('cleaners.loading')}</div>
          </div>
        ) : cleaners.length === 0 ? (
          <div className="col-span-full py-12 text-center font-body text-[13px] text-gray-400">
            {t('cleaners.noCleaners')}
          </div>
        ) : (
          cleaners.map((cleaner: any, index: number) => (
            <motion.div
              key={cleaner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col transition-colors duration-200"
            >
              <div className="flex justify-between items-start mb-6">
                <button onClick={() => setDetailCleaner(cleaner)} className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gold/10 text-gold-dark dark:text-gold border border-gold/10 dark:border-gold/20 flex items-center justify-center text-xl font-display font-black tracking-tight shrink-0">
                    {cleaner.firstName?.[0]}{cleaner.lastName?.[0]}
                  </div>
                </button>
                <button
                  onClick={() => setEditCleaner(cleaner)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title={t('cleaners.editCleaner')}
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>

              {detailCleaner?.id === cleaner.id && (
                <div className="mb-4 p-4 bg-slate-50 dark:bg-navy-light/30 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gold-dark dark:text-gold" />
                    <span className="font-display font-bold text-[11px] text-slate-600 dark:text-slate-400">{t('cleaners.quickStats')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-body">
                    <span className="text-slate-500 dark:text-slate-400">{t('users.email')}</span>
                    <span className="text-slate-800 dark:text-slate-200 text-right truncate">{cleaner.email}</span>
                    <span className="text-slate-500 dark:text-slate-400">{t('cleaners.rate')}</span>
                    <span className="text-slate-800 dark:text-slate-200 text-right">${cleaner.hourlyRate || 0}/hr</span>
                    <span className="text-slate-500 dark:text-slate-400">{t('cleaners.hours')}</span>
                    <span className="text-slate-800 dark:text-slate-200 text-right">{cleaner.totalHours || 0}h</span>
                    <span className="text-slate-500 dark:text-slate-400">{t('cleaners.salary')}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">
                      ${((cleaner.hourlyRate || 0) * (cleaner.totalHours || 0)).toFixed(2)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">{t('users.phone')}</span>
                    <span className="text-slate-800 dark:text-slate-200 text-right">{cleaner.phone || '\u2014'}</span>
                  </div>
                  <button onClick={() => setDetailCleaner(null)} className="mt-2 text-[9px] font-display font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">{t('users.hide')}</button>
                </div>
              )}

              <div className="mb-6 flex-1">
                <div
                  onClick={() => setDetailCleaner(detailCleaner?.id === cleaner.id ? null : cleaner)}
                  className="cursor-pointer"
                >
                  <h3 className="font-display font-bold text-[18px] text-navy dark:text-white truncate">{cleaner.firstName} {cleaner.lastName}</h3>
                  <p className="font-body text-[11px] text-gray-500 dark:text-slate-400 mt-1 capitalize">{cleaner.role}</p>
                </div>

                <div className="flex flex-col gap-2 mt-4 font-display font-bold text-[11px] text-gray-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{cleaner.email}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3 mt-1">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> {cleaner.hourlyRate || '\u2014'}/hr
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gold-dark dark:text-gold" /> {cleaner.totalHours || 0} hrs
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-slate-800">
                <span className={`px-3 py-1 border rounded-full font-display font-bold text-[10px] uppercase tracking-widest bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20`}>
                  {cleaner.role}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`font-display font-bold text-[10px] uppercase tracking-widest ${cleaner.isActive ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {cleaner.isActive ? t('cleaners.statusActive') : t('cleaners.statusInactive')}
                  </span>
                  <button
                    role="switch"
                    aria-checked={cleaner.isActive}
                    aria-label={`${cleaner.isActive ? 'Deactivate' : 'Activate'} cleaner ${cleaner.firstName} ${cleaner.lastName}`}
                    onClick={() => {
                      if (cleaner.isActive) {
                        addToast(t('cleaners.cannotDisable', { name: cleaner.firstName }), 'info');
                      }
                      toggleMutation.mutate({ id: cleaner.id, isActive: !cleaner.isActive });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out ${cleaner.isActive ? 'bg-navy dark:bg-gold' : 'bg-gray-200 dark:bg-slate-700'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${cleaner.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <CreateCleanerModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      {editCleaner && (
        <EditCleanerModal isOpen={!!editCleaner} onClose={() => setEditCleaner(null)} cleaner={editCleaner} />
      )}
    </div>
  );
}
