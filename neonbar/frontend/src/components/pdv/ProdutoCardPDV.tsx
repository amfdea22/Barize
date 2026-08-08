import { ShoppingCart, Pencil } from 'lucide-react';
import type { Produto } from '../../types';

interface ProdutoCardPDVProps {
  produto: Produto;
  quantidade: number;
  onAdd: (produto: Produto) => void;
  onEdit: (produto: Produto) => void;
}

export default function ProdutoCardPDV({ produto, quantidade, onAdd, onEdit }: ProdutoCardPDVProps) {
  return (
    <div
      onClick={() => onAdd(produto)}
      className="group relative bg-[var(--color-surface-container)] rounded-xl border border-[rgba(var(--overlay-rgb),0.06)] hover:border-[var(--color-primary)]/40 transition-all cursor-pointer active:scale-[0.96] overflow-hidden"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(produto); }}
        aria-label={`Editar ${produto.nome}`}
        className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:bg-[var(--color-primary)]/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
      >
        <Pencil size={13} />
      </button>

      <div className="aspect-[16/10] bg-[var(--color-surface-container-high)] overflow-hidden">
        {produto.foto_url ? (
          <img src={produto.foto_url} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : produto.imagem ? (
          <div className="w-full h-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">{produto.imagem}</div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart size={32} className="text-[var(--color-on-surface-variant)]/30" />
          </div>
        )}

        {quantidade > 0 && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center text-[13px] font-bold shadow-lg animate-fade-in">
            {Math.min(quantidade, 9)}
          </div>
        )}
      </div>

      <div className="p-3 space-y-1">
        <h3 className="text-body-md font-semibold text-[var(--color-on-surface)] break-words leading-snug">{produto.nome}</h3>
        <p className="text-data-display text-[var(--color-primary)] font-bold">R$ {produto.preco_venda.toFixed(2)}</p>
        {produto.categoria && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            {produto.categoria}
          </span>
        )}
      </div>
    </div>
  );
}
