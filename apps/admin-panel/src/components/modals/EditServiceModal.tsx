import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Modal } from '@corecon/ui';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
}

export function EditServiceModal({ isOpen, onClose, service }: EditServiceModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

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

  const scheduledDate = service?.scheduledAt ? service.scheduledAt.slice(0, 16) : '';

  const [form, setForm] = useState({
    clientName: service?.clientName || '',
    clientEmail: service?.clientEmail || '',
    clientPhone: service?.clientPhone || '',
    address: service?.address || '',
    accessInstructions: service?.accessInstructions || '',
    serviceType: service?.serviceType || 'residential_standard',
    customServiceType: service?.customServiceType || '',
    scheduledAt: scheduledDate,
    estimatedMinutes: String(service?.estimatedMinutes || 60),
    specialInstructions: service?.specialInstructions || '',
    checklistTemplateId: service?.checklistTemplateId || '',
    recurrenceRule: service?.recurrenceRule || '',
    recurrenceEndDate: service?.recurrenceEndDate ? service.recurrenceEndDate.slice(0, 10) : '',
  });
  const [selectedCleaners, setSelectedCleaners] = useState<string[]>(
    service?.assignedStaffIds || service?.assignedStaff?.map((a: any) => a.cleanerId) || [],
  );

  const { data: cleanersData } = useQuery({
    queryKey: ['cleaners-list'],
    queryFn: () => api.users.cleaners(),
    enabled: isOpen,
  });
  const cleaners = cleanersData?.data ?? [];

  const isCompleted = service?.status === 'completed';
  const isInProgress = service?.status === 'in_progress';
  const isScheduled = service?.status === 'scheduled';
  const canEdit = isScheduled || isInProgress || service?.status === 'needs_review';

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (form.clientName !== service.clientName) payload.clientName = form.clientName;
      if (form.clientEmail !== service.clientEmail) payload.clientEmail = form.clientEmail || null;
      if (form.clientPhone !== service.clientPhone) payload.clientPhone = form.clientPhone || null;
      if (form.address !== service.address) payload.address = form.address;
      if (form.accessInstructions !== service.accessInstructions) payload.accessInstructions = form.accessInstructions || null;
      if (form.serviceType !== service.serviceType) payload.serviceType = form.serviceType;
      if (form.customServiceType !== service.customServiceType) payload.customServiceType = form.customServiceType || null;
      if (form.scheduledAt !== scheduledDate) payload.scheduledAt = new Date(form.scheduledAt).toISOString();
      if (form.estimatedMinutes !== String(service.estimatedMinutes)) payload.estimatedMinutes = parseInt(form.estimatedMinutes, 10);
      if (form.specialInstructions !== service.specialInstructions) payload.specialInstructions = form.specialInstructions || null;
      if (form.checklistTemplateId !== service.checklistTemplateId) payload.checklistTemplateId = form.checklistTemplateId || null;
      if (form.recurrenceRule !== (service.recurrenceRule || '')) payload.recurrenceRule = form.recurrenceRule || null;
      if (form.recurrenceEndDate !== (service.recurrenceEndDate?.slice(0, 10) || '')) {
        payload.recurrenceEndDate = form.recurrenceEndDate ? new Date(form.recurrenceEndDate).toISOString() : null;
      }

      const currentStaffIds = service?.assignedStaffIds || service?.assignedStaff?.map((a: any) => a.cleanerId) || [];
      const staffChanged = JSON.stringify([...currentStaffIds].sort()) !== JSON.stringify([...selectedCleaners].sort());
      if (staffChanged) payload.assignedStaffIds = selectedCleaners;

      return api.services.update(service.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['services-summary'] });
      addToast(t('jobs.edit.success'), 'success');
      onClose();
    },
    onError: (err: Error) => addToast(err.message || t('jobs.edit.error'), 'error'),
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCleaner = (id: string) => {
    setSelectedCleaners((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const isRecurring = form.recurrenceRule !== '';

  if (!canEdit && !isCompleted) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('jobs.edit.title')} size="xl">
        <div className="py-8 text-center">
          <p className="font-body text-[13px] text-slate-500">{t('jobs.edit.cannotEdit')}</p>
          <button onClick={onClose} className="mt-4 px-5 py-2.5 bg-navy text-white font-display font-bold text-[11px] rounded-xl">
            {t('common.close')}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isCompleted ? t('jobs.edit.viewTitle') : t('jobs.edit.title')} size="xl">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.clientName')}</label>
            <input value={form.clientName} onChange={(e) => update('clientName', e.target.value)}
              disabled={!canEdit || isCompleted}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50" required />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.serviceType')}</label>
            <select value={form.serviceType} onChange={(e) => update('serviceType', e.target.value)}
              disabled={!canEdit || isCompleted}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50">
              {serviceTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.clientEmail')}</label>
            <input type="email" value={form.clientEmail} onChange={(e) => update('clientEmail', e.target.value)}
              disabled={!canEdit}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50" />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.clientPhone')}</label>
            <input value={form.clientPhone} onChange={(e) => update('clientPhone', e.target.value)}
              disabled={!canEdit}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.address')}</label>
          <input value={form.address} onChange={(e) => update('address', e.target.value)}
            disabled={!canEdit || isCompleted}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50" required />
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.accessInstructions')}</label>
          <input value={form.accessInstructions} onChange={(e) => update('accessInstructions', e.target.value)}
            disabled={!canEdit}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.scheduledDate')}</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => update('scheduledAt', e.target.value)}
              disabled={!canEdit || isCompleted}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50" />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.estDuration')}</label>
            <input type="number" min="15" step="15" value={form.estimatedMinutes} onChange={(e) => update('estimatedMinutes', e.target.value)}
              disabled={!canEdit || isCompleted}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.recurrence')}</label>
            <select value={form.recurrenceRule} onChange={(e) => update('recurrenceRule', e.target.value)}
              disabled={!canEdit}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50">
              {recurrenceOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          {isRecurring && (
            <div className="space-y-1.5">
              <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.recurrenceEndDate')}</label>
              <input type="date" value={form.recurrenceEndDate} onChange={(e) => update('recurrenceEndDate', e.target.value)}
                disabled={!canEdit}
                className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all disabled:opacity-50" />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.assignedStaff', { count: selectedCleaners.length })}</label>
          <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1">
            {cleaners.filter((c: any) => c.isActive !== false).length === 0 && (
              <p className="font-body text-[11px] text-slate-400 py-2 text-center">{t('jobs.create.noCleaners')}</p>
            )}
            {cleaners.filter((c: any) => c.isActive !== false).map((c: any) => (
              <label key={c.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${canEdit ? 'hover:bg-slate-50 dark:hover:bg-navy-light/30' : ''}`}>
                <input type="checkbox" checked={selectedCleaners.includes(c.id)}
                  onChange={() => canEdit && toggleCleaner(c.id)}
                  disabled={!canEdit}
                  className="w-4 h-4 rounded border-slate-300 text-gold focus:ring-gold/40 disabled:opacity-50" />
                <span className="font-body text-[12px] text-slate-700 dark:text-slate-300">{c.firstName} {c.lastName}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('jobs.create.specialInstructions')}</label>
          <textarea value={form.specialInstructions} onChange={(e) => update('specialInstructions', e.target.value)} rows={3}
            disabled={!canEdit}
            className="w-full px-3 py-2 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all resize-none disabled:opacity-50" />
        </div>
        <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white dark:bg-navy-dark py-3 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-display font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-colors">
            {t('common.cancel')}
          </button>
          {canEdit && (
            <button type="submit" disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-navy-dark font-display font-bold text-[11px] shadow-button transition-all disabled:opacity-50">
              {mutation.isPending ? t('common.saving') : t('jobs.edit.save')}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
