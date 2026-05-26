import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="font-['Poppins'] font-medium text-[9px] uppercase tracking-[0.05em] text-[#444444]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full h-10 px-3 py-2
          font-['Lora'] text-[11px] text-[#1A1A1A]
          bg-white border rounded-[8px]
          placeholder:text-[#CCCCCC]
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:ring-opacity-20 focus:border-[#1B2A4A]
          ${error ? 'border-[#C0392B]' : 'border-[#CCCCCC]'}
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="font-['Lora'] text-[9px] text-[#C0392B]" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="font-['Lora'] text-[9px] text-[#888888]">{helperText}</p>
      )}
    </div>
  );
}
