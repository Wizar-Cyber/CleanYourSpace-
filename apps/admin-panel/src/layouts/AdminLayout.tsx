import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, FileText, LogOut, CheckSquare, Moon, Sun, Hexagon, PanelLeftClose, PanelLeftOpen, TrendingUp, Package, Briefcase, CalendarDays, Clock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../components/ThemeContext';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import { NotificationBell } from '../components/NotificationPanel';

const navItems: { to: string; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/jobs', icon: Briefcase, labelKey: 'nav.jobs' },
  { to: '/jobs/calendar', icon: CalendarDays, labelKey: 'nav.calendar' },
  { to: '/jobs/history', icon: Clock, labelKey: 'nav.history' },
  { to: '/checklists', icon: CheckSquare, labelKey: 'nav.checklists' },
  { to: '/users', icon: Users, labelKey: 'nav.cleaners' },
  { to: '/assignments', icon: CalendarCheck, labelKey: 'nav.assignments' },
  { to: '/reports', icon: FileText, labelKey: 'nav.reports' },
  { to: '/performance', icon: TrendingUp, labelKey: 'nav.performance' },
  { to: '/inventory', icon: Package, labelKey: 'nav.inventory' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-navy-dark text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      <aside
        className={`${
          collapsed ? 'w-[72px]' : 'w-[240px]'
        } bg-white dark:bg-navy-dark flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 shadow-sm relative transition-all duration-200`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center shrink-0">
                <Hexagon className="w-5 h-5 text-white" />
              </div>
              <div className={`overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <span className="text-[17px] font-display font-bold text-navy dark:text-white tracking-tight whitespace-nowrap">Corecon</span>
                <p className="font-display font-bold text-[8px] text-slate-400 uppercase tracking-widest -mt-0.5 whitespace-nowrap">Admin Panel</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 ${collapsed ? 'hidden' : ''}`}>
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
            </div>
          </div>
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-white dark:bg-navy-light border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors`}
        >
          {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 ${
                  collapsed ? 'justify-center px-0' : 'px-4'
                } py-2.5 rounded-xl text-[11px] font-display font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-gold/10 text-gold-dark dark:bg-gold/15 dark:text-gold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-light/30 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
              title={collapsed ? t(item.labelKey) : undefined}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className={`overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className={`p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <NavLink
            to="/profile"
            className={`flex items-center gap-3 ${
              collapsed ? 'justify-center px-0 w-full' : 'px-3'
            } py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-colors group`}
            title={collapsed ? t('nav.profile') : undefined}
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-navy-light text-navy dark:text-slate-300 flex items-center justify-center font-display font-bold text-[11px] shrink-0 group-hover:bg-gold/20 group-hover:text-gold-dark dark:group-hover:text-gold transition-colors">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className={`text-left overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <p className="text-[12px] font-display font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate whitespace-nowrap">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="font-display font-bold text-[8px] text-slate-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">{user?.role || 'Admin'}</p>
            </div>
          </NavLink>
          <button
            onClick={logout}
            className={`flex items-center gap-3 ${
              collapsed ? 'justify-center px-0 w-full' : 'px-4 w-full'
            } py-2.5 rounded-xl text-[11px] font-display font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors`}
            title={collapsed ? t('nav.logOut') : undefined}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span className={`overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{t('nav.logOut')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

