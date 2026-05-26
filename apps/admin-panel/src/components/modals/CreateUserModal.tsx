import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Modal } from '@corecon/ui';
import { KeyRound } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [tempPassword] = useState(generateTempPassword);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: 'contractor', hourlyRate: '25', language: 'en',
    contractType: 'contractor_1099', isActive: true,
  });

  const mutation = useMutation({
    mutationFn: () => api.users.create({
      ...form,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
      password: tempPassword,
      contractType: form.contractType || null,
      isActive: form.isActive,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
      addToast(t('users.created'), 'success');
      onClose();
      setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'contractor', hourlyRate: '25', language: 'en', contractType: 'contractor_1099', isActive: true });
    },
    onError: () => addToast(t('users.createFailed'), 'error'),
  });

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    addToast(t('users.passwordCopied'), 'info');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('users.createTitle')} size="md">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('users.firstName')}</label>
            <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('users.lastName')}</label>
            <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('users.email')}</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('users.phone')}</label>
          <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('users.role')}</label>
            <select value={form.role} onChange={(e) => update('role', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
              <option value="super_admin">{t('users.roles.super_admin')}</option>
              <option value="manager">{t('users.roles.manager')}</option>
              <option value="supervisor">{t('users.roles.supervisor')}</option>
              <option value="contractor">{t('users.roles.contractor')}</option>
              <option value="client">{t('users.roles.client')}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('users.contractType')}</label>
            <select value={form.contractType} onChange={(e) => update('contractType', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
              <option value="contractor_1099">{t('users.contractType1099')}</option>
              <option value="w2">{t('users.contractTypeW2')}</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('users.hourlyRate')}</label>
            <input type="number" min="0" step="0.5" value={form.hourlyRate} onChange={(e) => update('hourlyRate', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('users.language')}</label>
            <select value={form.language} onChange={(e) => update('language', e.target.value)}
              className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
              <option value="en">{t('users.languages.en')}</option>
              <option value="es">{t('users.languages.es')}</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="font-display font-bold text-[11px] text-slate-600 dark:text-slate-400">{t('users.isActive')}</span>
          <button type="button" onClick={() => update('isActive', !form.isActive)}
            className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('users.password')}</label>
          <div className="flex items-center gap-2">
            <input readOnly value={tempPassword}
              className="flex-1 h-10 px-3 font-mono text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-navy-dark text-slate-800 dark:text-white select-all" />
            <button type="button" onClick={copyPassword}
              className="shrink-0 p-2.5 rounded-xl bg-gold/10 text-gold-dark dark:text-gold hover:bg-gold/20 transition-colors" title={t('users.copyPassword')}>
              <KeyRound className="w-4 h-4" />
            </button>
          </div>
          <p className="font-body text-[9px] text-slate-400 mt-1">{t('users.passwordInfo')}</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-display font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-colors">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-navy-dark font-display font-bold text-[11px] shadow-button transition-all disabled:opacity-50">
            {mutation.isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
