interface CupomPDVProps {
  itens: Array<{ nome: string; quantidade: number; preco: number; observacao?: string }>;
  subtotal: number;
  desconto: number;
  taxa: number;
  total: number;
  forma_pagamento: string;
  troco: number;
  mesa: string;
  cliente: string;
  vendedor: string;
  data: string;
  observacao: string;
}

const FORMA_LABEL: Record<string, string> = {
  dinheiro: 'DINHEIRO',
  cartao_credito: 'CARTAO DE CREDITO',
  cartao_debito: 'CARTAO DE DEBITO',
  pix: 'PIX',
};

const fmtHora = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const randCupom = () => String(Math.floor(Math.random() * 99999)).padStart(5, '0');

export default function CupomPDV({
  itens, subtotal, desconto, taxa, total, forma_pagamento, troco,
  mesa, cliente, vendedor, data, observacao,
}: CupomPDVProps) {
  const rowClass = 'flex justify-between gap-1';
  const dashed = 'border-t border-dashed border-black/40 my-1';
  const numCupom = randCupom();

  return (
    <div className="cupom-58mm w-[58mm] min-w-[58mm] shrink-0 bg-white text-black px-2 py-2 font-mono text-[8px] leading-tight select-all shadow-lg">
      {/* Cabecalho */}
      <div className="text-center">
        <div className="text-[12px] font-bold tracking-[0.15em]">BARIZE</div>
        <div className="text-[6px] text-black/60">CNPJ: XX.XXX.XXX/XXXX-XX</div>
        <div className="text-[6px] text-black/60">EnderecoRua, 123 - Centro</div>
        <div className="text-[6px] text-black/60">Tel: (XX) XXXX-XXXX</div>
      </div>
      <div className={dashed} />

      {/* CUPOM NAO FISCAL */}
      <div className="text-center my-1">
        <div className="text-[9px] font-black tracking-wider">*** CUPOM NAO FISCAL ***</div>
      </div>
      <div className={dashed} />

      {/* Dados do cupom */}
      <div className="space-y-0.5 text-[7px] text-black/70">
        <div className={rowClass}><span>Cupom:</span><span className="font-bold">{numCupom}</span></div>
        <div className={rowClass}><span>Data:</span><span className="font-bold">{fmtHora(data)}</span></div>
      </div>
      <div className={dashed} />

      {/* Mesa / Cliente / Atendente */}
      <div className="space-y-0.5 text-[7px]">
        <div className={rowClass}><span className="font-bold">Mesa:</span><span className="font-bold">{mesa}</span></div>
        {cliente && <div className={rowClass}><span>Cliente:</span><span className="font-bold break-words max-w-[35mm] text-right">{cliente}</span></div>}
        {vendedor && <div className={rowClass}><span>Atendente:</span><span className="font-bold break-words max-w-[35mm] text-right">{vendedor}</span></div>}
      </div>
      <div className={dashed} />

      {/* Itens */}
      <div className="text-center text-[7px] font-bold my-0.5">ITEM  PRODUTO  VALOR</div>
      <div className="border-t border-black/40 my-0.5" />
      <div className="space-y-0.5">
        {itens.map((item, idx) => (
          <div key={idx} className="space-y-0">
            <div className="flex justify-between gap-1">
              <span className="font-bold break-words">{item.quantidade}x {item.nome}</span>
            </div>
            <div className="flex justify-between gap-1 text-[7px] text-black/70">
              <span className="pl-2">R$ {item.preco.toFixed(2)}</span>
              <span className="font-bold text-black">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
            {item.observacao && (
              <div className="pl-2 text-[6px] text-black/50">Obs: {item.observacao}</div>
            )}
          </div>
        ))}
      </div>
      <div className={dashed} />

      {/* Totais */}
      <div className="space-y-0">
        <div className={rowClass}><span>SUBTOTAL</span><span className="font-bold">R$ {subtotal.toFixed(2)}</span></div>
        {desconto > 0 && (
          <div className={rowClass}><span>DESCONTO</span><span className="font-bold">- R$ {desconto.toFixed(2)}</span></div>
        )}
        {taxa > 0 && (
          <div className={rowClass}><span>TAXA SERVICO</span><span className="font-bold">+ R$ {taxa.toFixed(2)}</span></div>
        )}
      </div>
      <div className="border-t-2 border-black my-1" />
      <div className="flex justify-between items-baseline">
        <span className="text-[9px] font-black uppercase">Total</span>
        <span className="text-[10px] font-black">R$ {total.toFixed(2)}</span>
      </div>
      <div className={dashed} />

      {/* Pagamento */}
      <div className="space-y-0">
        <div className={rowClass}><span>FORMA PGTO</span><span className="font-bold uppercase">{FORMA_LABEL[forma_pagamento] || forma_pagamento}</span></div>
        {troco > 0 && <div className={rowClass}><span>TROCO</span><span className="font-bold">R$ {troco.toFixed(2)}</span></div>}
      </div>
      <div className={dashed} />

      {observacao && (
        <>
          <div className="text-[7px] text-black/70">OBS: {observacao}</div>
          <div className={dashed} />
        </>
      )}

      {/* Rodape */}
      <div className="text-center text-[6px] text-black/50 space-y-0">
        <div>Obrigado pela preferencia!</div>
        <div>Volte sempre ao BARIZE</div>
        <div className="mt-1">{fmtHora(data)}</div>
      </div>
    </div>
  );
}

export function CupomPrintActions({ onPrint, onClose }: { onPrint: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-3">
      <button type="button" onClick={onClose}
        className="flex-1 h-11 rounded-lg border border-[rgba(var(--overlay-rgb),0.15)] text-[var(--color-on-surface-variant)] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer">
        Nova Venda
      </button>
      <button type="button" onClick={onPrint}
        className="flex-1 h-11 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer">
        Imprimir Cupom
      </button>
    </div>
  );
}
