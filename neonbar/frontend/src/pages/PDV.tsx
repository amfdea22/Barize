import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { pdvService, pedidosService } from '../services/api';
import Button from '../components/Button';
import type { Produto, PedidoCreate } from '../types';

export default function PDV() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cart, setCart] = useState<{ produto: Produto; quantidade: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pdvService.listarProdutos().then(res => {
      setProdutos(res.data);
      setLoading(false);
    });
  }, []);

  const addToCart = (produto: Produto) => {
    setCart(prev => {
      const existing = prev.find(item => item.produto.id === produto.id);
      if (existing) {
        return prev.map(item => item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removeFromCart = (produtoId: number) => {
    setCart(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const finalizeSale = async () => {
    const pedido: PedidoCreate = {
      itens: cart.map(item => ({
        nome: item.produto.nome,
        quantidade: item.quantidade,
        preco: item.produto.preco_venda
      })),
      observacao: 'Venda PDV'
    };
    await pedidosService.criar(pedido);
    setCart([]);
    alert('Venda finalizada!');
  };

  const total = cart.reduce((sum, item) => sum + item.produto.preco_venda * item.quantidade, 0);

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="flex-1 grid grid-cols-3 gap-4">
        {produtos.map(p => (
          <div key={p.id} className="p-4 bg-[var(--color-surface-container)] rounded-lg border border-[rgba(255,255,255,0.1)] cursor-pointer hover:bg-[var(--color-surface-container-high)]" onClick={() => addToCart(p)}>
            <h3 className="font-bold text-[var(--color-on-surface)]">{p.nome}</h3>
            <p className="text-[var(--color-primary)]">R$ {p.preco_venda.toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="w-80 bg-[var(--color-surface-container)] p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-[var(--color-on-surface)]">Carrinho</h2>
        {cart.map(item => (
          <div key={item.produto.id} className="flex justify-between mb-2 text-[var(--color-on-surface)]">
            <span>{item.produto.nome} x{item.quantidade}</span>
            <span>R$ {(item.produto.preco_venda * item.quantidade).toFixed(2)}</span>
            <button onClick={() => removeFromCart(item.produto.id)} className="text-[var(--color-error)]"><Trash2 size={16} /></button>
          </div>
        ))}
        <div className="mt-4 border-t border-[rgba(255,255,255,0.1)] pt-4">
          <p className="text-lg font-bold text-[var(--color-on-surface)]">Total: R$ {total.toFixed(2)}</p>
          <Button className="w-full mt-4" onClick={finalizeSale}>Finalizar Venda</Button>
        </div>
      </div>
    </div>
  );
}
