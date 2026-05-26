interface SyncIndicatorProps {
  status: 'syncing' | 'offline' | 'pending' | 'completed' | 'error';
  pendingCount?: number;
}

const statusStyles = {
  syncing: { dot: 'bg-[#1A5276]', text: 'text-[#1A5276]', label: 'Syncing...' },
  offline: { dot: 'bg-[#444444]', text: 'text-[#444444]', label: 'Offline' },
  pending: { dot: 'bg-[#B7770D]', text: 'text-[#B7770D]', label: 'Pending sync' },
  completed: { dot: 'bg-[#1E8449]', text: 'text-[#1E8449]', label: 'All changes saved' },
  error: { dot: 'bg-[#C0392B]', text: 'text-[#C0392B]', label: 'Sync failed' },
};

export function SyncIndicator({ status, pendingCount }: SyncIndicatorProps) {
  const style = statusStyles[status];

  return (
    <div className={`inline-flex items-center gap-2 font-['Poppins'] text-[9px] ${style.text}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot} ${status === 'syncing' ? 'animate-pulse' : ''}`} />
      <span>{style.label}</span>
      {pendingCount !== undefined && pendingCount > 0 && (
        <span className="bg-[#F2F2F2] px-1.5 py-0.5 rounded-[4px] text-[#888888]">
          {pendingCount}
        </span>
      )}
    </div>
  );
}
