import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Store,
  Clock,
  Users,
  Settings,
  LogOut,
  Camera,
  Save,
  Phone,
  Mail,
  MapPin,
  Palette,
  Bell,
  Shield,
  Database,
  Printer,
  ChevronRight,
  Edit3,
} from 'lucide-react';

interface UserMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLDivElement>;
}

interface Estabelecimento {
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  horarioAbertura: string;
  horarioFechamento: string;
  logo: string | null;
}

export default function UserMenu({ open, onClose, anchorRef }: UserMenuProps) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editando, setEditando] = useState(false);
  const [estabelecimento, setEstabelecimento] = useState<Estabelecimento>({
    nome: 'Bar do Seu Zé',
    endereco: 'Rua Principal, 123 - Centro',
    telefone: '(11) 99999-9999',
    email: 'contato@bardoze.com.br',
    horarioAbertura: '16:00',
    horarioFechamento: '02:00',
    logo: null,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEstabelecimento({ ...estabelecimento, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed top-16 right-4 w-72 bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-outline)] z-50 animate-fade-in overflow-hidden"
    >
      <div className="relative p-3 bg-gradient-to-r from-[#004f58] to-[#00363d]">
        <div className="flex items-center gap-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/25 transition-all group overflow-hidden"
          >
            {estabelecimento.logo ? (
              <img src={estabelecimento.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Camera size={18} className="text-white/70 group-hover:text-white transition-colors" />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm truncate">{estabelecimento.nome}</div>
            <div className="text-white/70 text-[10px] flex items-center gap-1 truncate">
              <MapPin size={10} />
              {estabelecimento.endereco}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      </div>

      <div className="p-2 space-y-1">
        <button
          onClick={() => setEditando(!editando)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#004f58]/20 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-container)]/20 flex items-center justify-center">
            <Store size={16} className="text-[var(--color-primary-container)]" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium text-[var(--color-on-surface)]">Estabelecimento</div>
            <div className="text-[10px] text-[var(--color-on-surface-variant)]">{estabelecimento.nome}</div>
          </div>
          <ChevronRight size={14} className="text-[var(--color-on-surface-variant)]" />
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#004f58]/20 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
            <Settings size={16} className="text-amber-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium text-[var(--color-on-surface)]">Configurações</div>
            <div className="text-[10px] text-[var(--color-on-surface-variant)]">Preferências do sistema</div>
          </div>
          <ChevronRight size={14} className="text-[var(--color-on-surface-variant)]" />
        </button>

        <button
          onClick={() => navigate('/equipe')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#004f58]/20 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center">
            <Users size={16} className="text-emerald-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium text-[var(--color-on-surface)]">Equipe</div>
            <div className="text-[10px] text-[var(--color-on-surface-variant)]">Gerenciar funcionários</div>
          </div>
          <ChevronRight size={14} className="text-[var(--color-on-surface-variant)]" />
        </button>

        <button
          onClick={() => navigate('/impressoras')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#004f58]/20 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-400/20 flex items-center justify-center">
            <Printer size={16} className="text-purple-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium text-[var(--color-on-surface)]">Impressoras</div>
            <div className="text-[10px] text-[var(--color-on-surface-variant)]">Configurar impressão</div>
          </div>
          <ChevronRight size={14} className="text-[var(--color-on-surface-variant)]" />
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#004f58]/20 transition-all">
          <div className="w-8 h-8 rounded-lg bg-pink-400/20 flex items-center justify-center">
            <Bell size={16} className="text-pink-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium text-[var(--color-on-surface)]">Notificações</div>
            <div className="text-[10px] text-[var(--color-on-surface-variant)]">Alertas e avisos</div>
          </div>
          <ChevronRight size={14} className="text-[var(--color-on-surface-variant)]" />
        </button>
      </div>

      <div className="p-2 border-t border-[var(--color-outline)]">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#004f58]/20 transition-all">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-on-surface-variant)]/20 flex items-center justify-center">
            <Database size={16} className="text-[var(--color-on-surface-variant)]" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium text-[var(--color-on-surface)]">Backup</div>
            <div className="text-[10px] text-[var(--color-on-surface-variant)]">Exportar dados</div>
          </div>
          <ChevronRight size={14} className="text-[var(--color-on-surface-variant)]" />
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('barize_token');
            navigate('/login');
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-error-container)]/20 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-error)]/20 flex items-center justify-center">
            <LogOut size={16} className="text-[var(--color-error)]" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium text-[var(--color-error)]">Sair do Sistema</div>
          </div>
        </button>
      </div>

      {editando && (
        <div className="p-3 border-t border-[var(--color-outline)] bg-[var(--color-surface-container)]">
          <h3 className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">Editar Dados</h3>
          
          <div className="space-y-2">
            <input
              type="text"
              value={estabelecimento.nome}
              onChange={(e) => setEstabelecimento({ ...estabelecimento, nome: e.target.value })}
              placeholder="Nome do estabelecimento"
              className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-xs focus:outline-none focus:border-[var(--color-primary-container)]"
            />
            <input
              type="text"
              value={estabelecimento.endereco}
              onChange={(e) => setEstabelecimento({ ...estabelecimento, endereco: e.target.value })}
              placeholder="Endereço"
              className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-xs focus:outline-none focus:border-[var(--color-primary-container)]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={estabelecimento.telefone}
                onChange={(e) => setEstabelecimento({ ...estabelecimento, telefone: e.target.value })}
                placeholder="Telefone"
                className="px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-xs focus:outline-none focus:border-[var(--color-primary-container)]"
              />
              <input
                type="email"
                value={estabelecimento.email}
                onChange={(e) => setEstabelecimento({ ...estabelecimento, email: e.target.value })}
                placeholder="Email"
                className="px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-xs focus:outline-none focus:border-[var(--color-primary-container)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={estabelecimento.horarioAbertura}
                onChange={(e) => setEstabelecimento({ ...estabelecimento, horarioAbertura: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-xs focus:outline-none focus:border-[var(--color-primary-container)]"
              />
              <input
                type="time"
                value={estabelecimento.horarioFechamento}
                onChange={(e) => setEstabelecimento({ ...estabelecimento, horarioFechamento: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-xs focus:outline-none focus:border-[var(--color-primary-container)]"
              />
            </div>
            <button
              onClick={() => setEditando(false)}
              className="w-full py-2 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-medium text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
            >
              <Save size={14} />
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
