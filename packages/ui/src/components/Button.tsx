import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline-gold' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-light active:bg-navy-dark shadow-soft hover:shadow-card',
  secondary: 'border border-navy text-navy bg-transparent hover:bg-offwhite active:bg-gray-100',
  'outline-gold': 'border border-gold text-gold-dark bg-transparent hover:bg-gold/10 active:bg-gold/20',
  destructive: 'bg-error text-white hover:bg-[#E74C3C] active:bg-[#A93226] shadow-soft',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[9px] rounded-lg',
  md: 'px-5 py-2.5 text-[11px] rounded-xl',
  lg: 'px-7 py-3 text-[13px] rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-display font-medium
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="w-4 h-4 shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
