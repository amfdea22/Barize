import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import type { CartItem } from './types';

interface CarrinhoPDVProps {
  itens: CartItem[];
  onIncrement: (produtoId: number) => void;
  onDecrement: (produtoId: number) => void;
  onRemove: (produtoId: number) => void;
}

export default function CarrinhoPDV({ itens, onIncrement, onDecrement, onRemove }: CarrinhoPDVProps) {
  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-[var(--color-outline)] text-sm gap-2">
        <ShoppingCart size={28} className="opacity-30" />
        <span>Carrinho vazio</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {itens.map(item => (
        <div key={item.produto.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface-container-high)] rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-medium text-[var(--color-on-surface)] break-words leading-snug">{item.produto.nome}</p>
            <p className="text-label-sm text-[var(--color-on-surface-variant)]">
              R$ {item.produto.preco_venda.toFixed(2)} x {item.quantidade}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onDecrement(item.produto.id)} aria-label={`Diminuir ${item.produto.nome}`}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer">
              <Minus size={16} />
            </button>
            <span className="w-10 text-center text-body-md font-mono text-[var(--color-on-surface)]">{item.quantidade}</span>
            <button onClick={() => onIncrement(item.produto.id)} aria-label={`Aumentar ${item.produto.nome}`}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer">
              <Plus size={16} />
            </button>
          </div>
          <button onClick={() => onRemove(item.produto.id)} aria-label={`Remover ${item.produto.nome}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors cursor-pointer">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
