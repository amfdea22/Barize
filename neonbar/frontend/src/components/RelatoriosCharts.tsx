import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ComposedChart,
} from 'recharts';

export interface PontoTendencia {
  rotulo: string;
  receita: number;
  receita_anterior?: number;
}

interface StarRatingProps {
  rating: number;
  max?: number;
}

export function StarRating({ rating, max = 5 }: StarRatingProps) {
  const normalized = Math.max(0, Math.min(max, rating));
  const full = Math.floor(normalized);
  const half = normalized - full >= 0.5;

  return (
    <div className="flex text-[var(--color-secondary)]" aria-label={`Avaliação ${rating.toFixed(1)} de ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const isFull = i < full;
        const isHalf = i === full && half;
        return (
          <span key={i} className="text-[16px] leading-none">
            {isFull ? '★' : isHalf ? '⯨' : '☆'}
          </span>
        );
      })}
    </div>
  );
}

interface TrendLineChartProps {
  data: PontoTendencia[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-[var(--color-outline)] text-sm">
        Sem dados de receita no período
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="gradReceita" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(var(--overlay-rgb),0.06)" vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fill: 'var(--color-outline)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: 'rgba(var(--overlay-rgb),0.08)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--color-outline)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(v: number) => `R$${Math.round(v).toLocaleString('pt-BR')}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface-container-high)',
              border: '1px solid rgba(var(--overlay-rgb),0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--color-on-surface)',
              boxShadow: '0 0 20px rgba(0,218,243,0.1)',
            }}
            formatter={(value, name) => [
              `R$ ${Number(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              name === 'receita' ? 'Receita' : 'Anterior',
            ]}
          />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fill="url(#gradReceita)"
            strokeLinecap="round"
            dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--color-primary)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="receita_anterior"
            stroke="var(--color-secondary)"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TopProdutoItem {
  nome: string;
  quantidade: number;
  pct: number;
}

interface HorizontalBarListProps {
  items: TopProdutoItem[];
}

export function HorizontalBarList({ items }: HorizontalBarListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-[var(--color-outline)] text-sm">
        Sem vendas no período
      </div>
    );
  }

  return (
    <div className="space-y-5 flex-1 min-w-0">
      {items.map((item, i) => (
        <div key={item.nome} className="space-y-1.5 min-w-0">
          <div className="flex justify-between gap-2 text-label-md text-[var(--color-on-surface-variant)]">
            <span className="truncate min-w-0">{item.nome}</span>
            <span className="text-[var(--color-on-surface)] shrink-0 font-mono">{item.quantidade} vendidos</span>
          </div>
          <div className="h-2 w-full bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(item.pct, 2)}%`,
                backgroundColor: 'var(--color-primary)',
                opacity: 1 - i * 0.14,
                boxShadow: i === 0 ? '0 0 8px rgba(0,218,243,0.4)' : undefined,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
