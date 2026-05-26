import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../components/ThemeContext';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import { Moon, Sun, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('admin@corecon.us');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-offwhite dark:bg-navy-dark bg-cover bg-center transition-colors duration-200"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80")' }}
    >
      <div className="absolute inset-0 bg-offwhite/60 dark:bg-navy-dark/80 backdrop-blur-md transition-colors duration-200" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-[40px] text-navy dark:text-gold tracking-tight">Corecon</h1>
          <p className="font-body text-[13px] text-gray-500 dark:text-slate-400 mt-2 uppercase tracking-widest font-bold text-[10px]">{t('login.adminPanel')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-navy rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-800 p-10 space-y-6 transition-colors duration-200">
          <div className="flex justify-end -mt-2 -mr-2 gap-1">
            <button
              type="button"
              onClick={() => changeLanguage(i18n.language === 'en' ? 'es' : 'en')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-light text-gray-400 dark:text-slate-400 transition-colors font-display font-bold text-[11px] uppercase"
            >
              {i18n.language === 'en' ? 'ES' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-light text-gray-400 dark:text-slate-400 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-center -mt-4">
            <h2 className="font-display font-bold text-[22px] text-navy dark:text-white">{t('login.welcome')}</h2>
            <p className="font-body text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-bold">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="bg-error-bg dark:bg-red-500/10 text-error dark:text-red-400 font-body text-[11px] p-3 rounded-2xl border border-error/10 dark:border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-400">
              {t('login.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 font-body text-[13px] font-medium border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-navy-dark text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              placeholder="admin@corecon.us"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-400">
              {t('login.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 font-body text-lg font-black tracking-widest border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-navy-dark text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-light text-gray-400 dark:text-slate-400 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded-lg border-gray-300 dark:border-slate-700 text-gold focus:ring-gold cursor-pointer"
              />
              <span className="font-display font-bold text-[11px] text-gray-500 dark:text-slate-400">{t('login.rememberMe')}</span>
            </label>
            <a href="#" className="font-display font-bold text-[11px] text-gold-dark dark:text-gold hover:text-gold transition-colors">
              {t('login.forgotPassword')}
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-navy dark:bg-gold text-white dark:text-navy-dark font-display font-bold text-[11px] rounded-2xl hover:bg-navy-light dark:hover:bg-gold-light active:bg-navy-dark transition-all duration-150 shadow-md shadow-navy/20 dark:shadow-none disabled:opacity-50"
          >
            {loading ? t('login.signingIn') : t('login.logIn')}
          </button>
        </form>

        <p className="text-center mt-6 font-body text-[10px] text-gray-400 dark:text-slate-500">
          {t('login.version')}
        </p>
      </div>
    </div>
  );
}
