import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizes = {
  sm: 'max-w-2xl',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  full: 'max-w-[90vw] max-h-[90vh]',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const titleId = title ? 'modal-title' : undefined;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[20px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Centering container */}
      <div className="flex min-h-full items-start sm:items-center justify-center p-4">
        {/* Content */}
        <div
          className={`
            relative w-full min-w-0 ${sizes[size]} bg-[var(--color-surface-container)]
            rounded-xl ghost-border shadow-2xl animate-fade-in
            flex flex-col max-h-[90vh]
          `}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)] shrink-0">
              <h2 id={titleId} className="text-lg font-semibold text-[var(--color-on-surface)]">{title}</h2>
              <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-[var(--color-surface-container-high)] text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
        aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <div className="overflow-y-auto p-6 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
