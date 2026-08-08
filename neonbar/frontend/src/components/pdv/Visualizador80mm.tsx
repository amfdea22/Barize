import CupomPDV from '../pdv/CupomPDV';
import type { CartItem, FormaPagamento } from '../pdv/types';

interface Visualizador80mmProps {
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

/**
 * Visualizador de impressão 80mm (TC-044).
 * Container com serrilhado de rasgo nas laterais, tipografia monoespaçada
 * e QR PIX embutido — reutiliza o CupomPDV. Serve de preview fiel do cupom
 * térmico em tela.
 */
export default function Visualizador80mm(props: Visualizador80mmProps) {
  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Serrilhado lateral (rasgo de bobina térmica) */}
      <div className="flex w-[86mm] justify-between">
        <div className="relative w-[3mm] self-stretch">
          <div className="absolute inset-y-0 -left-[1mm] w-[5mm] print-serrilha" aria-hidden="true" />
        </div>
        <div className="relative w-[3mm] self-stretch">
          <div className="absolute inset-y-0 -right-[1mm] w-[5mm] print-serrilha" aria-hidden="true" />
        </div>
      </div>

      <div className="shadow-2xl">
        <CupomPDV {...props} />
      </div>

      {/* Serrilhado inferior (rasgo) */}
      <div className="mt-1 flex w-[86mm] justify-center">
        <div className="h-[3px] w-[80mm] print-serrilha-bottom" aria-hidden="true" />
      </div>
    </div>
  );
}
