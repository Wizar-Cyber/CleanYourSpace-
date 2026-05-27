import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Users, Calendar, Clock, DollarSign, Bell, MapPin, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Dashboard() {
  const { t } = useTranslation();
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [usersR, assignmentsR] = await Promise.all([
        api.users.stats(),
        api.assignments.summary(),
      ]);
      return {
        users: usersR.data || usersR,
        assignments: assignmentsR.data || assignmentsR,
      };
    },
    refetchInterval: 30000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['admin-dashboard-alerts'],
    queryFn: async () => {
      const res = await api.dashboard.alerts();
      return res.data || res;
    },
    refetchInterval: 15000,
  });

  const { data: clockedIn } = useQuery({
    queryKey: ['admin-dashboard-clocked-in'],
    queryFn: async () => {
      const res = await api.dashboard.clockedIn();
      return typeof res === 'number' ? res : (res.data ?? res ?? 0);
    },
    refetchInterval: 30000,
  });

  const { data: incidents } = useQuery({
    queryKey: ['admin-dashboard-incidents'],
    queryFn: async () => {
      const res = await api.dashboard.incidents();
      return res.data || res;
    },
    refetchInterval: 30000,
  });

  const alerts = Array.isArray(alertsData) ? alertsData.slice(0, 5) : [];

  const chartData = [
    { name: t('dashboard.completed'), value: stats?.assignments?.completed ?? 12, fill: '#1E8449' },
    { name: t('dashboard.inProgress'), value: stats?.assignments?.inProgress ?? 6, fill: '#C9A84C' },
    { name: t('dashboard.pending'), value: stats?.assignments?.pending ?? 3, fill: '#243A63' },
  ];

  const kpiCards = [
    {
      label: t('dashboard.totalCleaners'), value: stats?.users?.cleaners ?? '\u2014', icon: Users,
      trend: t('dashboard.plusThisWeek'), trendColor: 'text-emerald-500',
    },
    {
      label: t('dashboard.activeAssignments'), value: stats?.assignments?.total ?? '\u2014', icon: Calendar,
      trend: `${stats?.assignments?.pending ?? 0} ${t('dashboard.pending')}`, trendColor: 'text-gold-dark dark:text-gold',
    },
    {
      label: t('dashboard.clockedIn'), value: clockedIn ?? '\u2014', icon: MapPin,
      trend: t('dashboard.today'), trendColor: 'text-blue-500',
    },
    {
      label: t('dashboard.openIncidents'), value: incidents?.open ?? '\u2014', icon: AlertTriangle,
      trend: `${incidents?.total ?? 0} ${t('dashboard.total')}`, trendColor: 'text-rose-500',
    },
  ];

  return (
    <div className="page-container">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="page-title">{t('dashboard.greeting')}</h1>
          <p className="page-subtitle">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white dark:bg-navy-dark rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{card.label}</span>
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-navy-light/50 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-display font-black tracking-tight text-navy dark:text-white">{card.value}</div>
              <div className={`font-display font-bold text-[10px] uppercase mt-2 ${card.trendColor}`}>{card.trend}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-navy-dark rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <h2 className="font-display font-bold text-[15px] text-slate-800 dark:text-white tracking-tight mb-6 mt-2">{t('dashboard.dailyOperations')}</h2>

          <div className="flex gap-8 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            {[
              { label: t('dashboard.completed'), value: stats?.assignments?.completed ?? 12, color: 'bg-emerald-500' },
              { label: t('dashboard.inProgress'), value: stats?.assignments?.inProgress ?? 73, color: 'bg-gold' },
              { label: t('dashboard.pending'), value: stats?.assignments?.pending ?? 0, color: 'bg-slate-300' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col">
                <span className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  {item.label}
                </span>
                <span className="text-2xl font-display font-black mt-1 text-slate-800 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={100}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} dy={10} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '16px', border: 'none', background: '#1B2A4A', color: '#fff',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-dark rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors duration-200">
          <div>
            <div className="flex justify-between items-center mb-6 mt-2">
              <h2 className="font-display font-bold text-[15px] text-slate-800 dark:text-white tracking-tight">{t('dashboard.locationAlerts')}</h2>
              {alerts.length > 0 && (
                <span className="px-3 py-1 bg-gold/10 text-gold-dark dark:text-gold rounded-full font-display font-bold text-[10px] uppercase tracking-widest">{alerts.length} {t('dashboard.newAlerts')}</span>
              )}
            </div>

            {alerts.length === 0 ? (
              <p className="font-body text-[13px] text-slate-400 dark:text-slate-500 text-center py-8">{t('dashboard.noAlerts')}</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className={`flex gap-4 p-4 rounded-2xl border ${alert.resolved ? 'bg-slate-50 dark:bg-navy-light/30 border-slate-100 dark:border-slate-700 opacity-80' : 'bg-gold/5 dark:bg-gold/10 border-gold/10 dark:border-gold/20'}`}>
                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${alert.resolved ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400' : 'bg-gold/10 text-gold-dark dark:text-gold'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-[13px] text-slate-800 dark:text-slate-200">
                        {alert.message || `Geofence alert - ${alert.latitude?.toFixed(4)}, ${alert.longitude?.toFixed(4)}`}
                      </p>
                      <p className={`font-display font-bold text-[10px] uppercase tracking-widest mt-1 ${alert.resolved ? 'text-slate-400' : 'text-gold-dark dark:text-gold'}`}>
                        {formatRelativeTime(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
