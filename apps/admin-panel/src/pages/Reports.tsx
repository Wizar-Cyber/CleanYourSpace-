import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Filter, Calendar, FileText } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api';
import { GenerateReportModal } from '../components/modals/GenerateReportModal';
import { useTranslation } from 'react-i18next';

export function Reports() {
  const { t } = useTranslation();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  const { data: servicesSummary } = useQuery({
    queryKey: ['services-summary'],
    queryFn: () => api.services.summary(),
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.reports.list(1, 50),
  });

  const ss = servicesSummary?.data ?? {};
  const reports = reportsData?.data ?? [];

  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 6890 },
    { name: 'Jun', revenue: 8390 },
    { name: 'Jul', revenue: 7490 },
  ];

  const statusData = [
    { name: 'Pending', value: ss.pending ?? 0, color: '#E67E22' },
    { name: 'In Progress', value: ss.inProgress ?? ss.in_progress ?? 0, color: '#3498DB' },
    { name: 'Verification', value: ss.pendingVerification ?? ss.pending_verification ?? 0, color: '#8E44AD' },
    { name: 'Completed', value: ss.completed ?? 0, color: '#1E8449' },
    { name: 'Returned', value: ss.returned ?? 0, color: '#C0392B' },
  ].filter(d => d.value > 0);

  const handleDownload = async (report: any) => {
    try {
      const blob = new Blob(
        [`Mock ${report.format.toUpperCase()} content for ${report.filename}\nGenerated: ${report.createdAt}`],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="page-container">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="page-title">{t('reports.subtitle')}</h1>
          <p className="page-subtitle">{t('reports.description')}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-navy border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2.5 rounded-2xl text-[11px] font-display font-bold hover:bg-gray-50 dark:hover:bg-navy-light/50 transition-colors shadow-sm">
            <Calendar className="w-4 h-4" />
            {t('reports.last30Days')}
          </button>
          <button className="flex items-center gap-2 bg-white dark:bg-navy border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2.5 rounded-2xl text-[11px] font-display font-bold hover:bg-gray-50 dark:hover:bg-navy-light/50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            {t('common.filter')}
          </button>
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-navy-dark px-5 py-2.5 rounded-2xl text-[11px] font-display font-bold transition-all shadow-md shadow-gold/20 dark:shadow-none"
          >
            <Download className="w-4 h-4" />
            {t('reports.generate')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-navy rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200"
        >
          <h2 className="font-display font-bold text-[18px] text-navy dark:text-white mb-6">{t('reports.revenueOverview')}</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#A07830' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-navy rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200"
        >
          <h2 className="font-display font-bold text-[18px] text-navy dark:text-white mb-6">{t('reports.byStatus')}</h2>
          <div className="h-[300px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    paddingAngle={4} dataKey="value">
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-body text-[13px] text-gray-400">
                {t('reports.noServiceData')}
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="font-display font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white dark:bg-navy rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200"
      >
        <h2 className="font-display font-bold text-[18px] text-navy dark:text-white mb-6">{t('reports.generatedReports')}</h2>
        <div className="border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-navy-light/50 font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">{t('reports.filename')}</th>
                <th className="px-6 py-4">{t('reports.reportType')}</th>
                <th className="px-6 py-4">{t('reports.format')}</th>
                <th className="px-6 py-4">{t('reports.dateFrom')}</th>
                <th className="px-6 py-4">{t('reports.generatedAt')}</th>
                <th className="px-6 py-4 w-16 text-center">{t('reports.download')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {reportsLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-body text-[13px] text-gray-400">
                    <div className="animate-pulse">{t('common.loading')}</div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-body text-[13px] text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-gray-300" />
                      {t('reports.noReports')}
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report: any, i: number) => (
                  <tr key={report.id}
                    className={`${i % 2 === 0 ? 'bg-white dark:bg-navy' : 'bg-gray-50 dark:bg-navy-light/20'}`}>
                    <td className="px-6 py-4 font-display font-bold text-[13px] text-navy dark:text-slate-200">
                      {report.filename}
                    </td>
                    <td className="px-6 py-4 font-display font-bold text-[13px] text-gray-500 dark:text-slate-400 capitalize">
                      {report.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-navy-light/50 font-display font-bold text-[10px] uppercase text-gray-500 dark:text-slate-400">
                        {report.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-body text-[12px] text-gray-500 dark:text-slate-400">
                      {report.dateFrom} \u2192 {report.dateTo}
                    </td>
                    <td className="px-6 py-4 font-body text-[12px] text-gray-500 dark:text-slate-400">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDownload(report)}
                        className="p-2 text-gold-dark dark:text-gold hover:bg-gold/10 dark:hover:bg-gold/20 rounded-xl transition-colors"
                        title={t('reports.downloadReport')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <GenerateReportModal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} />
    </div>
  );
}
