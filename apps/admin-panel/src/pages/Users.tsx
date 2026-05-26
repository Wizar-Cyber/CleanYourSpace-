import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Mail, DollarSign, Clock, User, Edit2, Search, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../components/Toast';
import { useState } from 'react';
import { CreateUserModal } from '../components/modals/CreateUserModal';
import { EditUserModal } from '../components/modals/EditUserModal';
import { ContractorProfileModal } from '../components/modals/ContractorProfileModal';
import { useTranslation } from 'react-i18next';

export function Users() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.list(1, 100),
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { id: string; isActive: boolean }) =>
      api.users.update(data.id, { isActive: data.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  const users = (data?.data ?? []).filter((u: any) => {
    const matchesSearch = !search ||
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? u.isActive : !u.isActive);
    const matchesContract = !contractFilter || u.contractType === contractFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesContract;
  });

  const roleBadgeColor: Record<string, string> = {
    super_admin: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-100 dark:border-purple-500/20',
    manager: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    supervisor: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
    contractor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    client: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border-sky-100 dark:border-sky-500/20',
  };

  return (
    <div className="page-container">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="page-title">{t('users.title')}</h1>
          <p className="page-subtitle">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-navy-dark px-5 py-3 rounded-2xl text-[11px] font-display font-bold transition-all shadow-md shadow-gold/20 dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          {t('users.createUser')}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('users.search')}
            className="w-full h-11 pl-11 pr-4 font-body text-[13px] font-bold border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold shadow-sm transition-all"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 px-4 font-display font-bold text-[11px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none cursor-pointer">
          <option value="">{t('users.filterRole')}</option>
          <option value="super_admin">Super Admin</option>
          <option value="manager">Manager</option>
          <option value="supervisor">Supervisor</option>
          <option value="contractor">Contractor</option>
          <option value="client">Client</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 px-4 font-display font-bold text-[11px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none cursor-pointer">
          <option value="">{t('users.filterStatus')}</option>
          <option value="active">{t('users.statusActive')}</option>
          <option value="inactive">{t('users.statusInactive')}</option>
        </select>
        <select value={contractFilter} onChange={(e) => setContractFilter(e.target.value)}
          className="h-11 px-4 font-display font-bold text-[11px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none cursor-pointer">
          <option value="">{t('users.filterContract')}</option>
          <option value="w2">{t('users.contractTypeW2')}</option>
          <option value="contractor_1099">{t('users.contractType1099')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center font-body text-[13px] text-gray-400">
            <div className="animate-pulse">{t('common.loading')}</div>
          </div>
        ) : users.length === 0 ? (
          <div className="col-span-full py-12 text-center font-body text-[13px] text-gray-400">
            {t('users.noUsers')}
          </div>
        ) : (
          users.map((user: any, index: number) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col transition-colors duration-200"
            >
              <div className="flex justify-between items-start mb-6">
                <button onClick={() => setDetailUser(detailUser?.id === user.id ? null : user)} className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gold/10 text-gold-dark dark:text-gold border border-gold/10 dark:border-gold/20 flex items-center justify-center text-xl font-display font-black tracking-tight shrink-0">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  {user.role === 'contractor' && (
                    <button
                      onClick={() => setProfileUser(user)}
                      className="text-gray-400 hover:text-gold-dark dark:hover:text-gold p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      title={t('users.contractorProfile')}
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditUser(user)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {detailUser?.id === user.id && (
                <div className="mb-4 p-4 bg-slate-50 dark:bg-navy-light/30 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gold-dark dark:text-gold" />
                    <span className="font-display font-bold text-[11px] text-slate-600 dark:text-slate-400">{t('users.quickStats')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-body">
                    <span className="text-slate-500 dark:text-slate-400">Email:</span>
                    <span className="text-slate-800 dark:text-slate-200 text-right truncate">{user.email}</span>
                    {user.hourlyRate != null && (
                      <>
                        <span className="text-slate-500 dark:text-slate-400">Rate:</span>
                        <span className="text-slate-800 dark:text-slate-200 text-right">${user.hourlyRate}/hr</span>
                      </>
                    )}
                    <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                    <span className="text-slate-800 dark:text-slate-200 text-right">{user.phone || '—'}</span>
                    {user.contractType && (
                      <>
                        <span className="text-slate-500 dark:text-slate-400">Contract:</span>
                        <span className="text-slate-800 dark:text-slate-200 text-right uppercase">{user.contractType === 'w2' ? 'W2' : '1099'}</span>
                      </>
                    )}
                  </div>
                  <button onClick={() => setDetailUser(null)} className="mt-2 text-[9px] font-display font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">{t('users.hide')}</button>
                </div>
              )}

              <div className="mb-6 flex-1">
                <h3 className="font-display font-bold text-[18px] text-navy dark:text-white truncate">{user.firstName} {user.lastName}</h3>
                <p className="font-body text-[11px] text-gray-500 dark:text-slate-400 mt-1 capitalize">{user.role?.replace('_', ' ')}</p>

                <div className="flex flex-col gap-2 mt-4 font-display font-bold text-[11px] text-gray-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.role === 'contractor' && user.hourlyRate != null && (
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3 mt-1">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> {user.hourlyRate}/hr
                      </span>
                      {user.contractType && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gold-dark dark:text-gold" /> {user.contractType === 'w2' ? 'W2' : '1099'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-slate-800">
                <span className={`px-3 py-1 border rounded-full font-display font-bold text-[10px] uppercase tracking-widest ${roleBadgeColor[user.role] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {user.role?.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`font-display font-bold text-[10px] uppercase tracking-widest ${user.isActive ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {user.isActive ? t('users.statusActive') : t('users.statusInactive')}
                  </span>
                  <button
                    onClick={() => toggleMutation.mutate({ id: user.id, isActive: !user.isActive })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out ${user.isActive ? 'bg-navy dark:bg-gold' : 'bg-gray-200 dark:bg-slate-700'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <CreateUserModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      {editUser && (
        <EditUserModal isOpen={!!editUser} onClose={() => setEditUser(null)} user={editUser} />
      )}
      {profileUser && (
        <ContractorProfileModal isOpen={!!profileUser} onClose={() => setProfileUser(null)} userId={profileUser.id} userName={`${profileUser.firstName} ${profileUser.lastName}`} />
      )}
    </div>
  );
}
