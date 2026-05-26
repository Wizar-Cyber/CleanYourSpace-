import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  X, MapPin, Search, Plus, MoreHorizontal, AlertTriangle, Clock, RotateCcw,
} from 'lucide-react';
import { Button, StatusBadge } from '@corecon/ui';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import { CreateServiceModal } from '../components/modals/CreateServiceModal';
import { EditServiceModal } from '../components/modals/EditServiceModal';
import { useTranslation } from 'react-i18next';

export function Services() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const STATUS_TABS = [
    { value: '', label: t('jobs.statusTabs.all') },
    { value: 'scheduled', label: t('jobs.scheduled') },
    { value: 'in_progress', label: t('jobs.statusTabs.inProgress') },
    { value: 'needs_review', label: t('jobs.statusTabs.needsReview') },
    { value: 'completed', label: t('jobs.statusTabs.completed') },
    { value: 'cancelled', label: t('jobs.statusTabs.cancelled') },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.services.list(1, 50),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.services.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setSelectedService(null);
      setShowCancelInput(false);
      setCancelReason('');
      addToast(t('jobs.cancelSuccess'), 'success');
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.services.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setSelectedService(null);
      addToast(t('jobs.approveSuccess'), 'success');
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  const returnForFixesMutation = useMutation({
    mutationFn: (id: string) =>
      api.services.updateStatus(id, 'in_progress', 'Returned for fixes'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setSelectedService(null);
      addToast(t('jobs.returnSuccess'), 'success');
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  const services = (data?.data ?? []).filter((s: any) => {
    const matchesSearch = !search || s.clientName?.toLowerCase().includes(search.toLowerCase()) || s.address?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const reviewCount = (data?.data ?? []).filter((s: any) => s.status === 'needs_review').length;

  const formatDate = (d: string) => {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-container">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="page-title">{t('jobs.title')}</h1>
          <p className="page-subtitle">{t('jobs.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('jobs.search')}
            className="w-full h-12 pl-11 pr-4 font-body text-[13px] font-bold border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold shadow-sm transition-all"
          />
        </div>
        <Button variant="primary" size="md" icon={<Plus className="w-5 h-5" />}
          className="!bg-gold hover:!bg-gold-dark !text-navy-dark font-display font-bold text-[11px] rounded-2xl shadow-button !border-0 shrink-0"
          onClick={() => setIsCreateOpen(true)}
        >
          {t('jobs.newJob')}
        </Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 px-4 py-2 rounded-xl font-display font-bold text-[11px] transition-all ${
              statusFilter === tab.value
                ? 'bg-navy dark:bg-white text-white dark:text-navy shadow-sm'
                : tab.value === 'needs_review'
                  ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20'
                  : tab.value === 'cancelled'
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                    : 'bg-slate-50 dark:bg-navy-light/30 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-light/50'
            }`}
          >
            {tab.label}
            {tab.value === 'needs_review' && reviewCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-purple-200 dark:bg-purple-500/30 text-[9px]">
                {reviewCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm p-4 transition-colors duration-200">
        <div className="border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-navy-light/50 font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4 w-[18%]">{t('jobs.client')}</th>
                <th className="px-6 py-4 w-[15%]">{t('jobs.serviceType')}</th>
                <th className="px-6 py-4 w-[12%]">{t('jobs.status')}</th>
                <th className="px-6 py-4 w-[15%]">{t('jobs.staff')}</th>
                <th className="px-6 py-4 w-[15%]">{t('jobs.scheduled')}</th>
                <th className="px-6 py-4 w-[15%]">{t('jobs.estDuration')}</th>
                <th className="px-6 py-4 w-16 text-center">{t('jobs.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-body text-[13px] text-gray-400">
                    <div className="animate-pulse">{t('jobs.loading')}</div>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-body text-[13px] text-gray-400">
                    {t('jobs.noJobs')}
                  </td>
                </tr>
              ) : (
                services.map((service: any, index: number) => (
                  <tr
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-light/30 transition-colors ${
                      index % 2 === 0 ? 'bg-white dark:bg-navy' : 'bg-gray-50 dark:bg-navy-light/20'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {service.status === 'needs_review' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        )}
                        {service.status === 'in_progress' && (
                          <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                        )}
                        <span className="font-display font-bold text-[13px] text-navy dark:text-slate-200">{service.clientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-display font-bold text-[13px] text-gray-500 dark:text-slate-400 capitalize">
                      {service.serviceType?.replace(/_/g, ' ')}
                      {service.recurrenceRule && (
                        <span className="ml-2 text-[9px] text-gold-dark dark:text-gold uppercase tracking-wider">
                          {service.recurrenceRule}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={service.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {service.assignedStaff?.length > 0 ? service.assignedStaff.slice(0, 3).map((a: any, i: number) => (
                          <div
                            key={a.id || i}
                            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 border-2 border-white dark:border-navy flex items-center justify-center font-display font-bold text-[10px] text-gray-600 dark:text-slate-300 shadow-sm"
                            title={a.cleanerName || ''}
                          >
                            {a.cleanerName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                          </div>
                        )) : (
                          <span className="font-body text-[11px] text-slate-400">\u2014</span>
                        )}
                        {(service.assignedStaff?.length || 0) > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gold/20 border-2 border-white dark:border-navy flex items-center justify-center font-display font-bold text-[10px] text-gold-dark">
                            +{service.assignedStaff.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-display font-bold text-[13px] text-gray-500 dark:text-slate-400">
                          {formatDate(service.scheduledAt)}
                        </span>
                        <span className="font-body text-[10px] text-slate-400 dark:text-slate-500">
                          {formatTime(service.scheduledAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-display font-bold text-[13px] text-gray-500 dark:text-slate-400">
                      {service.estimatedMinutes ? `${service.estimatedMinutes} ${t('common.min')}` : '\u2014'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedService(service); }}
                        className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedService(null); setShowCancelInput(false); setCancelReason(''); }}
              className="absolute inset-0 bg-navy-dark/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="relative w-full max-w-2xl bg-white dark:bg-navy rounded-[32px] shadow-xl border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedService.status} />
                      {selectedService.recurrenceRule && (
                        <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold-dark text-[9px] font-display font-bold uppercase tracking-wider">
                          {selectedService.recurrenceRule}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-display font-bold tracking-tight text-navy dark:text-white mt-3">{selectedService.clientName}</h2>
                    <p className="font-display font-bold text-[13px] text-gray-500 dark:text-slate-400 mt-1 capitalize">
                      {selectedService.serviceType?.replace(/_/g, ' ')}
                      {selectedService.customServiceType && ` (${selectedService.customServiceType})`}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedService(null); setShowCancelInput(false); setCancelReason(''); }}
                    className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-navy-light/30 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <MapPin className="w-5 h-5 text-gold-dark dark:text-gold shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-display font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('jobs.detail.addressAccess')}</h4>
                      <p className="font-display font-bold text-[13px] text-navy dark:text-slate-200">
                        {selectedService.address || t('jobs.detail.addressNotProvided')}
                      </p>
                      {selectedService.accessInstructions && (
                        <p className="font-body text-[12px] text-slate-500 dark:text-slate-400 mt-1 italic">
                          {t('jobs.detail.access')} {selectedService.accessInstructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-gray-50 dark:bg-navy-light/30 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <h4 className="font-display font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('jobs.detail.clientContact')}</h4>
                      <p className="font-display font-bold text-[13px] text-navy dark:text-slate-200">
                        {selectedService.clientPhone || t('jobs.detail.noPhone')}
                      </p>
                      {selectedService.clientEmail && (
                        <p className="font-body text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{selectedService.clientEmail}</p>
                      )}
                    </div>
                    <div className="p-5 bg-gray-50 dark:bg-navy-light/30 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <h4 className="font-display font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('jobs.detail.schedule')}</h4>
                      <p className="font-display font-bold text-[13px] text-navy dark:text-slate-200">
                        {formatDate(selectedService.scheduledAt)}
                      </p>
                      <p className="font-body text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatTime(selectedService.scheduledAt)} \u00B7 {selectedService.estimatedMinutes} {t('common.min')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-gray-50 dark:bg-navy-light/30 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <h4 className="font-display font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('jobs.detail.assignedStaff')}</h4>
                      {selectedService.assignedStaff?.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedService.assignedStaff.map((a: any) => (
                            <div key={a.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center font-display font-bold text-[8px] text-gold-dark">
                                {a.cleanerName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                              </div>
                              <span className="font-display font-bold text-[12px] text-navy dark:text-slate-300">
                                {a.cleanerName || 'Unknown'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="font-body text-[12px] text-slate-400">{t('jobs.detail.unassigned')}</p>
                      )}
                    </div>
                    <div className="p-5 bg-gray-50 dark:bg-navy-light/30 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <h4 className="font-display font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('jobs.detail.checklist')}</h4>
                      {selectedService.checklistTemplateId ? (
                        <p className="font-display font-bold text-[12px] text-navy dark:text-slate-300">{t('jobs.detail.templateAssigned')}</p>
                      ) : (
                        <p className="font-body text-[12px] text-slate-400">{t('jobs.detail.noChecklistTemplate')}</p>
                      )}
                      {selectedService.hasIncidents && (
                        <div className="mt-2 flex items-center gap-1.5 text-rose-500">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-display font-bold text-[10px]">{t('jobs.detail.incidentsReported')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedService.specialInstructions && (
                    <div className="p-5 bg-gray-50 dark:bg-navy-light/30 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <h4 className="font-display font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('jobs.detail.specialInstructions')}</h4>
                      <p className="font-body text-[13px] font-medium text-gray-700 dark:text-slate-300 leading-relaxed">
                        {selectedService.specialInstructions}
                      </p>
                    </div>
                  )}

                  {selectedService.status === 'cancelled' && selectedService.cancellationReason && (
                    <div className="flex items-start gap-4 p-5 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-500/20">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-display font-bold text-[10px] text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">{t('jobs.detail.cancellationReason')}</h4>
                        <p className="font-body text-[13px] font-medium text-rose-700 dark:text-rose-300 leading-relaxed">
                          {selectedService.cancellationReason}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedService.status === 'needs_review' && selectedService.needsReviewReason && (
                    <div className="flex items-start gap-4 p-5 bg-purple-50 dark:bg-purple-500/10 rounded-2xl border border-purple-200 dark:border-purple-500/20">
                      <AlertTriangle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-display font-bold text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">{t('jobs.detail.reviewReason')}</h4>
                        <p className="font-body text-[13px] font-medium text-purple-700 dark:text-purple-300 leading-relaxed">
                          {selectedService.needsReviewReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
                  {['scheduled', 'in_progress', 'needs_review'].includes(selectedService.status) && (
                    <button
                      onClick={() => setIsEditOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-display font-bold text-[12px] rounded-xl transition-colors"
                    >
                      {t('jobs.actions.edit')}
                    </button>
                  )}
                  {['scheduled', 'in_progress'].includes(selectedService.status) && (
                    showCancelInput ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder={t('jobs.actions.reasonPlaceholder')}
                          className="w-72 h-20 p-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 transition-all resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setShowCancelInput(false); setCancelReason(''); }}
                            className="px-3 py-1.5 text-[11px] font-display font-bold text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {t('common.back')}
                          </button>
                          <button
                            onClick={() => cancelReason.trim() && cancelMutation.mutate({ id: selectedService.id, reason: cancelReason.trim() })}
                            disabled={cancelMutation.isPending || !cancelReason.trim()}
                            className="px-4 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-display font-bold text-[11px] rounded-xl transition-colors disabled:opacity-50"
                          >
                            {cancelMutation.isPending ? t('jobs.actions.cancelling') : t('jobs.actions.confirmCancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCancelInput(true)}
                        className="flex items-center gap-2 px-4 py-2 text-red-500 hover:text-red-600 font-display font-bold text-[11px] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        {t('jobs.actions.cancelJob')}
                      </button>
                    )
                  )}
                  {selectedService.status === 'needs_review' && (
                    <>
                      <button
                        onClick={() => returnForFixesMutation.mutate(selectedService.id)}
                        disabled={returnForFixesMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 font-display font-bold text-[12px] rounded-xl transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {t('jobs.actions.returnForFixes')}
                      </button>
                      <button
                        onClick={() => approveMutation.mutate(selectedService.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-display font-bold text-[12px] rounded-xl transition-colors disabled:opacity-50"
                      >
                        {t('jobs.actions.approveComplete')}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSelectedService(null); setShowCancelInput(false); setCancelReason(''); }}
                    className="px-5 py-2.5 bg-navy dark:bg-white text-white dark:text-navy hover:bg-navy-light dark:hover:bg-slate-100 font-display font-bold text-[12px] rounded-xl transition-colors"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateServiceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      {selectedService && (
        <EditServiceModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          service={selectedService}
        />
      )}
    </div>
  );
}
