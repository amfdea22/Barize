import { useState, useEffect } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import type { AuditLog } from '../types';
import { relatoriosService } from '../services/api';

export default function Relatorios() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAcao, setFilterAcao] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await relatoriosService.auditoria({ acao: filterAcao || undefined });
      setAuditLogs(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterAcao]);

  const acoes = Array.from(new Set(auditLogs.map((l) => l.acao)));

  const columns: Column<AuditLog>[] = [
    { key: 'acao', header: 'Ação', render: (l) => <Badge variant="info">{l.acao}</Badge> },
    { key: 'usuario_nome', header: 'Usuário' },
    { key: 'entidade_tipo', header: 'Entidade', className: 'text-[var(--color-outline)]', render: (l) => l.entidade_tipo || '-' },
    { key: 'entidade_id', header: 'ID', className: 'font-mono', render: (l) => l.entidade_id ?? '-' },
    { key: 'detalhes', header: 'Detalhes', render: (l) => l.detalhes || '-' },
    {
      key: 'created_at',
      header: 'Data',
      className: 'font-mono text-xs text-[var(--color-outline)]',
      render: (l) => new Date(l.created_at).toLocaleString('pt-BR'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">Relatórios</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Auditoria e logs do sistema</p>
        </div>
        <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={load}>Atualizar</Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Filtrar por ação..."
            value={filterAcao}
            onChange={(e) => setFilterAcao(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface-low)] border border-[rgba(255,255,255,0.1)] text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] input-glow"
          />
        </div>
        <div className="flex gap-2 flex-wrap min-w-0">
          <button
            onClick={() => setFilterAcao('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
              !filterAcao ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)] ghost-border hover:bg-[var(--color-surface-high)]'
            }`}
          >
            Todas
          </button>
          {acoes.slice(0, 10).map((acao) => (
            <button
              key={acao}
              onClick={() => setFilterAcao(acao)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                filterAcao === acao ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)] ghost-border hover:bg-[var(--color-surface-high)]'
              }`}
            >
              {acao}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
          Carregando auditoria...
        </div>
      ) : (
        <DataTable columns={columns} data={auditLogs} emptyMessage="Nenhum registro de auditoria encontrado" />
      )}
    </div>
  );
}

