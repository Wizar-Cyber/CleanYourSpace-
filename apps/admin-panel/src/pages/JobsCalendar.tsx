import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin, X,
} from 'lucide-react';
import { StatusBadge } from '@corecon/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

type ViewMode = 'day' | 'week' | 'month';

export function JobsCalendar() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    return { start: start.toISOString(), end: end.toISOString() };
  }, [currentDate, view]);

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['jobs-calendar', dateRange],
    queryFn: () => api.services.calendar({ dateFrom: dateRange.start, dateTo: dateRange.end, view }),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      api.services.reschedule(id, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      addToast(t('calendar.rescheduleSuccess'), 'success');
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  const services: any[] = (servicesData?.data || servicesData) ?? [];

  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (view === 'day') next.setDate(next.getDate() + direction);
    else if (view === 'week') next.setDate(next.getDate() + 7 * direction);
    else next.setMonth(next.getMonth() + direction);
    setCurrentDate(next);
  };

  const goToday = () => setCurrentDate(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getServicesForDate = (dateKey: string) => {
    return services.filter((s: any) => {
      const sd = s.scheduledAt ? s.scheduledAt.split('T')[0] : '';
      return sd === dateKey;
    });
  };

  const handleDrop = (dateKey: string, serviceId: string) => {
    const newDate = new Date(dateKey + 'T12:00:00');
    rescheduleMutation.mutate({ id: serviceId, scheduledAt: newDate.toISOString() });
    setDragOverDate(null);
  };

  const headerLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (view === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', opts);
  }, [currentDate, view]);

  const weekDays = [t('calendar.days.sun'), t('calendar.days.mon'), t('calendar.days.tue'), t('calendar.days.wed'), t('calendar.days.thu'), t('calendar.days.fri'), t('calendar.days.sat')];

  if (view === 'month') {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = formatDateKey(new Date());
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    return (
      <div className="page-container">
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="page-title">{t('calendar.title')}</h1>
            <p className="page-subtitle">{t('calendar.monthSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-navy-light/50 rounded-xl p-1">
              {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider transition-all ${
                    view === v
                      ? 'bg-white dark:bg-navy shadow-sm text-navy dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/30 text-slate-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-display font-bold text-[18px] text-navy dark:text-white min-w-[240px] text-center">{headerLabel}</h2>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/30 text-slate-500 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={goToday} className="px-4 py-1.5 bg-slate-100 dark:bg-navy-light/50 hover:bg-slate-200 dark:hover:bg-navy-light font-display font-bold text-[10px] text-slate-600 dark:text-slate-400 rounded-xl transition-colors">
              {t('calendar.today')}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm p-4">
          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 rounded-[24px] overflow-hidden">
            {weekDays.map((d) => (
              <div key={d} className="bg-slate-50 dark:bg-navy-light/30 px-3 py-2 font-display font-bold text-[9px] text-slate-400 uppercase tracking-widest text-center">
                {d}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="bg-white dark:bg-navy min-h-[120px]" />;
              const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateKey = formatDateKey(dateObj);
              const dayServices = getServicesForDate(dateKey);
              const isToday = dateKey === today;
              const isDragOver = dragOverDate === dateKey;

              return (
                <div
                  key={dateKey}
                  onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateKey); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const serviceId = e.dataTransfer.getData('serviceId');
                    if (serviceId) handleDrop(dateKey, serviceId);
                  }}
                  className={`bg-white dark:bg-navy min-h-[120px] p-2 transition-colors ${
                    isDragOver ? 'bg-gold/10 dark:bg-gold/5' : ''
                  } ${isToday ? 'ring-2 ring-gold/40 ring-inset' : ''}`}
                >
                  <div className={`text-center mb-1 w-7 h-7 flex items-center justify-center rounded-full font-display font-bold text-[11px] mx-auto ${
                    isToday
                      ? 'bg-gold text-navy-dark'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayServices.slice(0, 3).map((s: any) => (
                      <div
                        key={s.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('serviceId', s.id)}
                        onClick={() => setSelectedService(s)}
                        className="px-2 py-1 rounded-lg bg-gold/10 dark:bg-gold/5 border border-gold/20 cursor-pointer hover:bg-gold/20 transition-colors group"
                      >
                        <p className="font-display font-bold text-[9px] text-navy dark:text-slate-200 truncate">{s.clientName}</p>
                        <p className="font-body text-[8px] text-slate-500 dark:text-slate-400 truncate">
                          {s.scheduledAt ? new Date(s.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    ))}
                    {dayServices.length > 3 && (
                      <p className="text-center font-display font-bold text-[8px] text-slate-400">+{dayServices.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
                    <CalendarDays className="w-4 h-4 text-gold-dark shrink-0" />
                    <span className="font-body text-[12px] text-slate-600 dark:text-slate-300">
                      {selectedService.scheduledAt ? new Date(selectedService.scheduledAt).toLocaleString() : '\u2014'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-light/30 rounded-xl">
                    <MapPin className="w-4 h-4 text-gold-dark shrink-0" />
                    <span className="font-body text-[12px] text-slate-600 dark:text-slate-300">{selectedService.address || '\u2014'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-light/30 rounded-xl">
                    <Clock className="w-4 h-4 text-gold-dark shrink-0" />
                    <span className="font-body text-[12px] text-slate-600 dark:text-slate-300">
                      {selectedService.estimatedMinutes ? `${selectedService.estimatedMinutes} ${t('common.min')}` : '\u2014'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="mt-4 w-full py-2.5 bg-navy dark:bg-white text-white dark:text-navy font-display font-bold text-[11px] rounded-xl transition-colors"
                >
                  {t('common.close')}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (view === 'day') {
    const todayServices = getServicesForDate(formatDateKey(currentDate));

    return (
      <div className="page-container">
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="page-title">{t('calendar.title')}</h1>
            <p className="page-subtitle">{t('calendar.daySubtitle')}</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-navy-light/50 rounded-xl p-1">
            {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider transition-all ${
                  view === v ? 'bg-white dark:bg-navy shadow-sm text-navy dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="font-display font-bold text-[18px] text-navy dark:text-white min-w-[240px] text-center">{headerLabel}</h2>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><ChevronRight className="w-5 h-5" /></button>
            <button onClick={goToday} className="px-4 py-1.5 bg-slate-100 dark:bg-navy-light/50 rounded-xl font-display font-bold text-[10px]">{t('calendar.today')}</button>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm p-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="py-12 text-center text-gray-400 animate-pulse">{t('common.loading')}</div>
            ) : todayServices.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="font-display font-bold text-[13px] text-slate-400">{t('calendar.noJobs')}</p>
              </div>
            ) : (
              todayServices.map((s: any) => (
                <div key={s.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-navy-light/30 rounded-2xl border border-gray-100 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-navy-light/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedService(s)}
                >
                  <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-gold-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-[13px] text-navy dark:text-slate-200 truncate">{s.clientName}</p>
                    <p className="font-body text-[11px] text-slate-500 dark:text-slate-400 truncate">{s.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-[12px] text-navy dark:text-slate-200">
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const weekStart = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }, [currentDate]);

  const weekDaysFull = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const today = formatDateKey(new Date());

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="page-title">{t('calendar.title')}</h1>
          <p className="page-subtitle">{t('calendar.weekSubtitle')}</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-navy-light/50 rounded-xl p-1">
          {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider transition-all ${
                view === v ? 'bg-white dark:bg-navy shadow-sm text-navy dark:text-white' : 'text-slate-500 dark:text-slate-400'
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/30 text-slate-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display font-bold text-[18px] text-navy dark:text-white min-w-[240px] text-center">{headerLabel}</h2>
          <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/30 text-slate-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={goToday} className="px-4 py-1.5 bg-slate-100 dark:bg-navy-light/50 hover:bg-slate-200 dark:hover:bg-navy-light font-display font-bold text-[10px] text-slate-600 dark:text-slate-400 rounded-xl transition-colors">
            {t('calendar.today')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400 animate-pulse">{t('common.loading')}</div>
      ) : (
        <div className="bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm p-4">
          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 rounded-[24px] overflow-hidden" style={{ minHeight: '500px' }}>
            {weekDaysFull.map((day, idx) => {
              const dateKey = formatDateKey(day);
              const dayServices = getServicesForDate(dateKey);
              const isToday = dateKey === today;
              const isDragOver = dragOverDate === dateKey;

              return (
                <div key={dateKey} className="flex flex-col bg-white dark:bg-navy min-h-full">
                  <div className={`px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800 ${
                    isToday ? 'bg-gold/5 dark:bg-gold/5' : 'bg-slate-50/50 dark:bg-navy-light/10'
                  }`}>
                    <p className="font-display font-bold text-[9px] text-slate-400 uppercase tracking-widest">{weekDays[idx]}</p>
                    <div className={`mt-1 w-8 h-8 flex items-center justify-center rounded-full font-display font-bold text-[13px] mx-auto ${
                      isToday ? 'bg-gold text-navy-dark' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateKey); }}
                    onDragLeave={() => setDragOverDate(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const serviceId = e.dataTransfer.getData('serviceId');
                      if (serviceId) handleDrop(dateKey, serviceId);
                    }}
                    className={`flex-1 p-2 space-y-1.5 transition-colors ${
                      isDragOver ? 'bg-gold/10 dark:bg-gold/5' : ''
                    }`}
                  >
                    {dayServices.length === 0 && (
                      <p className="text-center font-display font-bold text-[8px] text-slate-300 dark:text-slate-600 mt-6">\u2014</p>
                    )}
                    {dayServices.map((s: any) => (
                      <div
                        key={s.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('serviceId', s.id)}
                        onClick={() => setSelectedService(s)}
                        className="px-2.5 py-2 rounded-xl bg-gold/10 dark:bg-gold/5 border border-gold/20 cursor-pointer hover:bg-gold/20 transition-colors group"
                      >
                        <p className="font-display font-bold text-[10px] text-navy dark:text-slate-200 truncate">{s.clientName}</p>
                        <p className="font-body text-[8px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {s.scheduledAt ? new Date(s.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                          {s.address ? ` \u00B7 ${s.address}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
                  <CalendarDays className="w-4 h-4 text-gold-dark shrink-0" />
                  <span className="font-body text-[12px] text-slate-600 dark:text-slate-300">
                    {selectedService.scheduledAt ? new Date(selectedService.scheduledAt).toLocaleString() : '\u2014'}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-light/30 rounded-xl">
                  <MapPin className="w-4 h-4 text-gold-dark shrink-0" />
                  <span className="font-body text-[12px] text-slate-600 dark:text-slate-300">{selectedService.address || '\u2014'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-light/30 rounded-xl">
                  <Clock className="w-4 h-4 text-gold-dark shrink-0" />
                  <span className="font-body text-[12px] text-slate-600 dark:text-slate-300">
                    {selectedService.estimatedMinutes ? `${selectedService.estimatedMinutes} ${t('common.min')}` : '\u2014'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="mt-4 w-full py-2.5 bg-navy dark:bg-white text-white dark:text-navy font-display font-bold text-[11px] rounded-xl transition-colors"
              >
                {t('common.close')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
