import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { StatusBadge } from '@corecon/ui';
import {
  Filter, ChevronLeft, ChevronRight, Clock, MapPin, AlertTriangle, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function ServiceHistory() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    clientName: '',
    serviceType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    contractorId: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const queryParams: any = { page, limit: 20 };
  if (filters.clientName) queryParams.clientName = filters.clientName;
  if (filters.serviceType) queryParams.serviceType = filters.serviceType;
  if (filters.status) queryParams.status = filters.status;
  if (filters.dateFrom) queryParams.dateFrom = new Date(filters.dateFrom).toISOString();
  if (filters.dateTo) queryParams.dateTo = new Date(filters.dateTo).toISOString();
  if (filters.contractorId) queryParams.contractorId = filters.contractorId;

  const { data, isLoading } = useQuery({
    queryKey: ['service-history', queryParams],
    queryFn: () => api.services.history(queryParams),
  });

  const { data: contractorsData } = useQuery({
    queryKey: ['cleaners-list'],
    queryFn: () => api.users.cleaners(),
  });

  const history = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };
  const contractors = contractorsData?.data ?? [];

  const clearFilters = () => {
    setFilters({ clientName: '', serviceType: '', status: '', dateFrom: '', dateTo: '', contractorId: '' });
    setPage(1);
  };

  const formatDate = (d: string) => {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const hasFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="page-container">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="page-title">{t('history.title')}</h1>
          <p className="page-subtitle">{t('history.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-bold text-[11px] transition-colors ${
            showFilters || hasFilters
              ? 'bg-gold/10 text-gold-dark dark:bg-gold/15 dark:text-gold'
              : 'bg-slate-50 dark:bg-navy-light/30 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-light/50'
          }`}
        >
          <Filter className="w-4 h-4" />
          {t('history.filters')}
          {hasFilters && <span className="w-2 h-2 rounded-full bg-gold" />}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('history.clientName')}</label>
                  <input value={filters.clientName} onChange={(e) => { setFilters((f) => ({ ...f, clientName: e.target.value })); setPage(1); }}
                    placeholder={t('history.searchClient')}
                    className="w-full h-9 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('history.serviceType')}</label>
                  <select value={filters.serviceType} onChange={(e) => { setFilters((f) => ({ ...f, serviceType: e.target.value })); setPage(1); }}
                    className="w-full h-9 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
                    <option value="">{t('history.allTypes')}</option>
                    <option value="residential_standard">{t('history.types.residential_standard')}</option>
                    <option value="commercial_janitorial">{t('history.types.commercial_janitorial')}</option>
                    <option value="deep_cleaning">{t('history.types.deep_cleaning')}</option>
                    <option value="move_in">{t('history.types.move_in')}</option>
                    <option value="move_out">{t('history.types.move_out')}</option>
                    <option value="recurring">{t('history.types.recurring')}</option>
                    <option value="one_time">{t('history.types.one_time')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('history.status')}</label>
                  <select value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
                    className="w-full h-9 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
                    <option value="">{t('history.allStatuses')}</option>
                    <option value="scheduled">{t('history.statuses.scheduled')}</option>
                    <option value="in_progress">{t('history.statuses.in_progress')}</option>
                    <option value="completed">{t('history.statuses.completed')}</option>
                    <option value="needs_review">{t('history.statuses.needs_review')}</option>
                    <option value="cancelled">{t('history.statuses.cancelled')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('history.contractor')}</label>
                  <select value={filters.contractorId} onChange={(e) => { setFilters((f) => ({ ...f, contractorId: e.target.value })); setPage(1); }}
                    className="w-full h-9 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all">
                    <option value="">{t('history.allContractors')}</option>
                    {contractors.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('history.dateFrom')}</label>
                  <input type="date" value={filters.dateFrom} onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setPage(1); }}
                    className="w-full h-9 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-display font-bold text-[9px] uppercase tracking-widest text-slate-400">{t('history.dateTo')}</label>
                  <input type="date" value={filters.dateTo} onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setPage(1); }}
                    className="w-full h-9 px-3 font-body text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
                </div>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-3 text-[11px] font-display font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {t('common.clearAllFilters')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm p-4 transition-colors duration-200">
        <div className="border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-navy-light/50 font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">{t('history.columns.client')}</th>
                <th className="px-6 py-4">{t('history.columns.type')}</th>
                <th className="px-6 py-4">{t('jobs.status')}</th>
                <th className="px-6 py-4">{t('history.columns.scheduled')}</th>
                <th className="px-6 py-4">{t('history.columns.completedCancelled')}</th>
                <th className="px-6 py-4">{t('history.columns.notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-body text-[13px] text-gray-400">
                    <div className="animate-pulse">{t('history.loading')}</div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-body text-[13px] text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="w-8 h-8 text-slate-300" />
                      {t('history.noRecords')}
                      {hasFilters && <button onClick={clearFilters} className="text-gold-dark underline">{t('common.clearFilters')}</button>}
                    </div>
                  </td>
                </tr>
              ) : (
                history.map((entry: any, index: number) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedService(entry)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-light/30 transition-colors ${
                      index % 2 === 0 ? 'bg-white dark:bg-navy' : 'bg-gray-50 dark:bg-navy-light/20'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-display font-bold text-[13px] text-navy dark:text-slate-200">{entry.clientName}</span>
                    </td>
                    <td className="px-6 py-4 font-display font-bold text-[13px] text-gray-500 dark:text-slate-400 capitalize">
                      {entry.serviceType?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-6 py-4 font-display font-bold text-[13px] text-gray-500 dark:text-slate-400">
                      {formatDate(entry.scheduledAt)}
                    </td>
                    <td className="px-6 py-4 font-display font-bold text-[13px] text-gray-500 dark:text-slate-400">
                      {entry.status === 'cancelled' && entry.cancelledAt ? formatDate(entry.cancelledAt) : entry.status === 'completed' ? formatDate(entry.updatedAt) : '\u2014'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {entry.cancellationReason && (
                          <span className="flex items-center gap-1 text-[10px] text-rose-500 font-display font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {t('history.notes.cancelled')}
                          </span>
                        )}
                        {entry.needsReviewReason && (
                          <span className="flex items-center gap-1 text-[10px] text-purple-500 font-display font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {t('history.notes.review')}
                          </span>
                        )}
                        {entry.hasIncidents && (
                          <span className="text-[10px] text-amber-500 font-display font-bold">{t('history.notes.incidents')}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="font-body text-[12px] text-slate-400">
            Showing {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/30 text-slate-500 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-display font-bold text-[12px] text-slate-500 dark:text-slate-400">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/30 text-slate-500 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedService(null)}
              className="absolute inset-0 bg-navy-dark/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-navy rounded-[32px] shadow-xl border border-gray-100 dark:border-slate-800 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <StatusBadge status={selectedService.status} />
                  <h3 className="font-display font-bold text-[16px] text-navy dark:text-white mt-2">{selectedService.clientName}</h3>
                </div>
                <button onClick={() => setSelectedService(null)} className="p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-light/30 rounded-xl">
                  <MapPin className="w-4 h-4 text-gold-dark shrink-0" />
                  <span className="font-body text-[12px] text-slate-600 dark:text-slate-300">{selectedService.address || '\u2014'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-light/30 rounded-xl">
                  <Clock className="w-4 h-4 text-gold-dark shrink-0" />
                  <span className="font-body text-[12px] text-slate-600 dark:text-slate-300">
                    {t('history.detail.scheduled')} {formatDate(selectedService.scheduledAt)}
                  </span>
                </div>
                {selectedService.cancellationReason && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/20">
                    <p className="font-display font-bold text-[10px] text-rose-600 uppercase tracking-widest mb-1">{t('history.detail.cancellationReason')}</p>
                    <p className="font-body text-[12px] text-rose-700 dark:text-rose-300">{selectedService.cancellationReason}</p>
                  </div>
                )}
                {selectedService.needsReviewReason && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20">
                    <p className="font-display font-bold text-[10px] text-purple-600 uppercase tracking-widest mb-1">{t('history.detail.reviewReason')}</p>
                    <p className="font-body text-[12px] text-purple-700 dark:text-purple-300">{selectedService.needsReviewReason}</p>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedService(null)} className="mt-4 w-full py-2.5 bg-navy dark:bg-white text-white dark:text-navy font-display font-bold text-[11px] rounded-xl transition-colors">
                {t('common.close')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
