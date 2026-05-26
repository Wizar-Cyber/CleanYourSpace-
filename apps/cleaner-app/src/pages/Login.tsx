import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Timer, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';

export function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('cleaner@corecon.us');
  const [password, setPassword] = useState('password123');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.user?.mustChangePassword) {
        setMustChange(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { api } = await import('../services/api');
      await api.auth.changePassword(password, newPassword);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-navy-dark bg-cover bg-center transition-colors duration-200"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80")' }}
    >
      <div className="absolute inset-0 bg-[#f8fafc]/60 dark:bg-navy-dark/80 backdrop-blur-md transition-colors duration-200" />

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display font-bold text-[32px] text-slate-800 dark:text-gold tracking-tight">{t('login.title')}</h1>
          <p className="font-body text-[13px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold text-[10px]">
            {mustChange ? t('login.subtitleChangePassword') : t('login.subtitle')}
          </p>
        </div>

        {!mustChange ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-navy rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-8 space-y-5 transition-colors duration-200">
            <div className="flex justify-end -mt-3 -mr-3">
              <button type="button" onClick={toggleTheme} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light text-slate-400 dark:text-slate-400 transition-colors">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="bg-error-bg dark:bg-red-500/10 text-error dark:text-red-400 font-body text-[11px] p-3 rounded-2xl border border-error/10 dark:border-red-500/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-400">{t('login.email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 font-body text-[13px] font-medium border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                placeholder={t('login.emailPlaceholder')} required />
            </div>

            <div className="space-y-2">
              <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-400">{t('login.password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-12 font-body text-lg font-black tracking-widest border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                  placeholder={t('login.passwordPlaceholder')} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light text-slate-400 dark:text-slate-400 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="bg-white dark:bg-navy rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-8 space-y-5 transition-colors duration-200">
            <div className="flex justify-end -mt-3 -mr-3">
              <button type="button" onClick={toggleTheme} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light text-slate-400 dark:text-slate-400 transition-colors">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="bg-error-bg dark:bg-red-500/10 text-error dark:text-red-400 font-body text-[11px] p-3 rounded-2xl border border-error/10 dark:border-red-500/20">{error}</div>
            )}

            <p className="font-body text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{t('login.changePasswordDesc')}</p>

            <div className="space-y-2">
              <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-400">{t('login.currentPassword')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-12 font-body text-[13px] font-medium border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light text-slate-400 dark:text-slate-400 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-display font-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-400">{t('login.newPassword')}</label>
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-12 font-body text-[13px] font-medium border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-navy-dark text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                  minLength={8} required />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light text-slate-400 dark:text-slate-400 transition-colors" tabIndex={-1}>
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || newPassword.length < 8} className="btn-primary">
              {loading ? t('login.updating') : t('login.changePassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
