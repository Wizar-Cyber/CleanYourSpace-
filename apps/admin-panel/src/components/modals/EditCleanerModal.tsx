import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { X } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { Modal } from '@corecon/ui';

interface EditCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cleaner: any;
}

export function EditCleanerModal({ isOpen, onClose, cleaner }: EditCleanerModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(cleaner?.firstName || '');
  const [lastName, setLastName] = useState(cleaner?.lastName || '');
  const [phone, setPhone] = useState(cleaner?.phone || '');
  const [hourlyRate, setHourlyRate] = useState(cleaner?.hourlyRate?.toString() || '');
  const [isActive, setIsActive] = useState(cleaner?.isActive ?? true);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.users.update(cleaner.id, { firstName, lastName, phone, hourlyRate: parseFloat(hourlyRate) || 0, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
      addToast(t('cleaners.updated'), 'success');
      onClose();
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-[18px] text-navy dark:text-white">{t('cleaners.editTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/50 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t('users.firstName')}</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full mt-1.5 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy text-slate-800 dark:text-white font-body text-[13px] focus:outline-none focus:ring-2 focus:ring-gold/40" />
            </div>
            <div>
              <label className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t('users.lastName')}</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full mt-1.5 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy text-slate-800 dark:text-white font-body text-[13px] focus:outline-none focus:ring-2 focus:ring-gold/40" />
            </div>
          </div>

          <div>
            <label className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t('users.phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-1.5 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy text-slate-800 dark:text-white font-body text-[13px] focus:outline-none focus:ring-2 focus:ring-gold/40" />
          </div>

          <div>
            <label className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t('users.hourlyRate')}</label>
            <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} step="0.01"
              className="w-full mt-1.5 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy text-slate-800 dark:text-white font-body text-[13px] focus:outline-none focus:ring-2 focus:ring-gold/40" />
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="font-display font-bold text-[11px] text-slate-600 dark:text-slate-400">{t('cleaners.accountActive')}</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-display font-bold text-[11px] transition-colors hover:bg-slate-50 dark:hover:bg-navy-light/50">
            {t('common.cancel')}
          </button>
          <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-navy-dark font-display font-bold text-[11px] transition-colors disabled:opacity-50">
            {updateMutation.isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
