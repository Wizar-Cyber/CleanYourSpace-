import { Outlet, NavLink } from 'react-router-dom';
import { Home, User, History as HistoryIcon, WifiOff, Timer, Moon, Sun, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../components/ThemeContext';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import { getPendingSyncCount, getSyncQueue, clearSyncedItem } from '../services/db';
import { api } from '../services/api';
import { NotificationBell } from '../components/NotificationBell';

export function CleanerLayout() {
  const { user } = useAuth();
  const isOnline = useNetworkStatus();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [pendingSync, setPendingSync] = useState(0);
  const prevOnlineRef = useRef(isOnline);

  const push = usePushSubscription();
  useEffect(() => {
    if (push.permission === 'granted' && !push.subscribed && !push.error) {
      push.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkSync = async () => {
      const count = await getPendingSyncCount();
      setPendingSync(count);
    };
    checkSync();
    const interval = setInterval(checkSync, 10000);
    return () => clearInterval(interval);
  }, [isOnline]);

  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (isOnline && wasOffline) {
      const flushSync = async () => {
        try {
          const queue = await getSyncQueue();
          for (const item of queue) {
            try {
              if (item.entity === 'checklist_item') {
                await api.checklist.updateItem(item.entityId, (item.payload as any) as any);
              } else if (item.entity === 'photo') {
                const payload = item.payload as any;
                const { url } = await api.photos.getUploadUrl(payload.filename, payload.mimeType || payload.type);
                if (payload.data) {
                  const blob = await fetch(payload.data).then(r => r.blob());
                  await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': payload.mimeType || payload.type } });
                }
                await api.photos.create({
                  assignmentId: payload.assignmentId, category: payload.category,
                  filename: payload.filename, mimeType: payload.mimeType || payload.type, size: payload.size,
                });
              }
              await clearSyncedItem(item.id!);
            } catch {}
          }
          const remaining = await getPendingSyncCount();
          setPendingSync(remaining);
        } catch {}
      };
      flushSync();
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-navy-dark pb-20 transition-colors duration-200">
      <header className="sticky top-0 z-10 bg-white dark:bg-navy-dark border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center">
              <Timer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-[16px] text-slate-800 dark:text-white leading-tight">{t('login.title')}</h1>
              <p className="font-body text-[8px] text-slate-400 dark:text-slate-500 leading-tight font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={() => changeLanguage(i18n.language === 'en' ? 'es' : 'en')}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-display font-bold text-[11px] uppercase"
              title="Toggle language"
            >
              {i18n.language === 'en' ? 'ES' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {!isOnline && (
              <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] px-2.5 py-1 rounded-xl font-display font-bold border border-amber-200 dark:border-amber-500/20">
                <WifiOff className="w-3 h-3" />
                {t('common.offline')}
              </span>
            )}
            {isOnline && pendingSync > 0 && (
              <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] px-2.5 py-1 rounded-xl font-display font-bold border border-amber-200 dark:border-amber-500/20">
                {pendingSync}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <Home className="nav-icon" />
            <span>{t('nav.home')}</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <HistoryIcon className="nav-icon" />
            <span>{t('nav.history')}</span>
          </NavLink>
          <NavLink
            to="/performance"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <TrendingUp className="nav-icon" />
            <span>{t('nav.performance')}</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <User className="nav-icon" />
            <span>{t('nav.profile')}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
