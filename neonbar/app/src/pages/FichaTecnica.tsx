import { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Wine, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { fichasTecnicasService } from '../services/api';
import type { FichaTecnicaItem } from '../types';

const TAG_COLORS: Record<string, string> = {
  classico: 'text-amber-400',
  signature: 'text-orange-400',
  sem_alcool: 'text-blue-400',
  vegano: 'text-green-400',
  sem_gluten: 'text-yellow-400',
};

export default function FichaTecnica() {
  const [fichas, setFichas] = useState<FichaTecnicaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fichasTecnicasService.listar({})
      .then((res) => setFichas(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFichas([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return fichas;
    const q = search.toLowerCase();
    return fichas.filter(f =>
      f.nome.toLowerCase().includes(q) ||
      f.categoria?.toLowerCase().includes(q) ||
      f.ingredientes.some(i => i.nome.toLowerCase().includes(q))
    );
  }, [fichas, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Ficha Técnica</h1>
        <p className="text-xs text-[var(--color-on-surface-variant)]">
          {fichas.length} receita(s)
        </p>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Buscar receita..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--color-outline)] text-sm">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <BookOpen size={28} className="text-[var(--color-outline)]/30" />
            <span className="text-sm text-[var(--color-outline)]">Nenhuma ficha encontrada</span>
          </div>
        ) : (
          filtered.map((ficha) => {
            const isOpen = expanded === ficha.produto_id;
            return (
              <div
                key={ficha.produto_id}
                className="bg-[var(--color-surface-container)] rounded-xl border border-[rgba(var(--overlay-rgb),0.06)] overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : ficha.produto_id)}
                  className="w-full flex items-center gap-3 p-3 text-left active:bg-[var(--color-surface-container-high)]"
                >
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0 overflow-hidden">
                    {ficha.foto_url ? (
                      <img src={ficha.foto_url} alt={ficha.nome} className="w-full h-full object-cover" />
                    ) : ficha.imagem ? (
                      <span className="text-2xl">{ficha.imagem}</span>
                    ) : (
                      <Wine size={18} className="text-[var(--color-on-surface-variant)]/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">{ficha.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ficha.categoria && (
                        <span className="text-[10px] text-[var(--color-on-surface-variant)]">{ficha.categoria}</span>
                      )}
                      {ficha.teor_alcoolico != null && (
                        <span className="text-[10px] text-[var(--color-on-surface-variant)] flex items-center gap-0.5">
                          <Wine size={8} /> {ficha.teor_alcoolico}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-[var(--color-primary)]">
                      R$ {ficha.preco_venda.toFixed(2)}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-[var(--color-outline)]" /> : <ChevronDown size={16} className="text-[var(--color-outline)]" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-3 border-t border-[rgba(var(--overlay-rgb),0.06)]">
                    {ficha.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {ficha.tags.map(t => (
                          <span key={t} className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${TAG_COLORS[t] || 'text-[var(--color-primary)]'}`}>
                            {t.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {ficha.ingredientes.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono uppercase text-[var(--color-outline)] mb-1">Ingredientes</p>
                        <div className="space-y-1">
                          {ficha.ingredientes.map((ing, i) => (
                            <div key={i} className="flex justify-between text-xs text-[var(--color-on-surface-variant)]">
                              <span>{ing.nome}</span>
                              <span className="font-mono">{ing.quantidade} {ing.unidade_medida}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ficha.preparo.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono uppercase text-[var(--color-outline)] mb-1">Modo de Preparo</p>
                        <div className="space-y-1">
                          {ficha.preparo.map((p, i) => (
                            <div key={i} className="flex gap-2 text-xs text-[var(--color-on-surface-variant)]">
                              <span className="text-[var(--color-primary)] font-bold">{p.ordem}.</span>
                              <span>{p.descricao}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ficha.margem_lucro != null && (
                      <div className="flex items-center gap-4 text-xs text-[var(--color-on-surface-variant)]">
                        <span className="flex items-center gap-1">
                          <Flame size={10} /> {ficha.calorias_estimadas || '–'} kcal
                        </span>
                        <span>Margem: {ficha.margem_lucro.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
