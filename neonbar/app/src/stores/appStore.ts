import { create } from 'zustand';

export interface Item {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
  categoria?: string;
}

export interface Comanda {
  id: number;
  mesa: string;
  cliente?: string;
  status: 'Aberta' | 'Preparando' | 'Pronta' | 'Fechada';
  itens: Item[];
  created_at: number;
  total: number;
}

interface AppState {
  comandas: Comanda[];
  itensCardapio: Item[];
  mesaAtual: string | null;
  setComandas: (c: Comanda[]) => void;
  addComanda: (c: Comanda) => void;
  updateComanda: (id: number, data: Partial<Comanda>) => void;
  removeComanda: (id: number) => void;
  setItensCardapio: (i: Item[]) => void;
  setMesaAtual: (m: string | null) => void;
  connected: boolean;
  setConnected: (c: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  comandas: [],
  itensCardapio: [],
  mesaAtual: null,
  connected: false,
  setComandas: (comandas) => set({ comandas }),
  addComanda: (c) => set((s) => ({ comandas: [...s.comandas, c] })),
  updateComanda: (id, data) =>
    set((s) => ({
      comandas: s.comandas.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  removeComanda: (id) =>
    set((s) => ({ comandas: s.comandas.filter((c) => c.id !== id) })),
  setItensCardapio: (itensCardapio) => set({ itensCardapio }),
  setMesaAtual: (mesaAtual) => set({ mesaAtual }),
  setConnected: (connected) => set({ connected }),
}));
