

interface BarChartProps {
  data: { dia: string; receita: number }[];
  height?: number;
}

export function BarChart({ data, height = 200 }: BarChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[200px] text-[var(--color-outline)] text-sm">Sem dados</div>;
  }
  const max = Math.max(...data.map((d) => d.receita), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.receita / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <span className="text-[10px] text-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
              R${d.receita.toFixed(0)}
            </span>
            <div
              className="w-full rounded-t bg-gradient-to-t from-[var(--color-primary)]/80 to-[var(--color-primary)]/30 hover:from-[var(--color-primary)] hover:to-[var(--color-primary)]/50 transition-all cursor-pointer"
              style={{ height: `${pct}%`, minHeight: pct > 0 ? 4 : 0 }}
            />
            <span className="text-[9px] text-[var(--color-outline)] font-mono truncate w-full text-center">
              {d.dia.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface DonutChartProps {
  data: { forma: string; valor: number; percentual: number }[];
  size?: number;
}

const COLORS = ['#00DAF3', '#FEA800', '#4ADE80', '#F87171', '#A78BFA', '#F472B6', '#34D399'];

export function DonutChart({ data, size = 180 }: DonutChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center" style={{ width: size, height: size }}><span className="text-[var(--color-outline)] text-sm">Sem dados</span></div>;
  }
  const total = data.reduce((s, d) => s + d.valor, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeWidth = size * 0.12;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        {data.map((d, i) => {
          const pct = d.valor / total;
          const len = pct * circ;
          const dash = `${len} ${circ - len}`;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-500"
            />
          );
          offset += len;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-[var(--color-on-surface)] text-xs font-bold">
          R${total.toFixed(0)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-[var(--color-outline)] text-[9px]">
          Total
        </text>
      </svg>
      <div className="flex flex-wrap gap-2 justify-center">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px] text-[var(--color-on-surface-variant)]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {d.forma.replace('_', ' ')} ({d.percentual}%)
          </div>
        ))}
      </div>
    </div>
  );
}

interface CMVGaugeProps {
  value: number;
  interpretation: string;
}

export function CMVGauge({ value, interpretation }: CMVGaugeProps) {
  const pct = Math.min(value, 100);
  const r = 70;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color = value < 25 ? '#4ADE80' : value < 35 ? '#00DAF3' : value < 45 ? '#FEA800' : '#F87171';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="180" height="120" viewBox="0 0 180 120">
        <path
          d={`M 20 100 A ${r} ${r} 0 0 1 160 100`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M 20 100 A ${r} ${r} 0 0 1 160 100`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          className="transition-all duration-700"
        />
        <text x="90" y="85" textAnchor="middle" className="fill-[var(--color-on-surface)] text-2xl font-bold">
          {value.toFixed(1)}%
        </text>
        <text x="90" y="105" textAnchor="middle" className="fill-[var(--color-outline)] text-[11px]">
          CMV
        </text>
      </svg>
      <span
        className={`text-label-sm font-bold px-3 py-1 rounded-full ${
          value < 25
            ? 'bg-green-500/20 text-green-400'
            : value < 35
            ? 'bg-cyan-500/20 text-cyan-400'
            : value < 45
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-red-500/20 text-red-400'
        }`}
      >
        {interpretation}
      </span>
    </div>
  );
}
