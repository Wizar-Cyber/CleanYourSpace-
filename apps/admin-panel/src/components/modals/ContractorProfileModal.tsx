import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Modal } from '@corecon/ui';
import { useToast } from '../Toast';
import { Clock, CheckCircle, Target, FileText, Upload, Trash2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

interface ContractorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export function ContractorProfileModal({ isOpen, onClose, userId, userName }: ContractorProfileModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['contractor-profile', userId],
    queryFn: () => api.users.getContractorProfile(userId),
    enabled: isOpen && !!userId,
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['user-documents', userId],
    queryFn: () => api.documents.listByUser(userId),
    enabled: isOpen && !!userId,
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => api.documents.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents', userId] });
      addToast(t('documents.deleted'), 'success');
    },
    onError: () => addToast(t('documents.deleteFailed'), 'error'),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        addToast(t('documents.onlyImages'), 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast(t('documents.fileTooLarge'), 'error');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('category', 'other');

      await api.documents.upload(formData);

      queryClient.invalidateQueries({ queryKey: ['user-documents', userId] });
      addToast(t('documents.uploaded'), 'success');
    } catch {
      addToast(t('documents.uploadFailed'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const stats = profile?.stats;
  const recentAssignments = profile?.recentAssignments || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-[18px] text-navy dark:text-white">
            {t('users.contractorProfile')}: {userName}
          </h2>
        </div>

        {isLoading ? (
          <div className="py-12 text-center font-body text-[13px] text-gray-400 animate-pulse">{t('common.loading')}</div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-navy-light/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gold-dark dark:text-gold" />
                  <span className="font-display font-bold text-[9px] text-slate-400 uppercase tracking-widest">{t('users.totalHours')}</span>
                </div>
                <span className="font-display font-bold text-[24px] text-navy dark:text-white">{stats?.totalHours || 0}h</span>
              </div>
              <div className="bg-slate-50 dark:bg-navy-light/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-display font-bold text-[9px] text-slate-400 uppercase tracking-widest">{t('users.completedServices')}</span>
                </div>
                <span className="font-display font-bold text-[24px] text-navy dark:text-white">{stats?.completedServices || 0}</span>
              </div>
              <div className="bg-slate-50 dark:bg-navy-light/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="font-display font-bold text-[9px] text-slate-400 uppercase tracking-widest">{t('users.totalServices')}</span>
                </div>
                <span className="font-display font-bold text-[24px] text-navy dark:text-white">{stats?.totalServices || 0}</span>
              </div>
              <div className="bg-slate-50 dark:bg-navy-light/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span className="font-display font-bold text-[9px] text-slate-400 uppercase tracking-widest">{t('users.completionRate')}</span>
                </div>
                <span className="font-display font-bold text-[24px] text-navy dark:text-white">{stats?.completionRate || 0}%</span>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4">{t('users.serviceHistory')}</h3>
              {recentAssignments.length === 0 ? (
                <p className="font-body text-[13px] text-slate-400 text-center py-6">{t('users.noServiceHistory')}</p>
              ) : (
                <div className="space-y-2">
                  {recentAssignments.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-light/30 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="font-display font-bold text-[12px] text-navy dark:text-white">{a.serviceName || t('documents.unknownService')}</span>
                        <span className="block font-body text-[10px] text-slate-400 mt-0.5">
                          {a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString() : '—'}
                          {a.totalMinutes ? ` \u00B7 ${Math.round(a.totalMinutes / 60)}h ${a.totalMinutes % 60}m` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {a.paymentCalculated && (
                          <span className="font-display font-bold text-[11px] text-emerald-600 dark:text-emerald-400">${a.paymentCalculated}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full font-display font-bold text-[8px] uppercase tracking-widest border ${
                          a.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                          a.status === 'in_progress' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' :
                          'bg-slate-50 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20'
                        }`}>{a.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t('users.documents')}</h3>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 text-gold-dark dark:text-gold font-display font-bold text-[9px] uppercase tracking-widest cursor-pointer hover:bg-gold/20 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {t('users.uploadDocument')}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
              </div>

              {docsLoading ? (
                <div className="py-4 text-center font-body text-[11px] text-slate-400 animate-pulse">{t('common.loading')}</div>
              ) : !documents || documents.length === 0 ? (
                <p className="font-body text-[13px] text-slate-400 text-center py-6">{t('users.noDocuments')}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Array.isArray(documents) ? documents : []).map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-light/30 rounded-xl border border-slate-200 dark:border-slate-700 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-gold-dark dark:text-gold shrink-0" />
                        <div className="min-w-0">
                          <span className="block font-display font-bold text-[11px] text-navy dark:text-white truncate">{doc.originalName}</span>
                          <span className="font-body text-[9px] text-slate-400 uppercase">{doc.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-gold-dark dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-navy-light/50 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button onClick={() => deleteDocMutation.mutate(doc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
