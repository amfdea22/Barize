import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeClasses = {
  sm: 'w-[90vw]',
  md: 'w-[95vw]',
  lg: 'w-[98vw]',
  full: 'w-[calc(100vw-2rem)]',
};

export default function Modal({ open, onClose, title, children, footer, size = 'lg' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[20px]" onClick={onClose} />
      <div className={`relative w-full m-0 sm:m-4 ${sizeClasses[size]} bg-[var(--color-surface-container)] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[95vh] sm:max-h-[85vh]`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(var(--overlay-rgb),0.08)] shrink-0">
            <h2 className="text-base font-bold text-[var(--color-on-surface)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-container-high)] text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5 flex-1 min-h-0">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-[rgba(var(--overlay-rgb),0.08)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
