import { Wifi, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { changeLanguage } from '../i18n';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

export function Profile() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <div className="page-container">
      <div className="bg-white dark:bg-navy text-navy dark:text-white p-6 shrink-0 flex items-center shadow-sm border-b border-gray-100 dark:border-slate-800 z-10 -mx-6 -mt-8 px-6 mb-8 rounded-[32px] rounded-b-none">
        <h1 className="font-display font-bold text-[20px] tracking-tight">{t('users.profileTitle')}</h1>
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        <div className="bg-white dark:bg-navy rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 p-10 flex flex-col items-center justify-center text-center transition-colors duration-200">
          <div className="w-24 h-24 rounded-full bg-gold/10 text-gold-dark dark:text-gold border border-gold/10 dark:border-gold/20 flex items-center justify-center text-3xl font-display font-black tracking-tight mb-6 mt-2">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <h2 className="text-2xl font-display font-bold text-navy dark:text-white mb-2">{user?.firstName} {user?.lastName}</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6 font-display font-bold text-[13px]">{user?.email}</p>
          <span className="bg-gold/10 text-gold-dark dark:text-gold border border-gold/10 dark:border-gold/20 font-display font-bold text-[10px] px-4 py-1.5 rounded-full tracking-widest uppercase">
            {user?.role || t('users.roles.manager')}
          </span>
        </div>

        <div className="bg-white dark:bg-navy rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 p-8 transition-colors duration-200">
          <h3 className="font-display font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-6">{t('profile.language')}</h3>
          <div
            onClick={toggleLanguage}
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-light/30 -mx-8 px-8 transition-colors rounded-2xl"
          >
            <span className="text-navy dark:text-slate-200 font-display font-bold">{t('profile.preference')}</span>
            <div className="flex items-center text-gray-400">
              <span className="mr-1 font-display font-bold uppercase">{(user?.language || 'en') === 'en' ? 'English' : 'Espa\u00F1ol'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-navy rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 p-8 transition-colors duration-200">
            <h3 className="font-display font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-6">{t('profile.accountInfo')}</h3>
            <div
              onClick={toggleLanguage}
              className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-light/30 -mx-8 px-8 transition-colors rounded-2xl"
            >
              <span className="text-navy dark:text-slate-200 font-display font-bold">{t('profile.language')}</span>
              <div className="flex items-center text-gray-400">
                <span className="mr-1 font-display font-bold uppercase">{(user?.language || 'en') === 'en' ? 'EN' : 'ES'}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-navy rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 p-8 transition-colors duration-200">
            <h3 className="font-display font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-6">{t('profile.deviceInfo')}</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-navy dark:text-slate-200 font-display font-bold">
                  <Wifi className="w-5 h-5 text-gold-dark dark:text-gold" />
                  {t('profile.status')}
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-display font-bold text-[13px] bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  {t('profile.online')}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-navy dark:text-slate-200 font-display font-bold">{t('profile.pendingSync')}</span>
                <span className="text-gray-500 dark:text-slate-400 font-display font-black">0</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white dark:bg-navy hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-100 dark:border-red-900/30 py-5 rounded-[32px] flex items-center justify-center gap-2 font-display font-bold text-[15px] transition-colors mt-4 shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          {t('profile.signOut')}
        </button>
      </div>
    </div>
  );
}
