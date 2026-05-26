import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Modal } from '@corecon/ui';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateServiceModal({ isOpen, onClose }: CreateServiceModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const serviceTypeOptions = [
    { value: 'residential_standard', label: t('jobs.serviceTypes.residential_standard') },
    { value: 'commercial_janitorial', label: t('jobs.serviceTypes.commercial_janitorial') },
    { value: 'deep_cleaning', label: t('jobs.serviceTypes.deep_cleaning') },
    { value: 'move_in', label: t('jobs.serviceTypes.move_in') },
    { value: 'move_out', label: t('jobs.serviceTypes.move_out') },
    { value: 'recurring', label: t('jobs.serviceTypes.recurring') },
    { value: 'one_time', label: t('jobs.serviceTypes.one_time') },
  ];

  const recurrenceOptions = [
    { value: '', label: t('jobs.recurrence.none') },
    { value: 'daily', label: t('jobs.recurrence.daily') },
    { value: 'weekly', label: t('jobs.recurrence.weekly') },
    { value: 'biweekly', label: t('jobs.recurrence.biweekly') },
    { value: 'monthly', label: t('jobs.recurrence.monthly') },
  ];

  const [form, setForm] = useState({
    clientName: '', clientEmail: '', clientPhone: '',
    address: '', latitude: '', longitude: '', accessInstructions: '',
    serviceType: 'residential_standard', customServiceType: '',
    scheduledAt: `${today}T09:00`,
    estimatedMinutes: '60',
    specialInstructions: '',
    checklistTemplateId: '',
    recurrenceRule: '',
    recurrenceEndDate: '',
  });
  const [selectedCleaners, setSelectedCleaners] = useState<string[]>([]);

  const { data: cleanersData } = useQuery({
    queryKey: ['cleaners-list'],
    queryFn: () => api.users.cleaners(),
    enabled: isOpen,
  });
  const cleaners = cleanersData?.data ?? [];

  const { data: templatesData } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: () => api.checklists.list(),
    enabled: isOpen,
  });
  const templates = templatesData?.data ?? [];

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        clientName: form.clientName,
        clientEmail: form.clientEmail || null,
        clientPhone: form.clientPhone || null,
        address: form.address,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        accessInstructions: form.accessInstructions || null,
        serviceType: form.serviceType,
        customServiceType: form.customServiceType || null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        estimatedMinutes: parseInt(form.estimatedMinutes, 10),
        specialInstructions: form.specialInstructions || null,
        checklistTemplateId: form.checklistTemplateId || null,
        assignedStaffIds: selectedCleaners.length > 0 ? selectedCleaners : undefined,
        recurrenceRule: form.recurrenceRule || null,
        recurrenceEndDate: form.recurrenceEndDate ? new Date(form.recurrenceEndDate).toISOString() : null,
      };

      return api.services.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['services-summary'] });
      addToast(t('jobs.create.success'), 'success');
      onClose();
      resetForm();
    },
    onError: (err: Error) => addToast(err.message || t('jobs.create.error'), 'error'),
  });

  const resetForm = () => {
    setForm({
      clientName: '', clientEmail: '', clientPhone: '', address: '',
      latitude: '', longitude: '', accessInstructions: '',
      serviceType: 'residential_standard', customServiceType: '',
      scheduledAt: `${today}T09:00`, estimatedMinutes: '60',
      specialInstructions: '', checklistTemplateId: '',
      recurrenceRule: '', recurrenceEndDate: '',
    });
    setSelectedCleaners([]);
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCleaner = (id: string) => {
    setSelectedCleaners((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const isRecurring = form.recurrenceRule !== '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('jobs.create.title')} size="xl">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.clientName')}</label>
            <input value={form.clientName} onChange={(e) => update('clientName', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.serviceType')}</label>
            <select value={form.serviceType} onChange={(e) => update('serviceType', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
              {serviceTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.clientEmail')}</label>
            <input type="email" value={form.clientEmail} onChange={(e) => update('clientEmail', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.clientPhone')}</label>
            <input value={form.clientPhone} onChange={(e) => update('clientPhone', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.address')}</label>
          <input value={form.address} onChange={(e) => update('address', e.target.value)}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.latitude')}</label>
            <input type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.longitude')}</label>
            <input type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.accessInstructions')}</label>
          <input value={form.accessInstructions} onChange={(e) => update('accessInstructions', e.target.value)}
            placeholder={t('jobs.create.accessPlaceholder')}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.scheduledDate')}</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => update('scheduledAt', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.estDuration')}</label>
            <input type="number" min="15" step="15" value={form.estimatedMinutes} onChange={(e) => update('estimatedMinutes', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.recurrence')}</label>
            <select value={form.recurrenceRule} onChange={(e) => update('recurrenceRule', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
              {recurrenceOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          {isRecurring && (
            <div className="space-y-1.5">
              <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.recurrenceEndDate')}</label>
              <input type="date" value={form.recurrenceEndDate} onChange={(e) => update('recurrenceEndDate', e.target.value)}
                className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required={isRecurring} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.checklistTemplate')}</label>
            <select value={form.checklistTemplateId} onChange={(e) => update('checklistTemplateId', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
              <option value="">{t('jobs.create.noTemplate')}</option>
              {templates.map((tpl: any) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.customServiceType')}</label>
            <input value={form.customServiceType} onChange={(e) => update('customServiceType', e.target.value)}
              placeholder={t('jobs.create.customTypePlaceholder')}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.assignedStaff', { count: selectedCleaners.length })}</label>
          <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1">
            {cleaners.filter((c: any) => c.isActive !== false).length === 0 && (
              <p className="font-body text-[11px] text-slate-400 py-2 text-center">{t('jobs.create.noCleaners')}</p>
            )}
            {cleaners.filter((c: any) => c.isActive !== false).map((c: any) => (
              <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-light/30 cursor-pointer transition-colors">
                <input type="checkbox" checked={selectedCleaners.includes(c.id)}
                  onChange={() => toggleCleaner(c.id)}
                  className="w-4 h-4 rounded border-slate-300 text-gold focus:ring-gold/40" />
                <span className="font-body text-[12px] text-slate-700 dark:text-slate-300">{c.firstName} {c.lastName}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.specialInstructions')}</label>
          <textarea value={form.specialInstructions} onChange={(e) => update('specialInstructions', e.target.value)} rows={3}
            placeholder={t('jobs.create.instructionsPlaceholder')}
            className="w-full px-3 py-2 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all resize-none" />
        </div>
        <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white dark:bg-navy-dark py-3 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-display font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-colors">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-navy-dark font-display font-bold text-[11px] shadow-button transition-all disabled:opacity-50">
            {mutation.isPending ? t('common.creating') : t('jobs.create.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
