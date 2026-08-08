import { Printer } from 'lucide-react';
import Button from '../Button';
import QRCodePix from './QRCodePix';
import type { CartItem, FormaPagamento } from './types';

interface CupomPDVProps {
  itens: CartItem[];
  subtotal: number;
  desconto: number;
  taxa: number;
  total: number;
  forma_pagamento: FormaPagamento;
  troco: number;
  mesa: string;
  cliente: string;
  vendedor: string;
  data: string;
  observacao: string;
}

const FORMA_LABEL: Record<FormaPagamento, string> = {
  dinheiro: 'DINHEIRO',
  cartao_credito: 'CARTÃO DE CRÉDITO',
  cartao_debito: 'CARTÃO DE DÉBITO',
  pix: 'PIX',
};

const fmtHora = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export default function CupomPDV({
  itens, subtotal, desconto, taxa, total, forma_pagamento, troco,
  mesa, cliente, vendedor, data, observacao,
}: CupomPDVProps) {
  const rowClass = 'flex justify-between gap-2';
  const dashed = 'border-t border-dashed border-black/40 my-1.5';

  return (
    <div className="cupom-80mm w-[80mm] min-w-[80mm] shrink-0 bg-white text-black px-3 py-3 font-mono text-[10px] leading-tight select-all shadow-2xl">
      {/* Cabeçalho */}
      <div className="text-center">
        <div className="text-[15px] font-bold tracking-[0.2em]">BARIZE</div>
        <div className="text-[8px] uppercase tracking-wider text-black/60">Bar &amp; Cozinha</div>
        <div className="text-[8px] text-black/50">CNPJ 00.000.000/0001-00</div>
      </div>
      <div className={dashed} />

      <div className="space-y-0.5 text-[9px] text-black/70">
        <div className={rowClass}><span>DATA</span><span className="font-bold">{fmtHora(data)}</span></div>
        {mesa && <div className={rowClass}><span>MESA</span><span className="font-bold">{mesa}</span></div>}
        {cliente && <div className={rowClass}><span>CLIENTE</span><span className="font-bold break-words max-w-[52mm] text-right">{cliente}</span></div>}
        {vendedor && <div className={rowClass}><span>VENDEDOR</span><span className="font-bold break-words max-w-[52mm] text-right">{vendedor}</span></div>}
      </div>
      <div className={dashed} />

      {/* Itens */}
      <div className="space-y-1">
        {itens.map(item => (
          <div key={item.produto.id} className="space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="font-bold break-words">{item.quantidade}x {item.produto.nome}</span>
            </div>
            <div className="flex justify-between gap-2 text-[9px] text-black/70">
              <span className="pl-3">R$ {item.produto.preco_venda.toFixed(2)}</span>
              <span className="font-bold text-black">R$ {(item.produto.preco_venda * item.quantidade).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className={dashed} />

      {/* Totais */}
      <div className="space-y-0.5">
        <div className={rowClass}><span>SUBTOTAL</span><span className="font-bold">R$ {subtotal.toFixed(2)}</span></div>
        {desconto > 0 && (
          <div className={rowClass}><span>DESCONTO</span><span className="font-bold">- R$ {desconto.toFixed(2)}</span></div>
        )}
        {taxa > 0 && (
          <div className={rowClass}><span>TAXA DE SERVIÇO</span><span className="font-bold">+ R$ {taxa.toFixed(2)}</span></div>
        )}
      </div>
      <div className="border-t-2 border-black my-1" />
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] font-black uppercase">Total</span>
        <span className="text-[13px] font-black">R$ {total.toFixed(2)}</span>
      </div>
      <div className={dashed} />

      {/* Pagamento */}
      <div className="space-y-0.5">
        <div className={rowClass}><span>FORMA</span><span className="font-bold uppercase">{FORMA_LABEL[forma_pagamento]}</span></div>
        {troco > 0 && <div className={rowClass}><span>TROCO</span><span className="font-bold">R$ {troco.toFixed(2)}</span></div>}
      </div>
      <div className={dashed} />

      {/* QR PIX */}
      {forma_pagamento === 'pix' && (
        <QRCodePix valor={total} title="Escaneie para pagar" />
      )}
      {forma_pagamento === 'pix' && <div className={dashed} />}

      {observacao && (
        <>
          <div className="text-[9px] text-black/70">OBS: {observacao}</div>
          <div className={dashed} />
        </>
      )}

      {/* Rodapé */}
      <div className="text-center text-[8px] text-black/50 space-y-0.5">
        <div>Obrigado pela preferência!</div>
        <div>Volte sempre ao BARIZE</div>
      </div>
    </div>
  );
}

export function CupomPrintActions({ onPrint, onClose }: { onPrint: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-3 no-print">
      <Button variant="ghost" className="flex-1" onClick={onClose}>
        Nova Venda
      </Button>
      <Button className="flex-1" onClick={onPrint} icon={<Printer size={16} />}>
        Imprimir Cupom
      </Button>
    </div>
  );
}
