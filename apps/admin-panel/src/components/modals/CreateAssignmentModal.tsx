import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Modal } from '@corecon/ui';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAssignmentModal({ isOpen, onClose }: CreateAssignmentModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    serviceId: '',
    cleanerId: '',
    scheduledDate: today,
    scheduledStartTime: '09:00',
    scheduledEndTime: '12:00',
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const res = await api.services.list(); return res.data || res; },
    enabled: isOpen,
  });
  const { data: cleanersData } = useQuery({
    queryKey: ['cleaners'],
    queryFn: async () => { const res = await api.users.list(); return res.data || res; },
    enabled: isOpen,
  });

  const services = Array.isArray(servicesData) ? servicesData : [];
  const cleaners = Array.isArray(cleanersData) ? cleanersData.filter((c: any) => c.role === 'cleaner') : [];

  const mutation = useMutation({
    mutationFn: () => api.assignments.create({ ...form, scheduledDate: form.scheduledDate, scheduledStartTime: form.scheduledStartTime, scheduledEndTime: form.scheduledEndTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments-summary'] });
      addToast(t('assignments.created'), 'success');
      onClose();
    },
    onError: () => addToast(t('assignments.createFailed'), 'error'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('assignments.createTitle')} size="md">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('assignments.selectService')}</label>
          <select value={form.serviceId} onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required>
            <option value="">{t('assignments.selectServicePlaceholder')}</option>
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>{s.clientName} — {s.address?.split(',')[0]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('assignments.selectCleaner')}</label>
          <select value={form.cleanerId} onChange={(e) => setForm((p) => ({ ...p, cleanerId: e.target.value }))}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
            <option value="">{t('assignments.unassigned')}</option>
            {cleaners.map((c: any) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('assignments.date')}</label>
          <input type="date" value={form.scheduledDate} onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('assignments.startTime')}</label>
            <input type="time" value={form.scheduledStartTime} onChange={(e) => setForm((p) => ({ ...p, scheduledStartTime: e.target.value }))}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('assignments.endTime')}</label>
            <input type="time" value={form.scheduledEndTime} onChange={(e) => setForm((p) => ({ ...p, scheduledEndTime: e.target.value }))}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-display font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-colors">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={mutation.isPending || !form.serviceId}
            className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-navy-dark font-display font-bold text-[11px] shadow-button transition-all disabled:opacity-50">
            {mutation.isPending ? t('common.creating') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
