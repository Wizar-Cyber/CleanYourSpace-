import { Calendar as CalendarIcon, ChevronRight, Plus, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { CreateAssignmentModal } from '../components/modals/CreateAssignmentModal';
import { AssignmentDetailModal } from '../components/modals/AssignmentDetailModal';
import { useTranslation } from 'react-i18next';

interface Assignment {
  dayIndex: number;
  timeSlot: number;
  borderCol: string;
  client: string;
  type: string;
  cleaner: string;
  status?: string;
  statusCol?: string;
}

const days = [
  { name: 'Mon', date: '20 May' },
  { name: 'Tue', date: '21 May' },
  { name: 'Wed', date: '22 May' },
  { name: 'Thu', date: '23 May' },
  { name: 'Fri', date: '24 May' },
  { name: 'Sat', date: '25 May' },
  { name: 'Sun', date: '26 May' },
];

const hours = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];

const initialAssignments: Assignment[] = [
  { dayIndex: 0, timeSlot: 0, borderCol: 'border-blue-400', client: 'Penthouse Vista Mar', type: 'Move Out', cleaner: 'Carlos L\u00F3pez', status: 'Pending', statusCol: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' },
  { dayIndex: 1, timeSlot: 1, borderCol: 'border-emerald-500', client: 'Oficinas Centro', type: 'Deep Clean', cleaner: 'Juan P\u00E9rez', status: 'Approved', statusCol: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  { dayIndex: 1, timeSlot: 3, borderCol: 'border-emerald-500', client: 'Oficinas Centro', type: 'Deep Clean', cleaner: 'Mar\u00EDa Garcia' },
  { dayIndex: 2, timeSlot: 2, borderCol: 'border-amber-400', client: 'Colegio San Miguel', type: 'Commercial', cleaner: 'Mar\u00EDa Garcia', status: 'In Progress', statusCol: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  { dayIndex: 4, timeSlot: 0, borderCol: 'border-blue-500', client: 'Oficinas Centro', type: 'Move Out', cleaner: 'Juan P\u00E9rez' },
  { dayIndex: 4, timeSlot: 3, borderCol: 'border-blue-500', client: 'Oficinas Centro', type: 'Move Out', cleaner: 'Juan P\u00E9rez' },
  { dayIndex: 5, timeSlot: 0, borderCol: 'border-emerald-500', client: 'Colegio San Miguel', type: 'Deep Clean', cleaner: 'Juan P\u00E9rez', status: 'Approved', statusCol: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  { dayIndex: 5, timeSlot: 3, borderCol: 'border-rose-500', client: 'Dirontas Centro', type: 'Deep Clean', cleaner: 'Juan P\u00E9rez', status: 'Pending', statusCol: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' },
  { dayIndex: 6, timeSlot: 0, borderCol: 'border-purple-500', client: 'Marsilera Centro', type: 'Move Out', cleaner: 'Carlos L\u00F3pez', status: 'Pending', statusCol: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' },
  { dayIndex: 6, timeSlot: 1, borderCol: 'border-rose-500', client: 'Eenon Centro', type: 'Deep Clean', cleaner: 'Juan P\u00E9rez' },
];

export function Assignments() {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  return (
    <div className="page-container h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="page-title">{t('assignments.title')}</h1>
        <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-navy-dark px-5 py-3 rounded-2xl text-[11px] font-display font-bold transition-all shadow-md shadow-gold/20 dark:shadow-none">
          <Plus className="w-5 h-5" />
          {t('assignments.newAssignment')}
        </button>
      </div>

      <div className="flex gap-4 mb-8 shrink-0 flex-wrap">
        <div className="relative">
          <select className="appearance-none bg-white dark:bg-navy border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-display font-bold text-[13px] rounded-2xl pr-10 pl-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold shadow-sm cursor-pointer w-[180px] transition-colors">
            <option>{t('assignments.filterCleaner')}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="appearance-none bg-white dark:bg-navy border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-display font-bold text-[13px] rounded-2xl pr-10 pl-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold shadow-sm cursor-pointer w-[180px] transition-colors">
            <option>{t('assignments.filterServiceType')}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="appearance-none bg-white dark:bg-navy border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-display font-bold text-[13px] rounded-2xl pr-10 pl-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold shadow-sm cursor-pointer w-[180px] transition-colors">
            <option>{t('assignments.filterStatus')}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 bg-white dark:bg-navy border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-[13px] font-display font-bold text-slate-800 dark:text-white shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-light/50 transition-colors">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span>Week of May 20 - May 26, 2026</span>
          <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-navy border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm flex flex-col overflow-hidden min-h-0 p-2 transition-colors duration-200">
        <div className="flex-1 border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden flex flex-col">
          <div className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-navy-light/50 shrink-0">
            <div className="p-4 flex items-center justify-center border-r border-slate-100 dark:border-slate-800" />
            {days.map((day, idx) => (
              <div key={idx} className="p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                <div className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{day.name}, {day.date}</div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-8 min-h-full">
              <div className="border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-navy-light/50">
                {hours.map((hour, idx) => (
                  <div key={idx} className="h-20 flex items-start justify-center pt-2 border-b border-dashed border-slate-200 dark:border-slate-700 last:border-b-0">
                    <span className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">{hour}</span>
                  </div>
                ))}
              </div>

              {days.map((_, dayIdx) => (
                <div key={dayIdx} className="border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                  {hours.map((_, slotIdx) => {
                    const cellAssignments = initialAssignments.filter(a => a.dayIndex === dayIdx && a.timeSlot === slotIdx);
                    return (
                      <div key={slotIdx} className="h-20 border-b border-dashed border-slate-200 dark:border-slate-700 last:border-b-0 p-1 space-y-1 overflow-hidden">
                        {cellAssignments.map((a, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedAssignment(a)}
                            className={`h-full w-full bg-white dark:bg-navy rounded-lg border-t-2 ${a.borderCol} border border-slate-100 dark:border-slate-800 shadow-sm px-2 py-1 flex flex-col justify-center cursor-pointer hover:shadow-md hover:bg-slate-50 dark:hover:bg-navy-light/50 transition-all`}
                          >
                            <div className="font-display font-bold text-[10px] text-slate-800 dark:text-slate-200 truncate leading-tight">{a.client}</div>
                            <div className="font-display font-bold text-[8px] uppercase tracking-widest text-slate-400 truncate">{a.type}</div>
                            <div className="font-display font-bold text-[8px] text-slate-500 dark:text-slate-400 truncate">{a.cleaner}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CreateAssignmentModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <AssignmentDetailModal isOpen={!!selectedAssignment} onClose={() => setSelectedAssignment(null)} assignment={selectedAssignment} />
    </div>
  );
}
