import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let listeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

function notify(message: string, type: ToastType = 'info') {
  const id = ++toastId;
  toasts = [...toasts, { id, message, type }];
  listeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((l) => l(toasts));
  }, 3000);
}

export const toast = {
  success: (msg: string) => notify(msg, 'success'),
  error: (msg: string) => notify(msg, 'error'),
  info: (msg: string) => notify(msg, 'info'),
};

const ICONS = {
  success: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
  error: <AlertTriangle size={16} className="text-[var(--color-error)] shrink-0" />,
  info: <Info size={16} className="text-[var(--color-primary-container)] shrink-0" />,
};

const BG = {
  success: 'border-emerald-500/30',
  error: 'border-[var(--color-error)]/30',
  info: 'border-[var(--color-primary-container)]/30',
};

export default function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => { listeners = listeners.filter((l) => l !== setItems); };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] space-y-2 max-w-sm">
      {items.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border ${BG[t.type]} shadow-2xl animate-fade-in backdrop-blur-[16px] text-sm text-[var(--color-on-surface)]`}
        >
          {ICONS[t.type]}
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
