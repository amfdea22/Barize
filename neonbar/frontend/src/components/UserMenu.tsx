import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

interface UserMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

export default function UserMenu({ open, onClose, anchorRef }: UserMenuProps) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-4 top-16 z-50 bg-[var(--color-surface)] border border-[var(--color-outline)]/20 rounded-xl shadow-xl min-w-[180px] overflow-hidden"
    >
      <div className="p-3 border-b border-[var(--color-outline)]/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
            <User size={16} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-on-surface)]">Admin</p>
            <p className="text-xs text-[var(--color-on-surface-variant)]">admin@barize.com</p>
          </div>
        </div>
      </div>
      <div className="p-1">
        <button
          onClick={() => { navigate('/configuracoes'); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] rounded-lg"
        >
          <User size={16} />
          Perfil
        </button>
        <button
          onClick={() => { localStorage.removeItem('token'); navigate('/login'); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );
}
