interface BadgeProps {
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  default: 'bg-[#F2F2F2] text-[#444444]',
  gold: 'bg-[#C9A84C] text-white',
  success: 'bg-[#1E8449] text-white',
  warning: 'bg-[#B7770D] text-white',
  error: 'bg-[#C0392B] text-white',
  info: 'bg-[#1A5276] text-white',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        font-['Poppins'] font-medium text-[9px] uppercase tracking-[0.05em]
        px-2 py-0.5 rounded-[9999px]
        ${badgeVariants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
