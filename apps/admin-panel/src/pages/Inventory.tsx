import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { api } from '../services/api';
import { Package, Plus, Search, ArrowDown, ArrowUp, AlertTriangle, ClipboardList, Filter } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

export function Inventory() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', category: 'chemical', unitOfMeasure: '', stockMin: 5, currentStock: 0, supplier: '', sku: '' });
  const [txForm, setTxForm] = useState({ supplyItemId: '', type: 'in', quantity: 0, reference: '', notes: '' });

  const { data: suppliesData, isLoading } = useQuery({
    queryKey: ['supplies', category, showLowStock, search],
    queryFn: () => api.inventory.listSupplies({ category: category || undefined, lowStock: showLowStock || undefined, search: search || undefined, limit: 100 }),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.inventory.getLowStock(),
  });

  const { data: txData } = useQuery({
    queryKey: ['inventory-tx', selectedSupply?.id],
    queryFn: () => selectedSupply ? api.inventory.getTransactions({ supplyItemId: selectedSupply.id, limit: 20 }) : null,
    enabled: !!selectedSupply,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.inventory.createSupply(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['supplies'] }); setShowAddForm(false); addToast(t('inventory.supplyCreated'), 'success'); },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  const txMutation = useMutation({
    mutationFn: (data: any) => api.inventory.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-tx'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      setShowTransactionForm(false);
      addToast(t('inventory.transactionRecorded'), 'success');
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  const supplies = suppliesData?.data ?? [];
  const lowStockCount = lowStockData?.length ?? 0;
  const transactions = txData?.data ?? [];

  const handleCreate = () => {
    if (!formData.name || !formData.unitOfMeasure) {
      addToast(t('inventory.validationNameRequired'), 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleTransaction = () => {
    if (!txForm.supplyItemId || txForm.quantity <= 0) {
      addToast(t('inventory.validationQuantityRequired'), 'error');
      return;
    }
    txMutation.mutate({ ...txForm, quantity: Number(txForm.quantity) });
  };

  return (
    <div className="page-container">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="page-title">{t('inventory.title')}</h1>
          <p className="page-subtitle">{t('inventory.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          {lowStockCount > 0 && (
            <button onClick={() => setShowLowStock(!showLowStock)}
              className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-2xl text-[11px] font-display font-bold border border-amber-200 dark:border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
              {lowStockCount} Low
            </button>
          )}
          <button onClick={() => { setShowAddForm(true); setShowTransactionForm(false); }}
            className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-navy-dark px-5 py-3 rounded-2xl text-[11px] font-display font-bold transition-all shadow-md shadow-gold/20">
            <Plus className="w-5 h-5" />
            {t('inventory.addSupply')}
          </button>
          <button onClick={() => { setShowTransactionForm(true); setShowAddForm(false); }}
            className="flex items-center gap-2 bg-navy hover:bg-navy-dark text-white px-5 py-3 rounded-2xl text-[11px] font-display font-bold transition-all shadow-md">
            <ClipboardList className="w-5 h-5" />
            {t('inventory.recordTransaction')}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('inventory.search')} className="w-full h-11 pl-11 pr-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40">
          <option value="">{t('inventory.allCategories')}</option>
          <option value="chemical">{t('inventory.categories.chemicals')}</option>
          <option value="tool">{t('inventory.categories.tools')}</option>
          <option value="ppe">{t('inventory.categories.ppe')}</option>
          <option value="paper">{t('inventory.categories.paper')}</option>
          <option value="bag">{t('inventory.categories.bags')}</option>
          <option value="other">{t('inventory.categories.other')}</option>
        </select>
      </div>

      {/* Add Supply Form */}
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800 mb-8">
          <h2 className="font-display font-bold text-[15px] text-navy dark:text-white mb-4">{t('inventory.newSupply')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <input placeholder={t('inventory.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40">
              <option value="chemical">{t('inventory.categories.chemical')}</option>
              <option value="tool">{t('inventory.categories.tool')}</option>
              <option value="ppe">{t('inventory.categories.ppe')}</option>
              <option value="paper">{t('inventory.categories.paper')}</option>
              <option value="bag">{t('inventory.categories.bag')}</option>
              <option value="other">{t('inventory.categories.other')}</option>
            </select>
            <input placeholder={t('inventory.unitOfMeasure')} value={formData.unitOfMeasure} onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <input type="number" placeholder={t('inventory.stockMin')} value={formData.stockMin} onChange={(e) => setFormData({ ...formData, stockMin: Number(e.target.value) })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <input type="number" placeholder={t('inventory.initialStock')} value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <input placeholder={t('inventory.supplier')} value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} className="bg-gold hover:bg-gold-dark text-navy-dark px-6 py-3 rounded-2xl text-[11px] font-display font-bold transition-all">{t('inventory.saveSupply')}</button>
            <button onClick={() => setShowAddForm(false)} className="px-6 py-3 rounded-2xl text-[11px] font-display font-bold text-gray-400 hover:text-gray-600 border border-gray-200 dark:border-slate-700">{t('common.cancel')}</button>
          </div>
        </motion.div>
      )}

      {/* Transaction Form */}
      {showTransactionForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800 mb-8">
          <h2 className="font-display font-bold text-[15px] text-navy dark:text-white mb-4">{t('inventory.transaction.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
            <select value={txForm.supplyItemId} onChange={(e) => setTxForm({ ...txForm, supplyItemId: e.target.value })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40">
              <option value="">{t('inventory.transaction.selectSupply')}</option>
              {supplies.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.currentStock} {s.unitOfMeasure})</option>
              ))}
            </select>
            <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40">
              <option value="in">{t('inventory.transaction.stockIn')}</option>
              <option value="out">{t('inventory.transaction.stockOut')}</option>
              <option value="adjustment">{t('inventory.transaction.adjustment')}</option>
            </select>
            <input type="number" step="0.01" placeholder={t('inventory.transaction.quantity')} value={txForm.quantity || ''} onChange={(e) => setTxForm({ ...txForm, quantity: Number(e.target.value) })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <input placeholder={t('inventory.transaction.reference')} value={txForm.reference} onChange={(e) => setTxForm({ ...txForm, reference: e.target.value })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <input placeholder={t('inventory.transaction.notes')} value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
              className="h-11 px-4 font-body text-[13px] border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleTransaction} className="bg-gold hover:bg-gold-dark text-navy-dark px-6 py-3 rounded-2xl text-[11px] font-display font-bold transition-all">{t('inventory.transaction.submit')}</button>
            <button onClick={() => setShowTransactionForm(false)} className="px-6 py-3 rounded-2xl text-[11px] font-display font-bold text-gray-400 hover:text-gray-600 border border-gray-200 dark:border-slate-700">{t('common.cancel')}</button>
          </div>
        </motion.div>
      )}

      {/* Supply Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-[13px] text-gray-400 animate-pulse">{t('common.loading')}</div>
      ) : supplies.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-gray-400">{t('inventory.noSupplies')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {supplies.map((item: any, i: number) => {
            const isLow = Number(item.currentStock) <= item.stockMin;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`bg-white dark:bg-navy rounded-[32px] p-6 shadow-sm border transition-all cursor-pointer hover:shadow-md ${
                  isLow ? 'border-amber-200 dark:border-amber-500/30' : 'border-gray-100 dark:border-slate-800'
                }`}
                onClick={() => setSelectedSupply(selectedSupply?.id === item.id ? null : item)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-gold-dark dark:text-gold" />
                  </div>
                  {isLow && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
                </div>
                <h3 className="font-display font-bold text-[16px] text-navy dark:text-white mb-1 truncate">{item.name}</h3>
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-3">{item.category} \u00B7 {item.sku || t('inventory.noSku')}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-body text-[10px] text-gray-400">{t('inventory.currentStock')}</p>
                    <p className={`font-display font-bold text-[22px] ${isLow ? 'text-red-500 dark:text-red-400' : 'text-navy dark:text-white'}`}>
                      {item.currentStock}
                      <span className="text-[11px] text-gray-400 font-body ml-1">{item.unitOfMeasure}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-[9px] text-gray-400">Min: {item.stockMin}</p>
                    {item.supplier && <p className="font-body text-[9px] text-gray-400">{item.supplier}</p>}
                  </div>
                </div>
                {selectedSupply?.id === item.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <p className="font-display font-bold text-[11px] text-navy dark:text-white mb-2">{t('inventory.recentTransactions')}</p>
                    {transactions.length === 0 ? (
                      <p className="text-[10px] text-gray-400">{t('inventory.noTransactions')}</p>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {transactions.map((tx: any) => (
                          <div key={tx.id} className="flex items-center justify-between text-[10px] font-body py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-navy-light/30">
                            <div className="flex items-center gap-1.5">
                              {tx.type === 'in' ? <ArrowDown className="w-3 h-3 text-emerald-500" /> : tx.type === 'out' ? <ArrowUp className="w-3 h-3 text-red-500" /> : <Filter className="w-3 h-3 text-blue-500" />}
                              <span className="capitalize">{tx.type}</span>
                            </div>
                            <span className="font-bold">{tx.quantity} {item.unitOfMeasure}</span>
                            <span className="text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
