interface Label80mmData {
  nome?: string;
  quantidade?: number | string;
  unidade?: string;
  categoria?: string;
  lote?: string;
  fabricacao?: string;
  validade?: string;
}

const fmtDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('pt-BR');
};

const diffDias = (hoje: Date, validade?: string): number | null => {
  if (!validade) return null;
  const d = new Date(validade);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - hoje.getTime()) / 86400000);
};

const barcodeBackground =
  'repeating-linear-gradient(90deg, #000 0 1px, transparent 1px 2px, #000 2px 3px, transparent 3px 5px, #000 5px 6px, transparent 6px 8px, #000 8px 9px, transparent 9px 10px)';

export default function Label80mm({ nome, quantidade, unidade, categoria, lote, fabricacao, validade }: Label80mmData) {
  const dias = diffDias(new Date(), validade);
  const vencido = dias !== null && dias < 0;
  const proximo = dias !== null && dias >= 0 && dias <= 7;

  let statusText = 'VALIDADE · OK';
  let statusColor = '#16a34a';
  let statusBg = '#f0fdf4';
  if (vencido) {
    statusText = 'VENCIDO';
    statusColor = '#dc2626';
    statusBg = '#fef2f2';
  } else if (proximo) {
    statusText = `VENCE EM ${dias} DIAS`;
    statusColor = '#b45309';
    statusBg = '#fffbeb';
  }

  return (
    <div className="print-80mm w-[80mm] min-w-[80mm] shrink-0 bg-white text-black rounded-sm px-2.5 py-3 font-mono text-[10px] leading-tight select-all shadow-2xl">
      {/* 1. Header marca */}
      <div className="text-center">
        <div className="text-[15px] font-bold tracking-[0.2em]">BARIZE</div>
        <div className="text-[9px] uppercase tracking-wider text-black/60">Controle de Validade</div>
        <div className="text-[9px] uppercase font-bold mt-0.5 text-black/70">Etiqueta de Insumo</div>
      </div>
      <div className="border-t border-dashed border-black/30 my-1.5" />

      {/* 2. Item em destaque */}
      <div className="flex items-baseline gap-1">
        <span className="text-[16px] font-black text-black">{quantidade || 1}x</span>
        <span className="text-[13px] font-bold uppercase truncate">{nome || 'NOME DO INSUMO'}</span>
      </div>
      {(categoria || unidade) && (
        <div className="text-[9px] text-black/60">
          {categoria}{categoria && unidade && ' · '}{unidade}
        </div>
      )}
      <div className="border-t border-dashed border-black/30 my-1.5" />

      {/* 3. Lote / Fab / Val */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span className="text-black/60">LOTE</span>
          <span className="font-bold">{lote || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-black/60">FAB</span>
          <span className="font-bold">{fmtDate(fabricacao)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-black/60">VAL</span>
          <span className="font-bold">{fmtDate(validade)}</span>
        </div>
      </div>
      <div className="border-t border-dashed border-black/30 my-1.5" />

      {/* 4. Destaque validade */}
      <div
        className="border-2 px-2 py-1.5 text-center"
        style={{
          borderColor: statusColor,
          color: statusColor,
          backgroundColor: statusBg,
        }}
      >
        <div className="text-[13px] font-black uppercase tracking-wider">{statusText}</div>
        <div className="text-[9px] font-mono text-black/70">{validade ? fmtDate(validade) : 'Sem data'}</div>
      </div>
      <div className="border-t border-dashed border-black/30 my-1.5" />

      {/* 5. Código de barras */}
      <div className="text-center">
        <div
          className="h-8 w-full"
          style={{ backgroundImage: barcodeBackground }}
          role="img"
          aria-label={`Código de barras do lote ${lote || ''}`}
        />
        <div className="text-[9px] tracking-[0.3em] font-mono text-black/70 mt-0.5">{lote || '000000'}</div>
      </div>

      {/* 6. Rodapé */}
      <div className="border-t border-dashed border-black/30 my-1.5" />
      <div className="text-center text-[8px] text-black/50 space-y-0.5">
        <div>BARIZE · Estoque &amp; Validade</div>
        <div className="text-black/30">Obrigado!</div>
      </div>
    </div>
  );
}
