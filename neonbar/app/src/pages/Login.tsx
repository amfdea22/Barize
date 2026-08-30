import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/api';
import { toast } from '../components/Toast';

function BarizeLogo() {
  return (
    <div className="relative mb-3 select-none flex justify-center">
      <img
        src="/barize-logo.png"
        alt="BARIZE"
        className="w-[120px] h-auto"
      />
    </div>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSolicitar, setShowSolicitar] = useState(false);
  const [showEsqueci, setShowEsqueci] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('barize_token');
    if (token) navigate('/', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !senha.trim()) {
      setError('Preencha usuario e senha');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(username.trim(), senha.trim());
      const token = res.data?.access_token || res.data?.token;
      const usuario = res.data?.usuario;
      if (token) {
        localStorage.setItem('barize_token', token);
        if (usuario) localStorage.setItem('barize_usuario', JSON.stringify(usuario));
        toast.success('Login realizado com sucesso!');
        navigate('/', { replace: true });
      } else {
        setError('Resposta invalida do servidor');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Erro ao conectar ao servidor';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center px-6 py-6 text-[var(--color-on-surface)] selection:bg-[var(--color-primary-container)] selection:text-[var(--color-on-primary-container)] relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
      <BarizeLogo />

      <h1 className="text-xl font-bold text-center text-[var(--color-on-surface)] mb-1">
        Bem-vindo ao Barize
      </h1>
      <p className="text-xs text-center text-[var(--color-on-surface-variant)] mb-6">
        Gestao de Alta Coquetelaria
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="font-mono text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider ml-1" htmlFor="username">E-mail ou Usuario</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] group-focus-within:text-[var(--color-primary-container)] transition-colors pointer-events-none">
              <User size={20} />
            </span>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Seu acesso..." autoFocus autoComplete="username" required
              className="w-full h-11 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-lg pl-12 pr-4 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-b-2 focus:border-b-[var(--color-primary-container)] transition-all" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider ml-1" htmlFor="password">Senha</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] group-focus-within:text-[var(--color-primary-container)] transition-colors pointer-events-none">
              <Lock size={20} />
            </span>
            <input id="password" type={showPassword ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" autoComplete="current-password" required
              className="w-full h-11 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-lg pl-12 pr-12 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-b-2 focus:border-b-[var(--color-primary-container)] transition-all" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer" aria-label="Toggle password visibility">
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>

        <button type="button" onClick={() => setShowEsqueci(true)} className="text-sm text-[var(--color-primary-container)] hover:text-[var(--color-primary)] transition-colors cursor-pointer inline-block">
          Esqueci minha senha
        </button>

        <button type="submit" disabled={loading}
          className="w-full h-11 bg-[var(--color-primary-container)] text-black font-bold text-sm rounded-lg flex items-center justify-center hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          style={{ boxShadow: '0 0 20px rgba(0, 229, 255, 0.4), 0 0 40px rgba(0, 229, 255, 0.15)' }}>
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <span className="text-sm text-[var(--color-on-surface-variant)]">Primeiro turno?</span>
        <br />
        <button type="button" onClick={() => setShowSolicitar(true)} className="text-sm text-[var(--color-primary-container)] hover:text-[var(--color-primary)] border-b border-transparent hover:border-[var(--color-primary)] transition-all cursor-pointer">
          Solicitar acesso
        </button>
      </div>

      {showSolicitar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSolicitar(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[var(--color-surface-container)] rounded-xl border border-[rgba(var(--overlay-rgb),0.1)] p-6 w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--color-on-surface)] mb-2">Solicitar Acesso</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">Entre em contato com o administrador do sistema para solicitar seu acesso.</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
                <span className="font-medium text-[var(--color-on-surface)]">E-mail:</span>
                <span>admin@barize.com.br</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
                <span className="font-medium text-[var(--color-on-surface)]">WhatsApp:</span>
                <span>(11) 99999-9999</span>
              </div>
            </div>
            <button type="button" onClick={() => setShowSolicitar(false)} className="mt-6 w-full h-10 bg-[var(--color-primary-container)] text-black font-bold text-sm rounded-lg hover:brightness-110 transition-all cursor-pointer">Entendido</button>
          </div>
        </div>
      )}

      {showEsqueci && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEsqueci(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[var(--color-surface-container)] rounded-xl border border-[rgba(var(--overlay-rgb),0.1)] p-6 w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--color-on-surface)] mb-2">Esqueci Minha Senha</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">Entre em contato com o administrador para redefinir sua senha.</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
                <span className="font-medium text-[var(--color-on-surface)]">E-mail:</span>
                <span>admin@barize.com.br</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
                <span className="font-medium text-[var(--color-on-surface)]">WhatsApp:</span>
                <span>(11) 99999-9999</span>
              </div>
            </div>
            <button type="button" onClick={() => setShowEsqueci(false)} className="mt-6 w-full h-10 bg-[var(--color-primary-container)] text-black font-bold text-sm rounded-lg hover:brightness-110 transition-all cursor-pointer">Entendido</button>
          </div>
        </div>
      )}

      <footer className="mt-auto pt-4 w-full text-center">
        <p className="font-mono text-xs text-[var(--color-outline-variant)]">&copy; 2024 Barize. Velocity Dark.</p>
      </footer>
    </div>
  );
}
