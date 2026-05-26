interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'glass';
  hover?: boolean;
  onClick?: () => void;
}

const paddingSizes = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantStyles = {
  default: 'bg-white border border-gray-100 shadow-soft',
  elevated: 'bg-white border border-gray-100 shadow-card hover:shadow-elevated transition-shadow duration-200',
  glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-soft',
};

export function Card({ children, className = '', padding = 'md', variant = 'default', hover, onClick }: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        ${variantStyles[variant]}
        ${paddingSizes[padding]}
        ${hover ? 'cursor-pointer hover:-translate-y-0.5 transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-display font-bold text-[22px] text-navy ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
