import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export default function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'gap-md px-md'} py-sm text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)] hover:backdrop-blur-[4px] transition-all duration-200 rounded-lg cursor-pointer hover:scale-[1.02]`}
      title={isLight ? 'Tema escuro' : 'Tema claro'}
      aria-label={isLight ? 'Ativar tema escuro' : 'Ativar tema claro'}
    >
      {isLight ? <Moon size={20} /> : <Sun size={20} />}
      {!collapsed && (
        <span className="text-label-md uppercase">
          {isLight ? 'Tema Escuro' : 'Tema Claro'}
        </span>
      )}
    </button>
  );
}
