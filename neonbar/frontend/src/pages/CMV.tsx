import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Button from '../components/Button';
import type { CMVResult } from '../types';
import { cmvService } from '../services/api';

export default function CMV() {
  const [cmv, setCmv] = useState<CMVResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await cmvService.calcular(30);
      setCmv(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao calcular CMV');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cmvPercentual = cmv ? cmv.cmv_percentual : 0;
  const cmvColor = cmvPercentual <= 25 ? 'success' : cmvPercentual <= 40 ? 'warning' : 'error';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">CMV</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Custo da Mercadoria Vendida</p>
        </div>
        <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={load}>Atualizar</Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
          Calculando CMV...
        </div>
      ) : cmv ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title="Custo Total"
              value={`R$ ${cmv.custo_total.toFixed(2)}`}
              icon={<Calculator size={20} />}
              variant="warning"
            />
            <StatsCard
              title="Receita Total"
              value={`R$ ${cmv.receita_total.toFixed(2)}`}
              icon={<DollarSign size={20} />}
              variant="primary"
            />
            <StatsCard
              title="CMV %"
              value={`${cmv.cmv_percentual.toFixed(1)}%`}
              icon={<TrendingUp size={20} />}
              variant={cmvColor}
            />
          </div>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-[var(--color-on-surface)] mb-4">Detalhes do Período</h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[var(--color-outline)] text-xs font-mono tracking-wider uppercase mb-1">Período</p>
                <p className="text-[var(--color-on-surface)]">
                  {new Date(cmv.periodo_inicio).toLocaleDateString('pt-BR')} — {new Date(cmv.periodo_fim).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-outline)] text-xs font-mono tracking-wider uppercase mb-1">Benchmark</p>
                <p className="text-[var(--color-on-surface)]">
                  {cmv.cmv_percentual <= 25 ? '✅ Excelente (≤25%)' : cmv.cmv_percentual <= 40 ? '⚠️ Aceitável (25-40%)' : '🔴 Crítico (>40%)'}
                </p>
              </div>
            </div>
          </Card>

          {/* Gauge visualization */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-[var(--color-on-surface)] mb-4">Indicador CMV</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={
                      cmvColor === 'success' ? 'var(--color-primary-container)' :
                      cmvColor === 'warning' ? 'var(--color-secondary-container)' :
                      'var(--color-error)'
                    }
                    strokeWidth="8"
                    strokeDasharray={`${cmv.cmv_percentual * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold font-mono text-[var(--color-on-surface)]">
                    {cmv.cmv_percentual.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--color-primary-container)]" />
                  <span className="text-xs text-[var(--color-on-surface-variant)]">Meta: ≤25%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--color-secondary-container)]" />
                  <span className="text-xs text-[var(--color-on-surface-variant)]">Atenção: 25-40%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--color-error)]" />
                  <span className="text-xs text-[var(--color-on-surface-variant)]">Crítico: &gt;40%</span>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
          Nenhum dado disponível para cálculo do CMV
        </div>
      )}
    </div>
  );
}
