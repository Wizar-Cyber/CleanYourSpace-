import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Modal } from '@corecon/ui';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateReportModal({ isOpen, onClose }: GenerateReportModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const reportTypes = [
    { value: 'weekly', label: t('reports.types.weekly') },
    { value: 'monthly', label: t('reports.types.monthly') },
    { value: 'services', label: t('reports.types.services') },
    { value: 'cleaner', label: t('reports.types.byCleaner') },
  ];

  const formats = [
    { value: 'pdf', label: t('reports.formats.pdf') },
    { value: 'xlsx', label: t('reports.formats.excel') },
    { value: 'csv', label: t('reports.formats.csv') },
  ];

  const [form, setForm] = useState({
    type: 'weekly',
    format: 'pdf',
    dateFrom: firstOfMonth.toISOString().split('T')[0],
    dateTo: today.toISOString().split('T')[0],
    completedOnly: true,
  });

  const mutation = useMutation({
    mutationFn: () => api.reports.generate(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      addToast(t('reports.created'), 'success');
      onClose();
    },
    onError: () => addToast(t('reports.createFailed'), 'error'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('reports.generateTitle')} size="sm">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('reports.reportType')}</label>
          <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
            {reportTypes.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('reports.format')}</label>
          <select value={form.format} onChange={(e) => setForm((p) => ({ ...p, format: e.target.value }))}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
            {formats.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('reports.dateFrom')}</label>
            <input type="date" value={form.dateFrom} onChange={(e) => setForm((p) => ({ ...p, dateFrom: e.target.value }))}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('reports.dateTo')}</label>
            <input type="date" value={form.dateTo} onChange={(e) => setForm((p) => ({ ...p, dateTo: e.target.value }))}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-display font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-colors">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-navy-dark font-display font-bold text-[11px] shadow-button transition-all disabled:opacity-50">
            {mutation.isPending ? t('common.creating') : t('reports.generate')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
