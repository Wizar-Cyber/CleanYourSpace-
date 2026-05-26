import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { LogOut, Wifi, WifiOff, Smartphone, ChevronRight, Clock, CheckCircle, FileText, ExternalLink, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useEffect, useState } from 'react';
import { getPendingSyncCount } from '../services/db';
import { changeLanguage } from '../i18n';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';

export function Profile() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [pendingCount, setPendingCount] = useState(0);

  const { data: profileData } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: () => api.users.getContractorProfile(user!.id),
    enabled: user?.role === 'contractor' && !!user?.id,
  });

  const push = usePushSubscription();

  const { data: documents } = useQuery({
    queryKey: ['my-documents', user?.id],
    queryFn: () => api.documents.listByUser(user!.id),
    enabled: !!user?.id,
  });

  const stats = profileData?.stats;
  const recentAssignments = profileData?.recentAssignments || [];

  useEffect(() => {
    const load = async () => {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    addToast(t('profile.loggedOut'), 'info');
    setTimeout(() => { logout(); navigate('/login'); }, 300);
  };

  const toggleLanguage = async () => {
    if (!user) return;
    const newLang = user.language === 'es' ? 'en' : 'es';
    changeLanguage(newLang);
    try {
      await api.users.update(user.id, { language: newLang } as any);
      user.language = newLang;
      localStorage.setItem('user', JSON.stringify(user));
    } catch {
      // Revert on failure
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-[22px] text-slate-800 dark:text-white">{t('profile.title')}</h2>

      <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm text-center transition-colors duration-200">
        <div className="w-20 h-20 rounded-full bg-gold/10 text-gold-dark dark:text-gold border border-gold/10 dark:border-gold/20 flex items-center justify-center mx-auto mb-4">
          <span className="font-display font-bold text-[28px]">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
        </div>
        <h3 className="font-display font-bold text-[18px] text-slate-800 dark:text-white">{user?.firstName} {user?.lastName}</h3>
        <p className="font-body text-[11px] text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="inline-flex px-3 py-1 bg-gold/10 text-gold-dark dark:text-gold rounded-full font-display font-bold text-[9px] uppercase tracking-widest border border-gold/10 dark:border-gold/20">
            {user?.role}
          </span>
          {user?.contractType && (
            <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-full font-display font-bold text-[9px] uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
              {user.contractType === 'w2' ? 'W2' : '1099'}
            </span>
          )}
        </div>
      </div>

      {user?.role === 'contractor' && stats && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-sm transition-colors duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gold-dark dark:text-gold" />
                <span className="font-display font-bold text-[9px] text-slate-400 uppercase tracking-widest">{t('profile.totalHours')}</span>
              </div>
              <span className="font-display font-bold text-[22px] text-slate-800 dark:text-white">{stats.totalHours}h</span>
            </div>
            <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-sm transition-colors duration-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-display font-bold text-[9px] text-slate-400 uppercase tracking-widest">{t('profile.completed')}</span>
              </div>
              <span className="font-display font-bold text-[22px] text-slate-800 dark:text-white">{stats.completedServices}/{stats.totalServices}</span>
            </div>
          </div>

          {recentAssignments.length > 0 && (
            <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm transition-colors duration-200">
              <h4 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4">{t('profile.serviceHistory')}</h4>
              <div className="space-y-2">
                {recentAssignments.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <span className="font-display font-bold text-[12px] text-slate-800 dark:text-white">{a.serviceName || 'Service'}</span>
                      <span className="block font-body text-[10px] text-slate-400">
                        {a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString() : ''}
                        {a.totalMinutes ? ` · ${Math.round(a.totalMinutes / 60)}h ${a.totalMinutes % 60}m` : ''}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-display font-bold text-[8px] uppercase tracking-widest border ${
                      a.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      a.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm space-y-4 transition-colors duration-200">
        <h4 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t('profile.accountInfo')}</h4>
        <div onClick={toggleLanguage} className="flex items-center justify-between py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-light/30 -mx-6 px-6 transition-colors rounded-2xl">
          <span className="font-body text-[13px] text-slate-600 dark:text-slate-400">{t('profile.language')}</span>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <span className="font-display font-bold text-[13px] text-slate-800 dark:text-white uppercase">{(user?.language || 'en') === 'en' ? 'English' : 'Español'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm space-y-4 transition-colors duration-200">
        <h4 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t('profile.notifications')}</h4>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {push.subscribed ? (
              <Bell className="w-5 h-5 text-gold-dark dark:text-gold" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <span className="font-body text-[13px] text-slate-600 dark:text-slate-400">{t('notifications.push')}</span>
              {push.error && (
                <p className="font-body text-[9px] text-red-500">{push.error}</p>
              )}
            </div>
          </div>
          {push.subscribed ? (
            <button
              onClick={push.unsubscribe}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-light/50 text-slate-600 dark:text-slate-400 font-display font-bold text-[10px] hover:bg-slate-200 dark:hover:bg-navy-light transition-colors"
            >{t('notifications.disable')}</button>
          ) : (
            <button
              onClick={push.requestPermission}
              disabled={push.permission === 'denied'}
              className="px-3 py-1.5 rounded-xl bg-gold-dark dark:bg-gold text-white font-display font-bold text-[10px] hover:bg-gold-dark/90 dark:hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {push.permission === 'denied' ? t('notifications.blocked') : t('notifications.enable')}
            </button>
          )}
        </div>
      </div>

      {documents && documents.length > 0 && (
        <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm transition-colors duration-200">
          <h4 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4">{t('profile.documents')}</h4>
          <div className="space-y-2">
            {(Array.isArray(documents) ? documents : []).map((doc: any) => (
              <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-light/30 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-gold-dark dark:text-gold shrink-0" />
                  <span className="font-display font-bold text-[11px] text-slate-800 dark:text-white truncate">{doc.originalName}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-gold-dark dark:group-hover:text-gold shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm space-y-4 transition-colors duration-200">
        <h4 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t('profile.deviceInfo')}</h4>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-body text-[13px] text-slate-600 dark:text-slate-400">
            <Smartphone className="w-5 h-5 text-slate-400 dark:text-slate-500" /> {t('profile.status')}</span>
          <span className="flex items-center gap-1.5 font-display font-bold text-[11px]">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Wifi className="w-4 h-4" /> {t('profile.online')}</span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
                <WifiOff className="w-4 h-4" /> {t('profile.offline')}</span>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="font-body text-[13px] text-slate-600 dark:text-slate-400">{t('profile.pendingSync')}</span>
          <span className="font-display font-black text-[15px] text-slate-800 dark:text-white">{pendingCount}</span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-4 bg-white dark:bg-navy hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-100 dark:border-red-900/30 rounded-[32px] font-display font-bold text-[15px] transition-colors shadow-sm flex items-center justify-center gap-2 hover:border-red-200 dark:hover:border-red-900/50"
      >
        <LogOut className="w-5 h-5" />{t('profile.signOut')}</button>

      <p className="text-center font-body text-[9px] text-slate-400 dark:text-slate-500">{t('profile.version')}</p>
    </div>
  );
}
