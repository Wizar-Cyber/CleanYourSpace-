import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle, RotateCcw, Clock } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useTranslation } from 'react-i18next';

const iconMap: Record<string, typeof Bell> = {
  location_alert: AlertTriangle,
  service_pending_verification: Clock,
  service_returned: RotateCcw,
  service_completed: CheckCircle,
  service_started: Info,
  cleaner_deactivated_with_active_service: AlertTriangle,
  system: Info,
};

export function NotificationBell() {
  const { t } = useTranslation();
  const { isOpen, togglePanel, closePanel, unreadCount } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={togglePanel}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title={t('notifications.title')}
        aria-label={t('notifications.title')}
        aria-expanded={isOpen}
        aria-controls="notification-panel"
      >
        <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-display font-bold rounded-full min-w-[18px] min-h-[18px]" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={closePanel} />
          <div id="notification-panel" className="absolute right-0 top-full mt-2 z-50 w-[380px] bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-xl shadow-black/5 overflow-hidden" role="dialog" aria-label={t('notifications.title')}>
            <NotificationPanelContent />
          </div>
        </>
      )}
    </div>
  );
}

function NotificationPanelContent() {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gold-dark dark:text-gold" />
          <span className="font-display font-bold text-[13px] text-slate-800 dark:text-white">{t('notifications.title')}</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-gold/10 text-gold-dark dark:text-gold text-[9px] font-display font-bold">
              {t('notifications.new', { count: unreadCount })}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-[10px] font-display font-bold text-slate-400 hover:text-gold-dark dark:hover:text-gold transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-display font-bold text-[11px] text-slate-400 dark:text-slate-500">{t('notifications.noNotifications')}</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = iconMap[n.type] || Info;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                  n.read
                    ? 'hover:bg-slate-50 dark:hover:bg-navy-light/20'
                    : 'bg-gold/5 dark:bg-gold/5 hover:bg-gold/10 dark:hover:bg-gold/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  n.read
                    ? 'bg-slate-100 dark:bg-navy-light text-slate-400 dark:text-slate-500'
                    : 'bg-gold/15 text-gold-dark dark:text-gold'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-display text-[12px] leading-tight ${
                    n.read
                      ? 'font-medium text-slate-500 dark:text-slate-400'
                      : 'font-bold text-slate-800 dark:text-white'
                  }`}>
                    {n.title}
                  </p>
                  <p className="font-body text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="font-body text-[9px] text-slate-400 dark:text-slate-600 mt-1">
                    {formatRelativeTime(n.createdAt, t)}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-gold-dark dark:bg-gold shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function formatRelativeTime(dateStr: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return t('notifications.justNow');
  if (mins < 60) return t('notifications.minutesAgo', { count: mins });
  if (hours < 24) return t('notifications.hoursAgo', { count: hours });
  if (days < 7) return t('notifications.daysAgo', { count: days });
  return new Date(dateStr).toLocaleDateString();
}


