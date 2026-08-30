import { useNavigate } from 'react-router-dom';
import { moreMenuItems } from '../components/BottomNav';

export default function Mais() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Mais</h1>
        <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
          Todas as funcionalidades
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {moreMenuItems.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.06)] active:scale-[0.97] transition-transform text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-container)]/15 flex items-center justify-center">
                <item.icon size={22} className="text-[var(--color-primary-container)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">{item.label}</p>
                <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5 leading-tight">
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
