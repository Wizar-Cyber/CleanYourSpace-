import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Modal } from '@corecon/ui';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

interface CreateChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChecklistItemInput {
  label: string;
  required: boolean;
}

export function CreateChecklistModal({ isOpen, onClose }: CreateChecklistModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [items, setItems] = useState<ChecklistItemInput[]>([{ label: '', required: false }]);

  const mutation = useMutation({
    mutationFn: () => api.checklists.create({ name, items: items.filter((i) => i.label.trim()) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      addToast(t('checklists.created'), 'success');
      onClose();
      setName('');
      setItems([{ label: '', required: false }]);
    },
    onError: () => addToast(t('checklists.createFailed'), 'error'),
  });

  const addItem = () => setItems((prev) => [...prev, { label: '', required: false }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof ChecklistItemInput, value: string | boolean) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('checklists.createTitle')} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('checklists.templateName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" required />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('checklists.items')}</span>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1 text-[11px] font-display font-bold text-gold-dark dark:text-gold hover:text-gold-dark/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> {t('checklists.addItem')}
            </button>
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={item.label} onChange={(e) => updateItem(i, 'label', e.target.value)}
                  placeholder={t('checklists.itemLabel')}
                  className="flex-1 h-9 px-3 font-body text-[11px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
                <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                  <input type="checkbox" checked={item.required} onChange={(e) => updateItem(i, 'required', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-gold focus:ring-gold/40" />
                  <span className="font-display font-bold text-[8px] uppercase tracking-wider text-slate-400">{t('checklists.photoRequired')}</span>
                </label>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-display font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-colors">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={mutation.isPending || !name.trim() || items.every((i) => !i.label.trim())}
            className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-navy-dark font-display font-bold text-[11px] shadow-button transition-all disabled:opacity-50">
            {mutation.isPending ? t('common.creating') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
