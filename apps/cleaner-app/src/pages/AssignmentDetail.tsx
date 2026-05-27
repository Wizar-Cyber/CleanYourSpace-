import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { db } from '../services/db';
import {
  Clock, MapPin, Timer, Play, CheckCircle, AlertTriangle, ClipboardCheck, Camera,
  LocateFixed, LocateOff, Navigation, ExternalLink, ListChecks,
} from 'lucide-react';
import { StatusBadge } from '@corecon/ui';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useLocation } from '../hooks/useLocation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  const { t } = useTranslation();
  const { getCurrentPosition, tracking, stopTracking } = useLocation();
  const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const [elapsed, setElapsed] = useState<string>('00:00');
  const [locationError, setLocationError] = useState<string | null>(null);
  const trackedRef = useRef(false);

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: async () => {
      try {
        const response = await api.assignments.get(id!);
        const a = response.data || response;
        await db.assignments.put({
          id: a.id, serviceId: a.serviceId, cleanerId: a.cleanerId,
          scheduledDate: a.scheduledDate, scheduledStartTime: a.scheduledStartTime,
          scheduledEndTime: a.scheduledEndTime, status: a.status,
          clientName: a.service?.clientName || a.clientName,
          clientAddress: a.service?.address || a.clientAddress,
          notes: a.notes, serviceName: a.service?.name,
          timerStart: a.timerStart, timerEnd: a.timerEnd, totalMinutes: a.totalMinutes,
          synced: true, updatedAt: new Date().toISOString(),
        });
        return { ...a, clientName: a.service?.clientName || a.clientName, clientAddress: a.service?.address || a.clientAddress };
      } catch {
        return db.assignments.get(id!);
      }
    },
  });

  useEffect(() => {
    if (!assignment?.timerStart || assignment?.timerEnd) return;
    const interval = setInterval(() => {
      const start = new Date(assignment.timerStart).getTime();
      const diff = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [assignment?.timerStart, assignment?.timerEnd]);

  useEffect(() => {
    if (assignment?.status === 'in_progress' && assignment?.timerStart && !assignment?.timerEnd && !trackedRef.current) {
      trackedRef.current = true;
      const timeout = setTimeout(async () => {
        try {
          const loc = await getCurrentPosition();
          await api.timeTracking.logPeriodic({
            assignmentId: id!, latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy,
          });
        } catch {}
      }, 5000);
      return () => clearTimeout(timeout);
    }
    if (assignment?.status !== 'in_progress') {
      trackedRef.current = false;
    }
    return;
  }, [assignment?.status, assignment?.timerStart, assignment?.timerEnd, id, getCurrentPosition]);

  const RADIUS = 100;

  const getLocationOrThrow = async () => {
    const loc = await getCurrentPosition();
    const svcLat = assignment?.latitude || assignment?.service?.latitude;
    const svcLng = assignment?.longitude || assignment?.service?.longitude;
    if (isOnline && svcLat != null && svcLng != null) {
      const dist = haversineDistance(loc.latitude, loc.longitude, svcLat, svcLng);
      if (dist > RADIUS) {
        setLocationError(t('assignment.geofenceDistance', { distance: Math.round(dist), radius: RADIUS }));
        throw new Error('Outside radius');
      }
    }
    return loc;
  };

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const loc = await getLocationOrThrow();
      const unwrapped = await api.timeTracking.clockIn({
        assignmentId: id!, latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy,
      });
      return unwrapped.data || unwrapped;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['cleaner-today'] });
      setLocationError(null);
    },
    onError: (err: Error) => {
      if (err.message !== 'Location required' && err.message !== 'Outside radius') {
        setLocationError(err.message);
      }
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const loc = await getLocationOrThrow();
      const unwrapped = await api.timeTracking.clockOut({
        assignmentId: id!, latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy,
      });
      return unwrapped.data || unwrapped;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['cleaner-today'] });
      stopTracking();
      trackedRef.current = false;
      setLocationError(null);
    },
    onError: (err: Error) => {
      if (err.message !== 'Location required' && err.message !== 'Outside radius') {
        setLocationError(err.message);
      }
    },
  });

  const [showChecklistWarning, setShowChecklistWarning] = useState(false);
  const [pendingItems, setPendingItems] = useState<string[]>([]);
  const [selectedEta, setSelectedEta] = useState<number>(30);

  const onTheWayMutation = useMutation({
    mutationFn: () => api.onTheWay.notify(id!, selectedEta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
    },
  });

  const { data: checklistData } = useQuery({
    queryKey: ['checklist', id],
    queryFn: async () => {
      try {
        const response = await api.checklist.get(id!);
        return response.data || response;
      } catch { return []; }
    },
    enabled: assignment?.status === 'in_progress',
  });

  const checklistItems = Array.isArray(checklistData) ? checklistData : [];

  const handleCompleteClick = () => {
    const incomplete = checklistItems
      .filter((item: any) => item.status !== 'completed' && item.status !== 'na')
      .map((item: any) => item.templateItem?.label || item.label);
    if (incomplete.length > 0) {
      setPendingItems(incomplete);
      setShowChecklistWarning(true);
    } else {
      clockOutMutation.mutate();
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const formatTimer = (minutes?: number) => {
    if (!minutes) return '00:00';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatGrace = (seconds: number | null): string => {
    if (seconds == null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const openInMaps = () => {
    if (!assignment?.clientAddress) return;
    const encoded = encodeURIComponent(assignment.clientAddress);
    window.open(`https://www.google.com/maps/search/${encoded}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-100 dark:bg-navy-light rounded-2xl w-3/4" />
        <div className="h-32 bg-slate-100 dark:bg-navy-light rounded-[24px]" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="font-body text-slate-500 dark:text-slate-400">{t('assignment.notFound')}</p>
      </div>
    );
  }

  const isPending = assignment.status === 'pending' || assignment.status === 'accepted';
  const isInProgress = assignment.status === 'in_progress';
  const isPendingVerification = assignment.status === 'pending_verification';
  const isCompleted = assignment.status === 'completed';
  const isReturned = assignment.status === 'returned';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <button onClick={() => navigate('/')} className="font-display text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-gold transition-colors">← {t('assignment.back')}</button>

      <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm transition-colors duration-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-[22px] text-slate-800 dark:text-white">{assignment.clientName}</h2>
            <p className="font-body text-[13px] text-slate-500 dark:text-slate-400 mt-1">{assignment.service?.name || assignment.serviceName}</p>
          </div>
          <StatusBadge status={assignment.status} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="font-body text-[13px]">{assignment.clientAddress}</span>
            {assignment.clientAddress && (
              <button onClick={openInMaps} className="ml-auto shrink-0 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/50 text-gold-dark dark:text-gold hover:text-gold-dark transition-colors" title={t('assignment.viewInMaps')}>
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="font-body text-[13px]">{formatTime(assignment.scheduledStartTime)} - {formatTime(assignment.scheduledEndTime)}</span>
          </div>
          {isInProgress && (
            <div className="flex items-center gap-3 text-gold-dark dark:text-gold">
              <Timer className="w-5 h-5 shrink-0" />
              <span className="font-display font-bold text-[15px]">{assignment.timerEnd ? formatTimer(assignment.totalMinutes) : elapsed}</span>
            </div>
          )}
          {assignment.totalMinutes && (
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <span className="font-body text-[13px]">{t('assignment.totalTime', { time: formatTimer(assignment.totalMinutes) })}</span>
            </div>
          )}
        </div>

        {isInProgress && assignment.timerStart && !assignment.timerEnd && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {tracking.withinRadius === true && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span className="font-display font-bold text-[10px]">{t('assignment.onSite')}</span>
                </span>
              )}
              {tracking.withinRadius === false && tracking.graceRemaining != null && tracking.graceRemaining > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="font-display font-bold text-[10px]">{t('assignment.graceRemaining', { time: formatGrace(tracking.graceRemaining) })}</span>
                </span>
              )}
              {tracking.withinRadius === false && tracking.graceRemaining === 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                  <LocateOff className="w-3.5 h-3.5" />
                  <span className="font-display font-bold text-[10px]">{t('assignment.outsideArea')}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {assignment.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="font-display font-bold text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t('assignment.notes')}</p>
            <p className="font-body text-[11px] text-slate-700 dark:text-slate-300">{assignment.notes}</p>
          </div>
        )}
      </div>

      {locationError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-[20px] font-body text-[11px] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {locationError}
        </div>
      )}

      {isPending && (
        <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="w-4 h-4 text-gold-dark dark:text-gold" />
            <h3 className="font-display font-bold text-[13px] text-navy dark:text-white">{t('assignment.onTheWay')}</h3>
          </div>
          <p className="font-body text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            {t('assignment.onTheWayDesc')}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={selectedEta}
              onChange={(e) => setSelectedEta(Number(e.target.value))}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-light/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-body text-[12px] focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <option value={15}>{t('assignment.eta15')}</option>
              <option value={30}>{t('assignment.eta30')}</option>
              <option value={45}>{t('assignment.eta45')}</option>
              <option value={60}>{t('assignment.eta60')}</option>
            </select>
            <button
              onClick={() => onTheWayMutation.mutate()}
              disabled={onTheWayMutation.isPending}
              className="px-4 py-2.5 rounded-xl bg-gold-dark dark:bg-gold text-white font-display font-bold text-[11px] hover:bg-gold-dark/90 dark:hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              {onTheWayMutation.isPending ? t('assignment.onTheWaySending') : t('assignment.onTheWayNotify')}
            </button>
          </div>
          {onTheWayMutation.isSuccess && (
            <p className="font-body text-[10px] text-emerald-600 dark:text-emerald-400 mt-2">
              {t('assignment.onTheWaySuccess', { minutes: selectedEta })}
            </p>
          )}
          {onTheWayMutation.isError && (
            <p className="font-body text-[10px] text-red-500 mt-2">
              {t('assignment.onTheWayFailed')}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {isPending && (
          <button onClick={() => clockInMutation.mutate()} disabled={clockInMutation.isPending}
            className="flex-1 btn-primary flex items-center justify-center gap-2">
            <Play className="w-5 h-5" />
            {clockInMutation.isPending ? t('assignment.starting') : t('assignment.clockIn')}
          </button>
        )}
        {isInProgress && (
          <>
            <button onClick={() => navigate(`/assignment/${id}/checklist`)}
              className="flex-1 btn-secondary flex items-center justify-center gap-2">
              <ClipboardCheck className="w-5 h-5" />{t('assignment.checklist')}</button>
            <button onClick={() => navigate(`/assignment/${id}/photos`)}
              className="flex-1 btn-secondary flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" />{t('assignment.photos')}</button>
          </>
        )}
      </div>

      {isInProgress && !isPendingVerification && (
        <button onClick={handleCompleteClick} disabled={clockOutMutation.isPending || showChecklistWarning}
          className="w-full btn-primary flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {clockOutMutation.isPending ? t('assignment.submitting') : t('assignment.clockOut')}
        </button>
      )}

      <AnimatePresence>
        {showChecklistWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 p-5 rounded-[24px]"
          >
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-5 h-5" />
              <span className="font-display font-bold text-[13px]">{t('assignment.incompleteChecklist')}</span>
            </div>
            <p className="font-body text-[11px] mb-3">{t('assignment.incompleteChecklistDesc')}</p>
            <ul className="space-y-1 mb-4">
              {pendingItems.map((label, i) => (
                <li key={i} className="flex items-center gap-2 font-body text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => setShowChecklistWarning(false)}
                className="flex-1 py-2.5 rounded-xl bg-white dark:bg-navy border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-display font-bold text-[11px] transition-colors"
              >{t('assignment.fixItems')}</button>
              <button
                onClick={() => { setShowChecklistWarning(false); clockOutMutation.mutate(); }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-display font-bold text-[11px] hover:bg-amber-600 transition-colors"
              >{t('assignment.submitAnyway')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPendingVerification && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 p-5 rounded-[24px]">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-display font-bold text-[13px]">{t('assignment.pendingVerification')}</span>
          </div>
          <p className="font-body text-[11px]">{t('assignment.pendingVerificationDesc')}</p>
        </div>
      )}

      {isCompleted && (
        <div className="bg-success-bg dark:bg-emerald-500/10 text-success dark:text-emerald-400 p-5 rounded-[24px] font-display font-bold text-[13px] text-center">{t('assignment.completed')}</div>
      )}

      {isReturned && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400 p-5 rounded-[24px]">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-display font-bold text-[13px]">{t('assignment.returned')}</span>
          </div>
          <p className="font-body text-[11px]">{assignment.rejectionNote || t('assignment.reviewResubmit')}</p>
          <button onClick={() => clockInMutation.mutate()} className="mt-3 btn-primary flex items-center justify-center gap-2">
            <Play className="w-5 h-5" />{t('assignment.resumeService')}</button>
        </div>
      )}
    </motion.div>
  );
}
