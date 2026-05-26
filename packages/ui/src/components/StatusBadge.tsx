import { Badge } from './Badge';

type StatusType = 'pending' | 'accepted' | 'in_progress' | 'pending_verification' | 'completed' | 'returned' | 'cancelled' | 'offline' | 'warning' | 'scheduled' | 'needs_review';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: 'warning' | 'gold' | 'success' | 'error' | 'default' | 'info' }> = {
  pending: { label: 'PENDING', variant: 'warning' },
  accepted: { label: 'ACCEPTED', variant: 'gold' },
  in_progress: { label: 'IN PROGRESS', variant: 'gold' },
  pending_verification: { label: 'REVIEW', variant: 'warning' },
  completed: { label: 'COMPLETED', variant: 'success' },
  returned: { label: 'RETURNED', variant: 'error' },
  cancelled: { label: 'CANCELLED', variant: 'default' },
  scheduled: { label: 'SCHEDULED', variant: 'info' },
  needs_review: { label: 'NEEDS REVIEW', variant: 'warning' },
  offline: { label: 'OFFLINE', variant: 'default' },
  warning: { label: 'WARNING', variant: 'warning' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
