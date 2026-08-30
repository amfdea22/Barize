import CupomPDV from './CupomPDV';

interface Visualizador80mmProps {
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

export default function Visualizador80mm(props: Visualizador80mmProps) {
  return (
    <div className="relative flex flex-col items-center select-none">
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

      <div className="mt-1 flex w-[86mm] justify-center">
        <div className="h-[3px] w-[80mm] print-serrilha-bottom" aria-hidden="true" />
      </div>
    </div>
  );
}
