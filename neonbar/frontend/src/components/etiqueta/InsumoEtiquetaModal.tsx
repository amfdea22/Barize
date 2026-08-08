import { useState, useEffect } from 'react';
import { Tag, Package, Printer } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Label80mm from './Label80mm';

export interface EtiquetaForm {
  nome: string;
  quantidade: number | string;
  unidade: string;
  categoria: string;
  lote: string;
  fabricacao: string;
  validade: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Partial<EtiquetaForm>;
}

const emptyForm: EtiquetaForm = {
  nome: '',
  quantidade: 1,
  unidade: '',
  categoria: '',
  lote: '',
  fabricacao: '',
  validade: '',
};

export default function InsumoEtiquetaModal({ open, onClose, initial }: Props) {
  const [form, setForm] = useState<EtiquetaForm>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, ...initial });
    }
  }, [open, initial]);

  const set = <K extends keyof EtiquetaForm>(key: K, value: EtiquetaForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal open={open} onClose={onClose} title="Nova Etiqueta de Insumo" size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Form */}
        <div className="space-y-md">
          <Input
            label="Nome do insumo"
            icon={<Tag size={18} />}
            placeholder="Ex: Cerveja Pilsen 350ml"
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-md">
            <Input
              label="Quantidade"
              type="number"
              min={1}
              value={form.quantidade}
              onChange={(e) => set('quantidade', Number(e.target.value))}
            />
            <Input
              label="Unidade"
              placeholder="Un / kg / ml"
              value={form.unidade}
              onChange={(e) => set('unidade', e.target.value)}
            />
          </div>
          <Input
            label="Lote"
            icon={<Package size={18} />}
            placeholder="Ex: L-240801"
            value={form.lote}
            onChange={(e) => set('lote', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-md">
            <Input
              label="Fabricação"
              type="date"
              value={form.fabricacao}
              onChange={(e) => set('fabricacao', e.target.value)}
            />
            <Input
              label="Validade"
              type="date"
              value={form.validade}
              onChange={(e) => set('validade', e.target.value)}
            />
          </div>
          <Input
            label="Categoria"
            placeholder="Ex: Bebidas"
            value={form.categoria}
            onChange={(e) => set('categoria', e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={() => window.print()}>
              <Printer size={16} /> Imprimir
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-md">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-md text-[var(--color-on-surface-variant)] uppercase">Preview 80mm</span>
            <span className="text-[10px] font-mono text-[var(--color-outline)]">Ctrl+P imprime</span>
          </div>
          <div className="overflow-x-auto">
            <Label80mm {...form} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
