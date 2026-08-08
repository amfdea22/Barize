import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Eye, EyeOff, HelpCircle, LogIn, Check, AlertCircle, Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !senha.trim()) {
      setError('Preencha usuário e senha');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username, senha);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao conectar ao servidor';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-3 h-12 bg-surface/80 backdrop-blur-md">
        <span className="text-headline-lg-mobile tracking-tight text-primary-fixed-dim">
          BARIZE Pro
        </span>
        <div className="flex items-center gap-sm">
          <div className="w-8">
            <ThemeToggle collapsed />
          </div>
          <button type="button" className="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 cursor-pointer" aria-label="Ajuda">
            <HelpCircle size={20} />
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row pt-12">
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 min-w-0 relative bg-surface-container-lowest overflow-hidden">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-background/20 to-background" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/uploads/login_bg.jpg')" }} />
          <div className="absolute bottom-xl left-xl right-xl z-20">
            <div className="inline-flex items-center gap-sm bg-primary/10 border border-primary/20 backdrop-blur-md px-md py-xs rounded-full mb-md">
              <span className="w-2 h-2 bg-primary-fixed-dim rounded-full animate-pulse" />
              <span className="text-label-md text-primary-fixed-dim uppercase tracking-widest">Sistema Operacional</span>
            </div>
            <h2 className="text-headline-lg text-on-surface mb-sm">Maximize seu fluxo.</h2>
            <p className="text-body-lg text-on-surface-variant">A plataforma líder da indústria para operações de bebidas de alta velocidade.</p>
          </div>
        </div>

        <div className="flex-grow min-w-0 flex items-center justify-center p-lg md:p-xl lg:w-2/5 bg-background relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="w-full z-10">
            <div className="mb-xl text-center md:text-left">
              <h1 className="text-headline-lg-mobile text-on-surface mb-xs">Bem-vindo, Capitão.</h1>
              <p className="text-body-md text-on-surface-variant">Acesso seguro ao terminal de operações.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-lg" noValidate>
              {error && (
                <div className="flex items-center gap-sm px-md py-sm rounded bg-error/10 border border-error/30 text-body-md text-error" role="alert" aria-live="polite">
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-xs">
                <label className="text-label-md text-on-surface-variant ml-xs" htmlFor="identity">IDENTIDADE DO OPERADOR</label>
                <div className="relative group neon-border-cyan rounded transition-all duration-300">
                  <input id="identity" type="text" value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="E-mail ou nome de usuário" autoFocus autoComplete="username"
                    className="w-full h-12 bg-surface-container-low border border-outline-variant focus:border-primary-fixed-dim focus:ring-0 rounded px-md text-body-md text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all" />
                  <span className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary-fixed-dim transition-colors pointer-events-none">
                    <User size={20} />
                  </span>
                </div>
              </div>

              <div className="space-y-xs">
                <div className="flex justify-between items-center px-xs">
                  <label className="text-label-md text-on-surface-variant" htmlFor="password">SENHA / PIN SEGURO</label>
                  <a className="text-label-md text-secondary hover:text-secondary-fixed-dim transition-colors cursor-pointer" href="#" tabIndex={-1}>Esqueceu a senha?</a>
                </div>
                <div className="relative group neon-border-cyan rounded transition-all duration-300">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    className="w-full h-12 bg-surface-container-low border border-outline-variant focus:border-primary-fixed-dim focus:ring-0 rounded px-md text-body-md text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-md py-sm">
                <label className="flex items-center gap-md cursor-pointer group">
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                      className="peer absolute opacity-0 w-full h-full cursor-pointer" />
                    <div className="w-5 h-5 border-2 border-outline-variant rounded-sm bg-surface peer-checked:bg-primary-fixed-dim peer-checked:border-primary-fixed-dim transition-all" />
                    <Check size={16} className="text-surface absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                  </div>
                  <span className="text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Lembrar de mim</span>
                </label>
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-12 bg-primary-fixed-dim text-surface text-headline-md rounded hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-60 disabled:cursor-not-allowed neon-glow-cyan">
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Conectando...</>
                ) : (
                  <>Entrar <LogIn size={20} /></>
                )}
              </button>
            </form>

            <div className="mt-xl pt-xl border-t border-outline-variant/10 text-center flex flex-col items-center gap-sm">
              <div className="flex gap-lg">
                <a className="text-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">Suporte</a>
                <a className="text-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">Segurança</a>
                <a className="text-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">Privacidade</a>
              </div>
              <span className="text-label-md text-on-surface-variant opacity-50 uppercase tracking-tighter">&copy; 2026 BARIZE. Sistemas operacionais.</span>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-[100]"
        style={{ backgroundImage: "url('/uploads/carbon-fibre.png')" }} />
    </div>
  );
}
