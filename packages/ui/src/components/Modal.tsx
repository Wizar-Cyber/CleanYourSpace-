import { useEffect, useCallback, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleTab);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      const first = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const titleId = title ? `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined;

  return (
    <div
      className="fixed inset-0 bg-navy-dark/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-navy-dark rounded-[24px] shadow-modal p-6 mx-4 w-full ${sizeStyles[size]} transition-all duration-200`}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 id={titleId} className="font-display font-bold text-[18px] text-slate-800 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-light/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
