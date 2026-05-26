import { useTranslation } from 'react-i18next';
import { Modal } from '@corecon/ui';

interface AssignmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    client: string;
    type: string;
    cleaner: string;
    status?: string;
    statusCol?: string;
    borderCol?: string;
  } | null;
}

export function AssignmentDetailModal({ isOpen, onClose, assignment }: AssignmentDetailModalProps) {
  const { t } = useTranslation();
  if (!assignment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={assignment.client} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-display font-bold text-[9px] uppercase tracking-widest text-slate-400 mb-1">{t('jobs.serviceType')}</p>
            <p className="font-body text-[13px] text-slate-800 dark:text-white font-medium">{assignment.type}</p>
          </div>
          <div>
            <p className="font-display font-bold text-[9px] uppercase tracking-widest text-slate-400 mb-1">{t('assignments.selectCleaner')}</p>
            <p className="font-body text-[13px] text-slate-800 dark:text-white font-medium">{assignment.cleaner}</p>
          </div>
        </div>
        {assignment.status && (
          <div>
            <p className="font-display font-bold text-[9px] uppercase tracking-widest text-slate-400 mb-1">{t('jobs.status')}</p>
            <span className={`inline-flex font-display font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full ${assignment.statusCol}`}>
              {assignment.status}
            </span>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-display font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-colors">
            {t('common.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
